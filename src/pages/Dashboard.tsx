import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';
import Leaderboard from '../components/Leaderboard';
import { useHouseholdTasks } from '../hooks/useTasks';
import { useAuth } from '../hooks/useAuth';
import type { TaskStatus, Task } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<TaskStatus>>(
    new Set(['published', 'completed'])
  );
  const { tasks, loading } = useHouseholdTasks();

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

  const filteredTasks = tasks
    .filter(task => activeFilters.has(task.status))
    .filter(task => {
      // Draft tasks should only be visible to their creator
      if (task.status === 'draft') {
        return task.creatorId === user?.id;
      }
      return true;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Household Tasks
              </h1>
              <p className="text-gray-600 font-normal">
                Manage and complete tasks to earn gems!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingTask(null);
                }}
                className="mario-button flex items-center gap-2"
              >
                <Plus size={16} />
                New Task
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mario-card mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Filter size={20} className="text-mario-blue" />
              <h3 className="font-bold text-gray-800">Filter Tasks</h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {([
                { status: 'published' as TaskStatus, label: 'Available' },
                { status: 'claimed' as TaskStatus, label: 'In Progress' },
                { status: 'completed' as TaskStatus, label: 'Completed' },
                { status: 'verified' as TaskStatus, label: 'Verified' },
                { status: 'draft' as TaskStatus, label: 'Drafts' }
              ]).map(({ status, label }) => (
                <button
                  key={status}
                  onClick={() => toggleFilter(status)}
                  className={`px-3 py-2 rounded-lg font-bold text-sm transition-colors ${
                    activeFilters.has(status)
                      ? 'bg-mario-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
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
            <div className="grid gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={() => {}}
                  onEditTask={handleEditTask}
                />
              ))}
            </div>
          ) : (
            <div className="mario-card text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">
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
        <div className="lg:w-96">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;