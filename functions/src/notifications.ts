import * as admin from 'firebase-admin';
import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onDocumentUpdated} from 'firebase-functions/v2/firestore';
import {onSchedule} from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}


// Send push notification to a specific user
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // Get user's notification token
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.notificationToken || !userData?.notificationPreferences?.push) {
      console.log(`User ${userId} does not have push notifications enabled`);
      return false;
    }

    const token = userData.notificationToken;
    
    // Check if this is an emulator token
    if (token.startsWith('emulator-token-')) {
      console.log(`🔧 Emulator mode: Simulating notification send to ${userId}`);
      console.log(`📧 Title: ${payload.title}`);
      console.log(`📝 Body: ${payload.body}`);
      console.log(`🎯 Data:`, payload.data);
      
      // In emulator mode, we just log and return success
      return true;
    }

    // Use Firebase Admin SDK for messaging in production
    const message = {
      token: token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: payload.data ? Object.fromEntries(
        Object.entries(payload.data).map(([key, value]) => [key, String(value)])
      ) : {},
      webpush: {
        notification: {
          icon: payload.icon || '/icons/icon-192x192.png',
          badge: payload.badge || '/icons/badge-72x72.png',
          requireInteraction: payload.requireInteraction !== false,
          actions: payload.actions || [
            {
              action: 'view',
              title: 'View Task'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ]
        }
      }
    };

    await admin.messaging().send(message);

    console.log(`Push notification sent successfully to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send push notification to user ${userId}:`, error);
    
    // If token is invalid, remove it from the user document
    if (error instanceof Error && error.message.includes('410')) {
      await admin.firestore().collection('users').doc(userId).update({
        notificationToken: null,
        'notificationPreferences.push': false
      });
      console.log(`Removed invalid token for user ${userId}`);
    }
    
    return false;
  }
}

// Schedule notifications when a task is claimed
export const scheduleTaskReminders = onDocumentUpdated('tasks/{taskId}', async (event) => {
  const change = event.data;
  const taskId = event.params.taskId;
  const before = change?.before.data();
  const after = change?.after.data();
  
  if (!before || !after) return;
  
  // Check if task was just claimed (status changed from published to claimed)
  if (before.status !== 'claimed' && after.status === 'claimed' && after.claimedBy) {
    const dueDate = after.dueDate.toDate();
    const now = new Date();
    
    console.log(`Task ${taskId} was claimed by ${after.claimedBy}, scheduling reminders`);
    
    // Calculate reminder dates: 7 days, 4 days, 2 days, 1 day before due date
    const reminderDays = [7, 4, 2, 1];
    const reminders = [];
    
    for (const days of reminderDays) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      // Only schedule if reminder date is in the future
      if (reminderDate > now) {
        reminders.push({
          taskId,
          userId: after.claimedBy,
          reminderDate,
          daysUntilDue: days,
          taskTitle: after.title,
          householdId: after.householdId
        });
      }
    }
    
    // Store scheduled reminders in Firestore
    const batch = admin.firestore().batch();
    
    for (const reminder of reminders) {
      const reminderRef = admin.firestore().collection('scheduledNotifications').doc();
      batch.set(reminderRef, {
        ...reminder,
        type: 'task-reminder',
        scheduled: true,
        sent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    await batch.commit();
    console.log(`Scheduled ${reminders.length} reminders for task ${taskId}`);
  }
  
  // Cancel reminders if task is completed or unassigned
  if ((before.status === 'claimed' && after.status !== 'claimed') || 
      after.status === 'completed' || after.status === 'verified') {
    
    // Mark existing notifications as cancelled
    const notificationsQuery = admin.firestore()
      .collection('scheduledNotifications')
      .where('taskId', '==', taskId)
      .where('sent', '==', false);
    
    const notifications = await notificationsQuery.get();
    const batch = admin.firestore().batch();
    
    notifications.docs.forEach(doc => {
      batch.update(doc.ref, { 
        scheduled: false, 
        cancelled: true,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`Cancelled reminders for task ${taskId}`);
  }
});

// Daily function to send scheduled notifications
export const sendScheduledNotifications = onSchedule('every 1 hours', async (event) => {
  console.log('Checking for scheduled notifications to send...');
  
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  
  // Find notifications scheduled to be sent within the next hour
  const notificationsQuery = admin.firestore()
    .collection('scheduledNotifications')
    .where('scheduled', '==', true)
    .where('sent', '==', false)
    .where('reminderDate', '<=', oneHourFromNow);
  
  const notifications = await notificationsQuery.get();
  
  console.log(`Found ${notifications.size} notifications to process`);
  
  const batch = admin.firestore().batch();
  const sendPromises: Promise<boolean>[] = [];
  
  for (const doc of notifications.docs) {
    const notification = doc.data() as any;
    
    // Create appropriate message based on days until due
    const getDaysText = (days: number) => {
      if (days === 1) return 'tomorrow';
      if (days === 7) return 'in 1 week';
      return `in ${days} days`;
    };
    
    const payload: NotificationPayload = {
      title: 'Task Reminder',
      body: `"${notification.taskTitle}" is due ${getDaysText(notification.daysUntilDue)}!`,
      data: {
        taskId: notification.taskId,
        type: 'task-reminder',
        daysUntilDue: notification.daysUntilDue,
        householdId: notification.householdId
      },
      requireInteraction: true
    };
    
    // Send the notification
    const sendPromise = sendPushNotification(notification.userId, payload);
    sendPromises.push(sendPromise);
    
    // Mark as sent
    batch.update(doc.ref, {
      sent: true,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  
  // Wait for all notifications to be sent and update the database
  const results = await Promise.allSettled(sendPromises);
  await batch.commit();
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failureCount = results.length - successCount;
  
  console.log(`Notifications sent: ${successCount} successful, ${failureCount} failed`);
});

// Manual function to send immediate notification (for testing)
export const sendTestNotification = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const { userId, title, body } = request.data;
  
  if (!userId || !title || !body) {
    throw new HttpsError('invalid-argument', 'Missing required parameters');
  }
  
  const payload: NotificationPayload = {
    title,
    body,
    data: { test: true }
  };
  
  const success = await sendPushNotification(userId, payload);
  
  return { success };
});