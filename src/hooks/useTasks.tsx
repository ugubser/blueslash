import { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '../types';
import { getHouseholdTasks, getUserTasks } from '../services/tasks';
import { useAuth } from './useAuth';

export const useHouseholdTasks = (status?: TaskStatus) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = async () => {
    if (!user?.householdId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tasksData = await getHouseholdTasks(user.householdId, status);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading household tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, [user, status]);

  return { tasks, loading, error, refreshTasks };
};

export const useUserTasks = (status?: TaskStatus) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = async () => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tasksData = await getUserTasks(user.id, status);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading user tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, [user, status]);

  return { tasks, loading, error, refreshTasks };
};