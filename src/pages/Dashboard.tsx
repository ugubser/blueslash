import React, { useState } from 'react';
import { Plus, Filter, RefreshCw } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';
import Leaderboard from '../components/Leaderboard';
import { useHouseholdTasks } from '../hooks/useTasks';
import type { TaskStatus } from '../types';

const Dashboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const { tasks, loading, refreshTasks } = useHouseholdTasks(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const handleTaskUpdate = () => {
    refreshTasks();
  };

  const filteredTasks = statusFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === statusFilter);

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
                onClick={refreshTasks}
                className="mario-button-blue flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              
              <button
                onClick={() => setShowCreateForm(true)}
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
              {[
                { value: 'all', label: 'All Tasks' },
                { value: 'published', label: 'Available' },
                { value: 'claimed', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'verified', label: 'Verified' },
                { value: 'draft', label: 'Drafts' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value as TaskStatus | 'all')}
                  className={`px-4 py-2 rounded-lg border-2 font-bold text-sm transition-all ${
                    statusFilter === value
                      ? 'border-mario-blue bg-mario-blue text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-mario-blue'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Create Task Form */}
          {showCreateForm && (
            <div className="mb-6">
              <CreateTaskForm
                onTaskCreated={handleTaskUpdate}
                onClose={() => setShowCreateForm(false)}
              />
            </div>
          )}

          {/* Tasks List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : filteredTasks.length > 0 ? (
            <div className="grid gap-6">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="mario-card text-center py-12">
              <div className="text-gray-400 mb-4">
                <Plus size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-bold text-gray-600 mb-2">
                {statusFilter === 'all' ? 'No Tasks Yet' : `No ${statusFilter} tasks`}
              </h3>
              <p className="text-gray-500 mb-4 font-normal">
                {statusFilter === 'all' 
                  ? 'Create your first task to get started!'
                  : `No tasks with status "${statusFilter}"`
                }
              </p>
              {statusFilter === 'all' && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mario-button"
                >
                  Create First Task
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

export default Dashboard;