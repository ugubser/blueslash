import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type FirestoreDataConverter,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { v4 as uuid } from 'uuid';
import { db, storage, functions } from './firebase';
import type {
  DirectMessage,
  KitchenPost,
  KitchenPostAttachment,
  KitchenPostPosition,
} from '../types';

const KITCHEN_POSTS_COLLECTION = 'kitchenPosts';
const DIRECT_MESSAGES_COLLECTION = 'directMessages';

const kitchenPostConverter: FirestoreDataConverter<KitchenPost> = {
  toFirestore: (post) => post,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    const createdAtValue = data.createdAt;
    const updatedAtValue = data.updatedAt;
    const attachmentValue = data.attachment;
    return {
      ...(data as KitchenPost),
      id: snapshot.id,
      createdAt: createdAtValue instanceof Timestamp ? createdAtValue.toDate() : new Date(),
      updatedAt: updatedAtValue instanceof Timestamp ? updatedAtValue.toDate() : new Date(),
      attachment: attachmentValue && attachmentValue !== null ? (attachmentValue as KitchenPostAttachment) : undefined,
    };
  },
};

const directMessageConverter: FirestoreDataConverter<DirectMessage> = {
  toFirestore: (message) => message,
  fromFirestore: (snapshot) => {
    const data = snapshot.data();
    const createdAtValue = data.createdAt;
    const readAtValue = data.readAt;
    return {
      ...(data as DirectMessage),
      id: snapshot.id,
      createdAt: createdAtValue instanceof Timestamp ? createdAtValue.toDate() : new Date(),
      readAt: readAtValue instanceof Timestamp ? readAtValue.toDate() : undefined,
    };
  },
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10MB
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const SUPPORTED_PDF_TYPES = ['application/pdf'];

const generatePosition = (existing: KitchenPost[]): KitchenPostPosition => {
  const maxAttempts = 20;
  const minDistance = 18; // percent
  const randomCoord = () => Math.random() * 70 + 10; // keep within 10% padding

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = { x: randomCoord(), y: randomCoord() };
    const overlaps = existing.some((post) => {
      const dx = Math.abs(post.position.x - candidate.x);
      const dy = Math.abs(post.position.y - candidate.y);
      return dx < minDistance && dy < minDistance;
    });

    if (!overlaps) {
      return candidate;
    }
  }

  return { x: randomCoord(), y: randomCoord() };
};

const makePreview = (markdown: string): string => {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#>*_`\-\[\]!]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  return text.slice(0, 140);
};

const makeTitle = (markdown: string): string => {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.replace(/^#+\s*/, '').trim();
    if (trimmed.length > 0) {
      return trimmed.slice(0, 60);
    }
  }
  return 'Kitchen Note';
};

const uploadAttachment = async (
  householdId: string,
  postId: string,
  file: File,
): Promise<KitchenPostAttachment> => {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('Attachment is too large. Maximum size is 10MB.');
  }

  const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
  const isPdf = SUPPORTED_PDF_TYPES.includes(file.type);

  if (!isImage && !isPdf) {
    throw new Error('Unsupported file type. Upload PNG, JPG, or PDF files.');
  }

  const extension = file.name.split('.').pop() || 'dat';
  const storagePath = `kitchen-posts/${householdId}/${postId}.${extension}`;
  const storageRef = ref(storage, storagePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const url = await getDownloadURL(storageRef);

  return {
    type: isPdf ? 'pdf' : 'image',
    storagePath,
    url,
    fileName: file.name,
  };
};

export interface UpsertKitchenPostInput {
  householdId: string;
  authorId: string;
  authorName: string;
  body: string;
  attachmentFile?: File | null;
  existingPosts?: KitchenPost[];
  postId?: string;
  currentAttachment?: KitchenPostAttachment;
}

