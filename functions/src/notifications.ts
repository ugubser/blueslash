import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const ALLOWED_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5003',
  'http://127.0.0.1:5003',
  'https://blueslash-7bcdd.web.app',
  'https://blueslash-7bcdd.firebaseapp.com',
  'https://blueslash.tribecans.com',
  /^https:\/\/192\.168\.\d+\.\d+:(5173|5003)$/,
];

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

type NotificationPreferenceKey =
  | 'taskReminders'
  | 'verificationRequests'
  | 'taskAlerts'
  | 'kitchenPosts'
  | 'directMessages';

interface SendNotificationOptions {
  requiredPreferences?: NotificationPreferenceKey[];
}

const buildTaskTargetUrl = (taskId: string, taskStatus?: string): string => {
  const params = new URLSearchParams({ taskId });
  if (taskStatus) {
    params.set('taskStatus', taskStatus);
  }
  return `/dashboard?${params.toString()}`;
};

// Send push notification to a specific user
export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
  options: SendNotificationOptions = {}
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

    const preferences = userData.notificationPreferences || {};
    if (options.requiredPreferences && options.requiredPreferences.length > 0) {
      const shouldSend = options.requiredPreferences.every((preference) => {
        const value = preferences[preference];
        if (preference === 'taskAlerts' || preference === 'kitchenPosts' || preference === 'directMessages') {
          return value !== false;
        }
        return Boolean(value);
      });

      if (!shouldSend) {
        console.log(`User ${userId} opted out of ${options.requiredPreferences.join(', ')} notifications`);
        return false;
      }
    }

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

