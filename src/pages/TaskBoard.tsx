import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Clock, Play, CheckCircle, ShieldCheck, FileText } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';
import Leaderboard from '../components/Leaderboard';
import { useHouseholdTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import type { TaskStatus, Task } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';

const TaskBoard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<TaskStatus>>(
    new Set(['published', 'claimed', 'completed', 'draft'])
  );
  const { tasks, loading } = useHouseholdTasks();
  const [pendingFocusTask, setPendingFocusTask] = useState<{ id: string; status?: TaskStatus } | null>(null);
  const [highlightTaskId, setHighlightTaskId] = useState<string | null>(null);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowCreateForm(false);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
  };

  const toggleFilter = (status: TaskStatus) => {
    setActiveFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(status)) {
        newFilters.delete(status);
      } else {
        newFilters.add(status);
      }
      return newFilters;
    });
  };

  const filteredTasks = useMemo(() => tasks
    .filter(task => activeFilters.has(task.status))
    .filter(task => {
      // Draft tasks should only be visible to their creator
      if (task.status === 'draft') {
        return task.creatorId === user?.id;
      }
      return true;
    }), [tasks, activeFilters, user?.id]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const taskId = params.get('taskId');
    const taskStatusParam = params.get('taskStatus');
    const validStatuses: TaskStatus[] = ['draft', 'published', 'claimed', 'completed', 'verified'];
    const taskStatus = validStatuses.includes(taskStatusParam as TaskStatus)
      ? (taskStatusParam as TaskStatus)
      : null;

    if (taskId) {
      if (taskStatus) {
        setActiveFilters(prev => {
          const next = new Set(prev);
          next.add(taskStatus);
          return next;
        });
      }

      setPendingFocusTask({ id: taskId, status: taskStatus ?? undefined });
    }
  }, [location.search]);

  useEffect(() => {
    if (!pendingFocusTask || loading) {
      return;
    }

    const elementId = `task-${pendingFocusTask.id}`;
    const element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    const focusId = pendingFocusTask.id;

    requestAnimationFrame(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightTaskId(focusId);
      setPendingFocusTask(null);
      navigate('/task-board', { replace: true });

      setTimeout(() => {
        setHighlightTaskId(current => (current === focusId ? null : current));
      }, 4000);
    });
  }, [pendingFocusTask, loading, navigate, tasks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Household Tasks
            </h1>

            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingTask(null);
              }}
              className="mario-button flex items-center gap-2 text-xs"
            >
              <Plus size={14} />
              New Task
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white/60 rounded-lg px-3 py-2 mb-3">
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {([
                { status: 'published' as TaskStatus, label: 'Available', icon: Clock },
                { status: 'claimed' as TaskStatus, label: 'In Progress', icon: Play },
                { status: 'completed' as TaskStatus, label: 'Completed', icon: CheckCircle },
                { status: 'verified' as TaskStatus, label: 'Verified', icon: ShieldCheck },
                { status: 'draft' as TaskStatus, label: 'Drafts', icon: FileText }
              ]).map(({ status, label, icon: Icon }) => (
                <button
                  key={status}
                  onClick={() => toggleFilter(status)}
                  className={`px-2.5 py-1.5 text-xs ${
                    activeFilters.has(status)
                      ? 'mario-button-blue'
                      : 'mario-button-blue-muted'
                  }`}
                  title={label}
                >
                  {/* Mobile: Icon only */}
                  <span className="sm:hidden">
                    <Icon size={14} />
                  </span>
                  {/* Tablet/Desktop: Icon + Text */}
                  <span className="hidden sm:flex items-center gap-1.5">
                    <Icon size={12} />
                    <span>{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Create/Edit Task Form */}
          {(showCreateForm || editingTask) && (
            <div className="mb-6">
              <CreateTaskForm
                onTaskCreated={handleCloseForm}
                onClose={handleCloseForm}
                editTask={editingTask || undefined}
              />
            </div>
          )}

          {/* Tasks List */}
          {(showCreateForm || editingTask) ? null : loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid gap-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={() => {}}
                  onEditTask={handleEditTask}
                  isHighlighted={task.id === highlightTaskId}
                />
              ))}
            </div>
          ) : (
            <div className="mario-card text-center py-8">
              <div className="text-gray-400 mb-3">
                <Plus size={40} className="mx-auto" />
              </div>
              <h3 className="text-base font-bold text-gray-600 mb-2">
                {activeFilters.size === 0 ? 'No Filters Selected' : 'No Matching Tasks'}
              </h3>
              <p className="text-gray-500 mb-4 font-normal">
                {activeFilters.size === 0 
                  ? 'Select at least one filter to view tasks'
                  : `No tasks found for the selected filters`
                }
              </p>
              {activeFilters.size > 0 && (
                <button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingTask(null);
                  }}
                  className="mario-button"
                >
                  Create New Task
                </button>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
