import React from 'react';
import { Calendar, Coins, User, CheckCircle, Edit, Repeat, Trash2, ArrowLeft, X } from 'lucide-react';
import type { Task } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { updateTaskStatus, verifyTask, createRecurringTask, deleteTask } from '../services/tasks';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: () => void;
  onEditTask?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEditTask }) => {
  const { user } = useAuth();
  const { members } = useHousehold();

  const handleClaimTask = async () => {
    if (!user || task.status !== 'published') return;
    
    try {
      await updateTaskStatus(task.id, 'claimed', user.id);
    } catch (error) {
      console.error('Error claiming task:', error);
      if (error instanceof Error && error.message.includes('no longer available')) {
        alert('This task has already been claimed by someone else.');
      }
    }
  };

  const handleCompleteTask = async () => {
    if (!user || task.status !== 'claimed' || task.claimedBy !== user.id) return;
    
    try {
      await updateTaskStatus(task.id, 'completed');
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleVerifyTask = async (verified: boolean) => {
    if (!user || task.status !== 'completed') return;
    
    try {
      await verifyTask(task.id, user.id, verified);
    } catch (error) {
      console.error('Error verifying task:', error);
    }
  };

  const handleCreateRecurringTask = async () => {
    if (!user || !task.recurrence) return;
    
    try {
      await createRecurringTask(task, user.id);
      alert('New recurring task created! Check your drafts to customize and publish it.');
    } catch (error) {
      console.error('Error creating recurring task:', error);
      alert('Failed to create recurring task');
    }
  };

  const handleDeleteTask = async () => {
    if (!user || task.status !== 'draft' || task.creatorId !== user.id) return;
    
    if (!confirm('Are you sure you want to delete this draft task? This action cannot be undone.')) return;
    
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleUnpublishTask = async () => {
    if (!user || task.status !== 'published' || task.creatorId !== user.id) return;
    
    try {
      await updateTaskStatus(task.id, 'draft');
    } catch (error) {
      console.error('Error unpublishing task:', error);
      alert('Failed to unpublish task');
    }
  };

  const handleUnclaimTask = async () => {
    if (!user || task.status !== 'claimed' || task.claimedBy !== user.id) return;
    
    try {
      await updateTaskStatus(task.id, 'published');
    } catch (error) {
      console.error('Error unclaiming task:', error);
      alert('Failed to unclaim task');
    }
  };

  const getStatusBadge = () => {
    const statusClasses = {
      draft: 'status-draft',
      published: 'status-published',
      claimed: 'status-claimed',
      completed: 'status-completed',
      verified: 'status-verified'
    };

    return (
      <span className={`status-badge ${statusClasses[task.status]}`}>
        {task.status}
      </span>
    );
  };

  const formatDueDate = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const canClaim = user && task.status === 'published' && !task.claimedBy;
  const canComplete = user && task.status === 'claimed' && task.claimedBy === user.id;
  const canVerify = user && task.status === 'completed' && task.claimedBy !== user.id;
  const hasVerified = user && task.verifications.some(v => v.userId === user.id);
  const canEdit = user && task.status === 'draft' && task.creatorId === user.id;
  const canDelete = user && task.status === 'draft' && task.creatorId === user.id;
  const canUnpublish = user && task.status === 'published' && task.creatorId === user.id;
  const canUnclaim = user && task.status === 'claimed' && task.claimedBy === user.id;
  const canCreateRecurring = user && task.recurrence && (task.status === 'verified' || task.status === 'completed');

  return (
    <div className={`task-card ${task.status}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
            {task.recurrence && (
              <div className="flex items-center gap-1 text-green-600 text-xs">
                <Repeat size={14} />
                <span className="font-bold">
                  {task.recurrence.interval > 1 ? task.recurrence.interval : ''} 
                  {task.recurrence.type === 'daily' ? 'Daily' : 
                   task.recurrence.type === 'weekly' ? 'Weekly' : 
                   'Monthly'}
                </span>
              </div>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <p className="text-gray-600 text-sm mb-4 leading-relaxed font-normal">
        {task.description}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={16} />
            <span>{formatDueDate(task.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coins size={16} />
            <span>{task.gems} gems</span>
          </div>
        </div>
      </div>

      {task.claimedBy && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <User size={16} />
          <span className="text-gray-600">
            {task.claimedBy === user?.id 
              ? 'Claimed by you' 
              : `Claimed by ${members.find(m => m.id === task.claimedBy)?.displayName || 'someone'}`
            }
          </span>
        </div>
      )}

      {task.status === 'completed' && (
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">
            Verification: {task.verifications.filter(v => v.verified).length} / {Math.ceil(task.verifications.length * 0.5)} required
          </p>
        </div>
      )}

      <div className="flex gap-2">
        {canEdit && (
          <button
            onClick={() => onEditTask?.(task)}
            className="mario-button flex items-center gap-2 text-xs flex-1"
          >
            <Edit size={14} />
            Edit Draft
          </button>
        )}

        {canDelete && (
          <button
            onClick={handleDeleteTask}
            className="mario-button-blue flex items-center gap-2 text-xs flex-1"
          >
            <Trash2 size={14} />
            Delete
          </button>
        )}

        {canUnpublish && (
          <button
            onClick={handleUnpublishTask}
            className="mario-button-blue flex items-center gap-2 text-xs flex-1"
          >
            <ArrowLeft size={14} />
            Unpublish
          </button>
        )}

        {canUnclaim && (
          <button
            onClick={handleUnclaimTask}
            className="mario-button-blue flex items-center gap-2 text-xs flex-1"
          >
            <X size={14} />
            Unclaim
          </button>
        )}

        {canClaim && (
          <button
            onClick={handleClaimTask}
            className="mario-button flex items-center gap-2 text-xs flex-1"
          >
            <CheckCircle size={14} />
            Claim Task
          </button>
        )}

        {canComplete && (
          <button
            onClick={handleCompleteTask}
            className="mario-button-blue flex items-center gap-2 text-xs flex-1"
          >
            <CheckCircle size={14} />
            Mark Complete
          </button>
        )}

        {canVerify && !hasVerified && (
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => handleVerifyTask(true)}
              className="mario-button flex items-center gap-1 text-xs flex-1"
            >
              ✓ Verify
            </button>
            <button
              onClick={() => handleVerifyTask(false)}
              className="mario-button-blue flex items-center gap-1 text-xs flex-1"
            >
              ✗ Reject
            </button>
          </div>
        )}

        {hasVerified && (() => {
          const userVerification = task.verifications.find(v => v.userId === user.id);
          const isVerified = userVerification?.verified;
          return (
            <div className={`flex items-center gap-2 text-sm ${isVerified ? 'text-green-600' : 'text-red-600'}`}>
              <CheckCircle size={16} />
              <span>{isVerified ? 'You verified this task' : 'You rejected this task'}</span>
            </div>
          );
        })()}

        {task.status === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <CheckCircle size={16} />
            <span>Task completed and verified!</span>
          </div>
        )}

        {canCreateRecurring && (
          <button
            onClick={handleCreateRecurringTask}
            className="mario-button flex items-center gap-2 text-xs flex-1"
          >
            <Repeat size={14} />
            Create Next Task
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;