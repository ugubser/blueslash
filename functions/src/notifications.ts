import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  requireInteraction?: boolean;
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

    console.log(`✅ Push notification sent successfully to ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send push notification to ${userId}:`, error);

    // Remove invalid tokens to clean up the database
    if (error instanceof Error && error.message.includes('not-registered')) {
      await admin.firestore().collection('users').doc(userId).update({
        notificationToken: null,
        'notificationPreferences.push': false
      });
      console.log(`🧹 Removed invalid token for user ${userId}`);
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

    const existingNotifications = await notificationsQuery.get();
    const batch = admin.firestore().batch();

    existingNotifications.docs.forEach(doc => {
      batch.update(doc.ref, {
        cancelled: true,
        sent: true,
        cancelledAt: new Date()
      });
    });

    await batch.commit();
    console.log(`Cancelled reminders for task ${taskId}`);
  }
});

// Function to process scheduled notifications
async function processScheduledNotifications() {
  console.log('🔍 Checking for scheduled notifications to send...');

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000)); // Add buffer for processing

  console.log(`Current time: ${now}, checking until: ${oneHourFromNow}`);

  // Query for notifications that are due to be sent
  const notificationsQuery = admin.firestore()
    .collection('scheduledNotifications')
    .where('scheduled', '==', true)
    .where('sent', '==', false)
    .where('reminderDate', '<=', oneHourFromNow);

  const notifications = await notificationsQuery.get();

  // Also get overdue notifications that haven't been sent yet
  const overdueQuery = admin.firestore()
    .collection('scheduledNotifications')
    .where('scheduled', '==', true)
    .where('sent', '==', false);

  const allPending = await overdueQuery.get();
  console.log(`Found ${allPending.size} total pending notifications to check`);

  if (allPending.size > 0) {
    allPending.docs.forEach((doc, index) => {
      const data = doc.data() as any;
      console.log(`Notification ${index + 1}:`, {
        taskTitle: data.taskTitle,
        daysUntilDue: data.daysUntilDue,
        reminderDate: data.reminderDate,
        userId: data.userId
      });
    });
  }

  console.log(`Found ${notifications.size} notifications ready to send now`);

  const batch = admin.firestore().batch();
  const sendPromises: Promise<boolean>[] = [];

  for (const doc of notifications.docs) {
    const notificationData = doc.data() as any;

    // Helper function to get friendly time description
    const getTimeText = (days: number) => {
      if (days === 1) return 'tomorrow';
      if (days === 2) return 'in 2 days';
      return `in ${days} days`;
    };

    const payload: NotificationPayload = {
      title: 'Task Reminder',
      body: `"${notificationData.taskTitle}" is due ${getTimeText(notificationData.daysUntilDue)}!`,
      data: {
        taskId: notificationData.taskId,
        type: 'task-reminder',
        daysUntilDue: notificationData.daysUntilDue,
        householdId: notificationData.householdId
      },
      requireInteraction: true
    };

    // Send notification
    const sendPromise = sendPushNotification(notificationData.userId, payload);
    sendPromises.push(sendPromise);

    // Mark as sent
    batch.update(doc.ref, {
      sent: true,
      sentAt: new Date()
    });
  }

  // Wait for all notifications to be sent and update database
  const results = await Promise.allSettled(sendPromises);
  await batch.commit();

  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const failureCount = results.length - successCount;

  console.log(`📤 Notification batch complete: ${successCount} sent, ${failureCount} failed`);

  return { sent: successCount, failed: failureCount };
}

// Scheduled function to run every hour and send due notifications
export const sendScheduledNotifications = onSchedule('0 * * * *', async (event) => {
  await processScheduledNotifications();
});

// Manual trigger for testing scheduled notifications
export const triggerScheduledNotifications = onCall(async (request) => {
  console.log('🧪 Manual trigger for scheduled notifications');
  return await processScheduledNotifications();
});

// Test function to send a notification immediately (for debugging)
export const sendTestNotification = onCall(async (request) => {
  // Validate required parameters
  if (!request.data) {
    throw new Error('Request data is required');
  }

  const { userId, title, body } = request.data;

  if (!userId || !title || !body) {
    throw new Error('userId, title, and body are required');
  }

  const payload: NotificationPayload = {
    title,
    body,
    data: { test: 'true' }
  };

  const success = await sendPushNotification(userId, payload);

  return { success };
});