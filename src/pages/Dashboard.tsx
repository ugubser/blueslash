import React, { useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import CreateTaskForm from '../components/CreateTaskForm';
import Leaderboard from '../components/Leaderboard';
import { useHouseholdTasks } from '../hooks/useTasks';
import type { TaskStatus, Task } from '../types';

const Dashboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const { tasks, loading } = useHouseholdTasks(
    statusFilter === 'all' ? undefined : statusFilter
  );

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowCreateForm(false);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
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
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
                className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg font-bold text-gray-700 focus:border-mario-blue focus:outline-none hover:border-mario-blue transition-colors appearance-none cursor-pointer"
              >
                <option value="all">All Tasks</option>
                <option value="published">Available</option>
                <option value="claimed">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="draft">Drafts</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
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
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingTask(null);
                  }}
                  className="mario-button"
                >
                  Create First Task
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