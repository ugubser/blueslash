import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { sendNotification } from './notifications';

if (!admin.apps.length) {
  admin.initializeApp();
}

interface SendDirectMessageRequest {
  householdId: string;
  recipientId: string;
  body: string;
  gems: number;
}

const db = getFirestore();

const buildKitchenPostUrl = (postId: string): string => {
  const params = new URLSearchParams({ postId });
  return `/kitchen-board?${params.toString()}`;
};

const buildDirectMessageUrl = (messageId: string): string => {
  const params = new URLSearchParams({ inbox: '1', messageId });
  return `/kitchen-board?${params.toString()}`;
};

export const sendDirectMessage = onCall<SendDirectMessageRequest>({ cors: true }, async (request) => {
  const authUser = request.auth;
  if (!authUser) {
    throw new HttpsError('unauthenticated', 'You must be signed in to send messages.');
  }

  const { householdId, recipientId, body, gems } = request.data;

  if (!householdId || !recipientId || typeof body !== 'string') {
    throw new HttpsError('invalid-argument', 'Missing required fields.');
  }

  if (body.trim().length === 0) {
    throw new HttpsError('invalid-argument', 'Message cannot be empty.');
  }

  if (body.length > 2000) {
    throw new HttpsError('invalid-argument', 'Message is too long.');
  }

  if (gems < 0) {
    throw new HttpsError('invalid-argument', 'Gems amount must be positive.');
  }

  const senderId = authUser.uid;

  const householdSnap = await db.collection('households').doc(householdId).get();
  if (!householdSnap.exists) {
    throw new HttpsError('not-found', 'Household not found.');
  }

  const householdData = householdSnap.data() as { members?: string[] } | undefined;
  if (!householdData?.members?.includes(senderId) || !householdData.members.includes(recipientId)) {
    throw new HttpsError('permission-denied', 'Both sender and recipient must belong to the household.');
  }

  const senderRef = db.collection('users').doc(senderId);
  const recipientRef = db.collection('users').doc(recipientId);

  const result = await db.runTransaction(async (transaction) => {
    const [senderSnap, recipientSnap] = await Promise.all([
      transaction.get(senderRef),
      transaction.get(recipientRef),
    ]);

    if (!senderSnap.exists || !recipientSnap.exists) {
      throw new HttpsError('not-found', 'User records missing.');
    }

    const senderData = senderSnap.data() as { gems?: number; displayName?: string };
    const recipientData = recipientSnap.data() as { gems?: number; displayName?: string };
    const senderGems = senderData.gems ?? 0;
    const senderName = senderData.displayName ?? 'Household member';
    const recipientName = recipientData.displayName ?? 'Household member';

    if (gems > senderGems) {
      throw new HttpsError('failed-precondition', 'Not enough gems to send this amount.');
    }

    const messageRef = db.collection('directMessages').doc();
    const createdAt = FieldValue.serverTimestamp();

    transaction.set(messageRef, {
      householdId,
      senderId,
      recipientId,
      participants: [senderId, recipientId],
      body,
      gems,
      createdAt,
    });

    if (gems > 0) {
      transaction.update(senderRef, { gems: senderGems - gems });

      const recipientGems = recipientData.gems ?? 0;
      transaction.update(recipientRef, { gems: recipientGems + gems });

      const transactionsRef = db.collection('gemTransactions');
      const now = FieldValue.serverTimestamp();

      transaction.set(transactionsRef.doc(), {
        userId: senderId,
        amount: -gems,
        type: 'gift_sent',
        description: `Gift sent to ${recipientName}`,
        createdAt: now,
      });

      transaction.set(transactionsRef.doc(), {
        userId: recipientId,
        amount: gems,
        type: 'gift_received',
        description: `Gift received from ${senderName}`,
        createdAt: now,
      });
    }

    return { messageId: messageRef.id };
  });

  return { success: true, messageId: result.messageId };
});

export const onKitchenPostCreated = onDocumentCreated('kitchenPosts/{postId}', async (event) => {
  const postData = event.data?.data() as any;
  if (!postData) return;

  const householdId = postData.householdId as string;
  const authorId = postData.authorId as string;

  const householdSnap = await db.collection('households').doc(householdId).get();
  if (!householdSnap.exists) {
    console.warn('Kitchen post created for unknown household', householdId);
    return;
  }

  const householdData = householdSnap.data() as { members?: string[] } | undefined;
  const members = householdData?.members ?? [];

  const recipients = members.filter((memberId) => memberId !== authorId);
  if (recipients.length === 0) return;

  const payload = {
    title: 'New Kitchen Board Post',
    body: `${postData.authorName || 'A household member'} posted "${postData.title}"`,
    data: {
      type: 'kitchen-post',
      postId: event.params.postId,
      householdId,
      targetUrl: buildKitchenPostUrl(event.params.postId),
    },
    requireInteraction: false,
  } as const;

  await Promise.allSettled(
    recipients.map((userId) =>
      sendNotification(userId, payload, { requiredPreferences: ['kitchenPosts'] }),
    ),
  );
});

export const onDirectMessageCreated = onDocumentCreated('directMessages/{messageId}', async (event) => {
  const messageData = event.data?.data() as any;
  if (!messageData) return;

  const recipientId = messageData.recipientId as string;
  const senderId = messageData.senderId as string;
  const householdId = messageData.householdId as string;

  const senderSnap = await db.collection('users').doc(senderId).get();
  const senderName = senderSnap.exists ? (senderSnap.data() as any).displayName || 'Household member' : 'Household member';

  const payload = {
    title: `New message from ${senderName}`,
    body: messageData.gems > 0
      ? `${senderName} sent you ${messageData.gems} gems.`
      : `${senderName} sent you a note.`,
    data: {
      type: 'direct-message',
      messageId: event.params.messageId,
      householdId,
      targetUrl: buildDirectMessageUrl(event.params.messageId),
    },
    requireInteraction: false,
  } as const;

  await sendNotification(recipientId, payload, { requiredPreferences: ['directMessages'] });
});
