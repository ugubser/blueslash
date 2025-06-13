import React, { useState, useEffect } from 'react';
import { Plus, Coins, Calendar, FileText, Edit, Repeat, Brain, Loader } from 'lucide-react';
import { createTask, updateTask } from '../services/tasks';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Task, RecurrenceConfig } from '../types';

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calculatingGems, setCalculatingGems] = useState(false);
  const [gemCalculationError, setGemCalculationError] = useState<string | null>(null);
  const [hasUsedAI, setHasUsedAI] = useState(false);

  const isEditing = !!editTask;
  
  // Determine if gem editing should be disabled or hidden
  const isGemEditingDisabled = !isEditing && hasUsedAI && household?.allowGemOverride === false;
  const shouldHideGemInput = household?.allowGemOverride === false;

  // Populate form when editing
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description);
      setDueDate(editTask.dueDate.toISOString().split('T')[0]);
      setGems(editTask.gems);
      setIsDraft(editTask.status === 'draft');
      setIsRecurring(!!editTask.recurrence);
      setHasUsedAI(false); // Reset AI flag when editing
      setGemCalculationError(null);
      if (editTask.recurrence) {
        if (editTask.recurrence.type !== 'custom') {
          setRecurrenceType(editTask.recurrence.type);
        }
        setRecurrenceInterval(editTask.recurrence.interval);
      }
    }
  }, [editTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || (!isEditing && !household) || !title.trim()) return;

    try {
      setLoading(true);
      
      let finalGems = gems;
      
      // Auto-calculate gems if publishing and overrides are not allowed
      if (!isDraft && household?.allowGemOverride === false && description.trim() && 
          (!isEditing || (isEditing && editTask?.status === 'draft'))) {
        try {
          setCalculatingGems(true);
          const functions = getFunctions();
          const calculateTaskGems = httpsCallable(functions, 'calculateTaskGems');
          
          const result = await calculateTaskGems({
            taskDescription: description,
            gemPrompt: household?.gemPrompt
          });
          
          const data = result.data as { success: boolean; gems?: number; error?: string };
          
          if (data.success && data.gems) {
            finalGems = data.gems;
            setGems(data.gems);
          }
        } catch (error) {
          console.error('Error auto-calculating gems:', error);
          // Continue with original gem value if calculation fails
        } finally {
          setCalculatingGems(false);
        }
      }
      
      const recurrence: RecurrenceConfig | undefined = isRecurring ? {
        type: recurrenceType,
        interval: recurrenceInterval
      } : undefined;
      
      if (isEditing && editTask) {
        // Update existing task
        await updateTask(editTask.id, {
          title: title.trim(),
          description: description.trim(),
          status: isDraft ? 'draft' : 'published',
          dueDate: new Date(dueDate || Date.now() + 3 * 24 * 60 * 60 * 1000),
          gems: finalGems,
          recurrence
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
          gems: finalGems,
          recurrence,
          verifications: []
        });
      }

      if (!isEditing) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setGems(10);
        setIsDraft(true);
        setIsRecurring(false);
        setRecurrenceType('weekly');
        setRecurrenceInterval(1);
        setHasUsedAI(false);
        setGemCalculationError(null);
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

  const calculateGemsWithAI = async () => {
    if (!description.trim()) {
      setGemCalculationError('Please enter a task description first');
      return;
    }

    try {
      setCalculatingGems(true);
      setGemCalculationError(null);
      
      const functions = getFunctions();
      const calculateTaskGems = httpsCallable(functions, 'calculateTaskGems');
      
      const result = await calculateTaskGems({
        taskDescription: description,
        gemPrompt: household?.gemPrompt
      });
      
      const data = result.data as { success: boolean; gems?: number; error?: string };
      
      if (data.success && data.gems) {
        setGems(data.gems);
        setHasUsedAI(true);
      } else {
        throw new Error(data.error || 'Failed to calculate gems');
      }
    } catch (error) {
      console.error('Error calculating gems:', error);
      setGemCalculationError('Failed to calculate gems. Please try again later.');
    } finally {
      setCalculatingGems(false);
    }
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
              <div className="space-y-2">
                {shouldHideGemInput ? (
                  // Show only gem display when overrides are disabled
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <Coins size={16} className="text-mario-blue" />
                    <span className="font-bold text-lg">{gems} gems</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {isEditing && editTask?.status !== 'draft' 
                        ? "(AI calculated)" 
                        : "(AI calculated when published)"
                      }
                    </span>
                  </div>
                ) : (
                  // Show input and button when overrides are allowed or when editing
                  <>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="5"
                          max="25"
                          value={gems}
                          onChange={(e) => setGems(Math.max(5, Math.min(25, Number(e.target.value))))}
                          disabled={isGemEditingDisabled}
                          className={`mario-input ${isGemEditingDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="Gem value (5-25)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={calculateGemsWithAI}
                        disabled={calculatingGems || !description.trim()}
                        className="mario-button-blue flex items-center gap-2 px-3 py-2 text-sm"
                      >
                        {calculatingGems ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Brain size={14} />
                        )}
                        {calculatingGems ? 'Calculating...' : 'AI Calculate'}
                      </button>
                    </div>
                  </>
                )}
                
                {gemCalculationError && (
                  <p className="text-red-600 text-xs">{gemCalculationError}</p>
                )}
                
                <p className="text-xs text-gray-500">
                  {shouldHideGemInput 
                    ? "Gem values are automatically calculated by AI when tasks are published (household setting)."
                    : isGemEditingDisabled 
                      ? "Gem value set by AI and cannot be modified (household setting)"
                      : "Use AI to calculate gem value based on task description, or enter manually (5-25 gems)"
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-mario-blue"
              />
              <label htmlFor="isRecurring" className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Repeat size={16} />
                Make this a recurring task
              </label>
            </div>
            
            {isRecurring && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Frequency
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                    className="mario-input"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Repeat every
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                      className="mario-input w-20"
                    />
                    <span className="text-sm text-gray-600">
                      {recurrenceType === 'daily' ? 'day(s)' : 
                       recurrenceType === 'weekly' ? 'week(s)' : 
                       'month(s)'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-600 mt-2">
              {isRecurring 
                ? "A new copy of this task will be created based on the schedule. You can modify it before publishing."
                : "One-time task that won't repeat after completion."
              }
            </p>
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