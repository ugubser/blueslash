import React, { useState, useEffect } from 'react';
import { Plus, Coins, Calendar, FileText, Edit } from 'lucide-react';
import { createTask, updateTask } from '../services/tasks';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import type { Task } from '../types';

interface CreateTaskFormProps {
  onTaskCreated?: () => void;
  onClose?: () => void;
  editTask?: Task;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ onTaskCreated, onClose, editTask }) => {
  const { user } = useAuth();
  const { household } = useHousehold();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [gems, setGems] = useState(10);
  const [isDraft, setIsDraft] = useState(true);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editTask;

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setDueDate(editTask.dueDate.toISOString().split('T')[0]);
      setGems(editTask.gems);
      setIsDraft(editTask.status === 'draft');
    }
  }, [editTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || (!isEditing && !household) || !title.trim()) return;

    try {
      setLoading(true);
      
      if (isEditing && editTask) {
        // Update existing task
        await updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim(),
          status: isDraft ? 'draft' : 'published',
          dueDate: new Date(dueDate || Date.now() + 3 * 24 * 60 * 60 * 1000),
          gems
        });
      } else {
        // Create new task
        await createTask({
          householdId: household!.id,
          creatorId: user.id,
          title: title.trim(),
          description: description.trim(),
          status: isDraft ? 'draft' : 'published',
          dueDate: new Date(dueDate || Date.now() + 3 * 24 * 60 * 60 * 1000),
          gems,
          verifications: []
        });
      }

      if (!isEditing) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setGems(10);
        setIsDraft(true);
      }
      
      onTaskCreated?.();
      onClose?.();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} task:`, error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="mario-card">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-6">
          {isEditing ? (
            <Edit className="text-mario-blue" size={24} />
          ) : (
            <Plus className="text-mario-blue" size={24} />
          )}
          <h2 className="text-xl font-bold text-gray-800">
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mario-input"
              placeholder="What needs to be done?"
              required
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mario-textarea"
              placeholder="Provide detailed instructions, including any specific requirements or notes..."
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">
              Rich descriptions help others understand the task better and earn more gems!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate || getDefaultDueDate()}
                onChange={(e) => setDueDate(e.target.value)}
                className="mario-input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Coins size={16} className="inline mr-1" />
                Gem Reward
              </label>
              <select
                value={gems}
                onChange={(e) => setGems(Number(e.target.value))}
                className="mario-input"
              >
                <option value={5}>5 gems - Quick task</option>
                <option value={10}>10 gems - Standard task</option>
                <option value={15}>15 gems - Detailed task</option>
                <option value={20}>20 gems - Complex task</option>
                <option value={25}>25 gems - Major task</option>
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="isDraft"
                checked={isDraft}
                onChange={(e) => setIsDraft(e.target.checked)}
                className="w-4 h-4 text-mario-blue"
              />
              <label htmlFor="isDraft" className="text-sm font-bold text-gray-700">
                Save as draft
              </label>
            </div>
            <p className="text-xs text-gray-600">
              {isDraft 
                ? "Draft tasks are only visible to you until published. No gems awarded yet."
                : "Published tasks are visible to all household members and you'll earn creation gems!"
              }
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="mario-button flex items-center gap-2 flex-1"
          >
            {loading ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <Plus size={16} />
            )}
            {isEditing 
              ? (isDraft ? 'Update Draft' : 'Update & Publish')
              : (isDraft ? 'Save Draft' : 'Create & Publish')
            }
          </button>
          
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="mario-button-blue flex items-center gap-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateTaskForm;