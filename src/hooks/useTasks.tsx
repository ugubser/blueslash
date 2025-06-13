import { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '../types';
import { subscribeToHouseholdTasks, subscribeToUserTasks } from '../services/tasks';
import { useAuth } from './useAuth';

export const useHouseholdTasks = (status?: TaskStatus) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.currentHouseholdId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToHouseholdTasks(
      user.currentHouseholdId,
      (tasksData) => {
        setTasks(tasksData);
        setLoading(false);
        setError(null);
      },
      status
    );

    return () => {
      unsubscribe();
    };
  }, [user?.currentHouseholdId, status]);

  return { tasks, loading, error };
};

export const useUserTasks = (status?: TaskStatus) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToUserTasks(
      user.id,
      (tasksData) => {
        setTasks(tasksData);
        setLoading(false);
        setError(null);
      },
      status
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id, status]);

  return { tasks, loading, error };
};