export const upsertKitchenPost = async (input: UpsertKitchenPostInput): Promise<KitchenPost> => {
  const {
    householdId,
    authorId,
    authorName,
    body,
    attachmentFile,
    existingPosts = [],
    postId,
    currentAttachment,
  } = input;

  const title = makeTitle(body);
  const preview = makePreview(body);
  const position = postId
    ? existingPosts.find((post) => post.id === postId)?.position
    : generatePosition(existingPosts);

  let attachment: KitchenPostAttachment | undefined = currentAttachment;
  let postDocRef;

  if (postId) {
    postDocRef = doc(db, KITCHEN_POSTS_COLLECTION, postId).withConverter(kitchenPostConverter);
  }

  if (attachmentFile) {
    const targetId = postId ?? uuid();
    attachment = await uploadAttachment(householdId, targetId, attachmentFile);

    if (currentAttachment && currentAttachment.storagePath !== attachment.storagePath) {
      try {
        await deleteObject(ref(storage, currentAttachment.storagePath));
      } catch (error) {
        console.warn('Failed to delete previous attachment:', error);
      }
    }
  }

  if (postId && postDocRef) {
    await updateDoc(postDocRef, {
      body,
      title,
      preview,
      attachment: attachment || null,
      updatedAt: serverTimestamp(),
    });

    const existingPost = existingPosts.find((post) => post.id === postId);
    return {
      id: postId,
      householdId,
      authorId,
      authorName,
      body,
      title,
      preview,
      position: existingPost?.position ?? { x: 50, y: 50 },
      attachment: attachment || undefined,
      createdAt: existingPost?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
  }

  const docId = uuid();
  const attachmentToUse = attachmentFile ? attachment : undefined;

  const now = new Date();
  const positionToUse = position ?? { x: 50, y: 50 };

  await setDoc(doc(db, KITCHEN_POSTS_COLLECTION, docId), {
    householdId,
    authorId,
    authorName,
    body,
    title,
    preview,
    position: positionToUse,
    attachment: attachmentToUse ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return {
    id: docId,
    householdId,
    authorId,
    authorName,
    body,
    title,
    preview,
    position: positionToUse,
    attachment: attachmentToUse,
    createdAt: now,
    updatedAt: now,
  };
};

export const deleteKitchenPost = async (post: KitchenPost): Promise<void> => {
  await deleteDoc(doc(db, KITCHEN_POSTS_COLLECTION, post.id));
  if (post.attachment?.storagePath) {
    try {
      await deleteObject(ref(storage, post.attachment.storagePath));
    } catch (error) {
      console.warn('Failed to delete attachment from storage:', error);
    }
  }
};

export const subscribeToKitchenPosts = (
  householdId: string,
  onPosts: (posts: KitchenPost[]) => void,
): Unsubscribe => {
  const q = query(
    collection(db, KITCHEN_POSTS_COLLECTION).withConverter(kitchenPostConverter),
    where('householdId', '==', householdId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((doc) => doc.data());
    onPosts(posts);
  });
};

export interface SubscribeMessagesOptions {
  householdId: string;
  userId: string;
  limitTo?: number;
  onMessages: (messages: DirectMessage[]) => void;
}

export const subscribeToDirectMessages = ({
  householdId,
  userId,
  limitTo = 50,
  onMessages,
}: SubscribeMessagesOptions): Unsubscribe => {
  const q = query(
    collection(db, DIRECT_MESSAGES_COLLECTION).withConverter(directMessageConverter),
    where('householdId', '==', householdId),
    where('participants', 'array-contains', userId),
    orderBy('createdAt', 'desc'),
    limit(limitTo),
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => doc.data());
    onMessages(messages);
  });
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const messageRef = doc(db, DIRECT_MESSAGES_COLLECTION, messageId);
  await updateDoc(messageRef, {
    readAt: serverTimestamp(),
  });
};

export interface SendDirectMessageInput {
  householdId: string;
  senderId: string;
  recipientId: string;
  body: string;
  gems: number;
}

export interface SendDirectMessageResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

export const sendDirectMessage = async (
  payload: SendDirectMessageInput,
): Promise<SendDirectMessageResponse> => {
  const callable = httpsCallable<SendDirectMessageInput, SendDirectMessageResponse>(
    functions,
    'sendDirectMessage',
  );

  const result = await callable(payload);
  return result.data;
};
