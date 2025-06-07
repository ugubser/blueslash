import React from 'react';
import { Calendar, Coins, User, CheckCircle, Edit } from 'lucide-react';
import type { Task } from '../types';
import { useAuth } from '../hooks/useAuth';
import { updateTaskStatus, verifyTask } from '../services/tasks';

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: () => void;
  onEditTask?: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onTaskUpdate, onEditTask }) => {
  const { user } = useAuth();

  const handleClaimTask = async () => {
    if (!user || task.status !== 'published') return;
    
    try {
      await updateTaskStatus(task.id, 'claimed', user.id);
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error claiming task:', error);
    }
  };

  const handleCompleteTask = async () => {
    if (!user || task.status !== 'claimed' || task.claimedBy !== user.id) return;
    
    try {
      await updateTaskStatus(task.id, 'completed');
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleVerifyTask = async (verified: boolean) => {
    if (!user || task.status !== 'completed') return;
    
    try {
      await verifyTask(task.id, user.id, verified);
      onTaskUpdate?.();
    } catch (error) {
      console.error('Error verifying task:', error);
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

  return (
    <div className={`task-card ${task.status}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
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
            {task.claimedBy === user?.id ? 'Claimed by you' : 'Claimed by someone'}
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

        {hasVerified && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle size={16} />
            <span>You verified this task</span>
          </div>
        )}

        {task.status === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <CheckCircle size={16} />
            <span>Task completed and verified!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;