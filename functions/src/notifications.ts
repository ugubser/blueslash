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
    console.log(`Due date: ${dueDate}, Current time: ${now}`);
    
    // Calculate reminder dates: 7 days, 4 days, 2 days, 1 day before due date
    const reminderDays = [7, 4, 2, 1];
    const reminders = [];
    
    for (const days of reminderDays) {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      
      console.log(`Checking reminder ${days} days before: ${reminderDate} (now: ${now})`);
      
      // Only schedule if reminder date is in the future
      if (reminderDate > now) {
        console.log(`✅ Scheduling reminder for ${days} days before due date`);
        reminders.push({
          taskId,
          userId: after.claimedBy,
          reminderDate,
          daysUntilDue: days,
          taskTitle: after.title,
          householdId: after.householdId
        });
      } else {
        console.log(`❌ Skipping reminder for ${days} days before (date has passed)`);
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
        createdAt: new Date()
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
        cancelledAt: new Date()
      });
    });
    
    await batch.commit();
    console.log(`Cancelled reminders for task ${taskId}`);
  }
});

// Shared notification checking logic
async function checkAndSendScheduledNotifications() {
  console.log('Checking for scheduled notifications to send...');
  
  const now = new Date();
  const checkWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Look 7 days ahead for testing
  
  console.log(`Checking for notifications between now (${now}) and ${checkWindow}`);
  
  // Find notifications scheduled to be sent within the check window
  const notificationsQuery = admin.firestore()
    .collection('scheduledNotifications')
    .where('scheduled', '==', true)
    .where('sent', '==', false)
    .where('reminderDate', '<=', checkWindow);
  
  const notifications = await notificationsQuery.get();
  
  // Debug: Let's also check all scheduled notifications regardless of date
  const allScheduledQuery = admin.firestore()
    .collection('scheduledNotifications')
    .where('scheduled', '==', true)
    .where('sent', '==', false);
  
  const allScheduled = await allScheduledQuery.get();
  console.log(`Total scheduled notifications in database: ${allScheduled.size}`);
  
  if (allScheduled.size > 0) {
    allScheduled.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Scheduled notification ${index + 1}:`, {
        taskTitle: data.taskTitle,
        reminderDate: data.reminderDate,
        daysUntilDue: data.daysUntilDue,
        userId: data.userId
      });
    });
  }
  
  console.log(`Found ${notifications.size} notifications to process in time window`);
  
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
      sentAt: new Date()
    });
  }
  
  // Wait for all notifications to be sent and update the database
  const results = await Promise.allSettled(sendPromises);
  await batch.commit();
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failureCount = results.length - successCount;
  
  console.log(`Notifications sent: ${successCount} successful, ${failureCount} failed`);
  
  return { sent: successCount, failed: failureCount };
}

// Scheduled function (runs automatically every hour)
export const sendScheduledNotifications = onSchedule('every 1 hours', async (event) => {
  await checkAndSendScheduledNotifications();
});

// Manual callable function (for testing)
export const triggerScheduledNotifications = onCall(async (request) => {
  console.log('Manual trigger of scheduled notifications check');
  return await checkAndSendScheduledNotifications();
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