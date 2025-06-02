import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs,
  orderBy,
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskStatus, Verification, GemTransaction } from '../types';
import { updateUserGems } from './auth';
import { v4 as uuidv4 } from 'uuid';

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
  try {
    const taskId = uuidv4();
    const task: Task = {
      ...taskData,
      id: taskId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, 'tasks', taskId), task);

    if (task.status === 'published') {
      await awardGemsForTaskCreation(task.creatorId, task.gems);
    }

    return task;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus, userId?: string): Promise<void> => {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'claimed' && userId) {
      updateData.claimedBy = userId;
    } else if (status === 'published') {
      updateData.claimedBy = null;
    }

    await updateDoc(doc(db, 'tasks', taskId), updateData);

    if (status === 'published') {
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (taskDoc.exists()) {
        const task = taskDoc.data() as Task;
        await awardGemsForTaskCreation(task.creatorId, Math.floor(task.gems * 0.1));
      }
    }
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const verifyTask = async (taskId: string, userId: string, verified: boolean): Promise<void> => {
  try {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }

    const task = taskDoc.data() as Task;
    const existingVerification = task.verifications.find(v => v.userId === userId);

    if (existingVerification) {
      const updatedVerifications = task.verifications.map(v => 
        v.userId === userId 
          ? { ...v, verified, verifiedAt: new Date() }
          : v
      );
      
      await updateDoc(doc(db, 'tasks', taskId), {
        verifications: updatedVerifications,
        updatedAt: new Date()
      });
    } else {
      const newVerification: Verification = {
        userId,
        verified,
        verifiedAt: new Date()
      };

      await updateDoc(doc(db, 'tasks', taskId), {
        verifications: arrayUnion(newVerification),
        updatedAt: new Date()
      });
    }

    await awardGemsForVerification(userId, 3);

    await checkVerificationThreshold(taskId);
  } catch (error) {
    console.error('Error verifying task:', error);
    throw error;
  }
};

export const getHouseholdTasks = async (householdId: string, status?: TaskStatus): Promise<Task[]> => {
  try {
    let tasksQuery = query(
      collection(db, 'tasks'),
      where('householdId', '==', householdId),
      orderBy('dueDate', 'asc')
    );

    if (status) {
      tasksQuery = query(
        collection(db, 'tasks'),
        where('householdId', '==', householdId),
        where('status', '==', status),
        orderBy('dueDate', 'asc')
      );
    }

    const tasksSnapshot = await getDocs(tasksQuery);
    return tasksSnapshot.docs.map(doc => doc.data() as Task);
  } catch (error) {
    console.error('Error getting household tasks:', error);
    throw error;
  }
};

export const getUserTasks = async (userId: string, status?: TaskStatus): Promise<Task[]> => {
  try {
    let tasksQuery = query(
      collection(db, 'tasks'),
      where('claimedBy', '==', userId),
      orderBy('dueDate', 'asc')
    );

    if (status) {
      tasksQuery = query(
        collection(db, 'tasks'),
        where('claimedBy', '==', userId),
        where('status', '==', status),
        orderBy('dueDate', 'asc')
      );
    }

    const tasksSnapshot = await getDocs(tasksQuery);
    return tasksSnapshot.docs.map(doc => doc.data() as Task);
  } catch (error) {
    console.error('Error getting user tasks:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

const checkVerificationThreshold = async (taskId: string): Promise<void> => {
  try {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) return;

    const task = taskDoc.data() as Task;
    
    // Get household member count
    const householdDoc = await getDoc(doc(db, 'households', task.householdId));
    if (!householdDoc.exists()) return;

    const household = householdDoc.data();
    const memberCount = household.members.length;
    const requiredVerifications = Math.ceil(memberCount * 0.5);
    
    const positiveVerifications = task.verifications.filter(v => v.verified).length;

    if (positiveVerifications >= requiredVerifications && task.status === 'completed') {
      await updateTaskStatus(taskId, 'verified');
      
      if (task.claimedBy) {
        await awardGemsForTaskCompletion(task.claimedBy, task.gems);
      }
    }
  } catch (error) {
    console.error('Error checking verification threshold:', error);
  }
};

const awardGemsForTaskCreation = async (userId: string, gems: number): Promise<void> => {
  const creationGems = Math.max(5, Math.floor(gems * 0.1));
  await updateUserGems(userId, creationGems);
  await recordGemTransaction(userId, creationGems, 'task_creation', 'Gems awarded for creating a task');
};

const awardGemsForTaskCompletion = async (userId: string, gems: number): Promise<void> => {
  await updateUserGems(userId, gems);
  await recordGemTransaction(userId, gems, 'task_completion', 'Gems awarded for completing a task');
};

const awardGemsForVerification = async (userId: string, gems: number): Promise<void> => {
  await updateUserGems(userId, gems);
  await recordGemTransaction(userId, gems, 'verification', 'Gems awarded for verifying a task');
};

const recordGemTransaction = async (
  userId: string, 
  amount: number, 
  type: GemTransaction['type'], 
  description: string,
  taskId?: string
): Promise<void> => {
  try {
    const transaction: Omit<GemTransaction, 'id'> = {
      userId,
      taskId,
      amount,
      type,
      description,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'gemTransactions'), transaction);
  } catch (error) {
    console.error('Error recording gem transaction:', error);
  }
};