async function notifyHouseholdAboutAvailableTask(taskId: string, taskData: any): Promise<void> {
  try {
    const householdId = taskData.householdId;
    if (!householdId) {
      console.warn(`Task ${taskId} is missing householdId, skipping availability notification`);
      return;
    }

    const householdSnapshot = await admin.firestore().collection('households').doc(householdId).get();
    if (!householdSnapshot.exists) {
      console.warn(`Household ${householdId} not found for task ${taskId}`);
      return;
    }

    const householdData = householdSnapshot.data() as { members?: string[] } | undefined;
    const memberIds = householdData?.members || [];

    const recipients = memberIds.filter((memberId) =>
      memberId && memberId !== taskData.creatorId && memberId !== taskData.claimedBy
    );

    if (recipients.length === 0) {
      console.log(`No recipients found for new task notification ${taskId}`);
      return;
    }

    const targetUrl = buildTaskTargetUrl(taskId, 'published');

    const payload: NotificationPayload = {
      title: 'New Task Available',
      body: `"${taskData.title}" is ready to claim.`,
      data: {
        taskId,
        taskTitle: taskData.title,
        taskStatus: 'published',
        type: 'task-new',
        householdId,
        targetUrl,
      },
      requireInteraction: true,
    };

    const results = await Promise.allSettled(
      recipients.map((userId) =>
        sendPushNotification(userId, payload, { requiredPreferences: ['taskAlerts'] })
      )
    );

    const sent = results.filter((result) => result.status === 'fulfilled' && result.value).length;
    const skipped = recipients.length - sent;

    console.log(`📨 Sent new task notification for task ${taskId} to ${sent} members (${skipped} skipped)`);
  } catch (error) {
    console.error(`Failed to send new task notification for task ${taskId}:`, error);
  }
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const CATCH_UP_DELAY_MINUTES = 5;

const toDate = (value: any): Date => {
  if (!value) {
    return new Date();
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
};

const getFriendlyDueText = (now: Date, dueDate: Date): string => {
  const diffMs = dueDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'now';
  }

  const diffHours = diffMs / (60 * 60 * 1000);
  if (diffHours < 1) {
    return 'within the next hour';
  }

  if (diffHours < 6) {
    const roundedHours = Math.round(diffHours);
    return `in about ${roundedHours} hour${roundedHours === 1 ? '' : 's'}`;
  }

  if (diffHours < 24) {
    return 'later today';
  }

  if (diffHours < 48) {
    return 'tomorrow';
  }

  const diffDays = Math.ceil(diffHours / 24);
  return `in ${diffDays} days`;
};

// Schedule notifications when a task is claimed
export const scheduleTaskReminders = onDocumentWritten('tasks/{taskId}', async (event) => {
  const change = event.data;
  const taskId = event.params.taskId;
  const before = change?.before.exists ? change.before.data() as any : undefined;
  const after = change?.after.exists ? change.after.data() as any : undefined;

  if (!after) {
    console.log(`Task ${taskId} deleted, skipping reminder scheduling`);
    return;
  }

  const statusBefore = before?.status;
  const statusAfter = after.status;

  if (statusAfter === 'published' && statusBefore !== 'published') {
    await notifyHouseholdAboutAvailableTask(taskId, after);
  }

  if (!before) {
    // Nothing else to do on initial creation unless the task was claimed later
    return;
  }

  // Check if task was just claimed (status changed from published to claimed)
  if (before.status !== 'claimed' && after.status === 'claimed' && after.claimedBy) {
    const dueDateRaw = toDate(after.dueDate);
    const dueDate = new Date(dueDateRaw);
    // Treat due dates as end-of-day to better align with user expectations when only a date is supplied
    dueDate.setHours(23, 59, 0, 0);
    const now = new Date();

    console.log(`Task ${taskId} was claimed by ${after.claimedBy}, scheduling reminders`);
    console.log(`Due date: ${dueDate}, Current time: ${now}`);

    // Calculate reminder dates: 7 days, 4 days, 2 days, 1 day before due date
    const reminderDays = [7, 4, 2, 1];
    const reminders = [];
    let catchUpScheduled = false;

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
          householdId: after.householdId,
          dueDate,
          isCatchUp: false,
          taskStatus: after.status,
        });
      } else {
        console.log(`❌ Skipping reminder for ${days} days before (date has passed)`);

        // If the reminder would have fired in the past but the task is still pending, schedule an immediate catch-up reminder
        if (!catchUpScheduled && dueDate > now) {
          const catchUpDate = new Date(now.getTime() + CATCH_UP_DELAY_MINUTES * 60 * 1000);
          const daysRemaining = Math.max(0, Math.floor((dueDate.getTime() - now.getTime()) / DAY_IN_MS));

          console.log(`⚠️  Scheduling catch-up reminder for task ${taskId} at ${catchUpDate}`);
          reminders.push({
            taskId,
            userId: after.claimedBy,
            reminderDate: catchUpDate,
            daysUntilDue: daysRemaining,
            taskTitle: after.title,
            householdId: after.householdId,
            dueDate,
            isCatchUp: true,
            taskStatus: after.status,
          });
          catchUpScheduled = true;
        }
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
    const dueDate = toDate(notificationData.dueDate);
    const timeText = getFriendlyDueText(now, dueDate);

    const taskStatus = notificationData.taskStatus || 'claimed';
    const targetUrl = buildTaskTargetUrl(notificationData.taskId, taskStatus);

    const payload: NotificationPayload = {
      title: 'Task Reminder',
      body: `"${notificationData.taskTitle}" is due ${timeText}!`,
      data: {
        taskId: notificationData.taskId,
        taskTitle: notificationData.taskTitle,
        taskStatus,
        type: 'task-reminder',
        daysUntilDue: notificationData.daysUntilDue,
        householdId: notificationData.householdId,
        dueDate: dueDate.toISOString(),
        isCatchUp: notificationData.isCatchUp ? 'true' : 'false',
        targetUrl,
      },
      requireInteraction: true
    };

    // Send notification
    const sendPromise = sendPushNotification(notificationData.userId, payload, {
      requiredPreferences: ['taskReminders']
    });
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
export const triggerScheduledNotifications = onCall({
  cors: ALLOWED_CORS_ORIGINS,
}, async (request) => {
  console.log('🧪 Manual trigger for scheduled notifications');
  return await processScheduledNotifications();
});

// Test function to send a notification immediately (for debugging)
export const sendTestNotification = onCall({
  cors: ALLOWED_CORS_ORIGINS,
}, async (request) => {
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
