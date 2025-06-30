import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import type { ChecklistGroup } from '../types';

interface TaskChecklistProps {
  groups: ChecklistGroup[];
  canEdit: boolean;
  onItemToggle?: (groupId: string, itemId: string) => void;
}

const TaskChecklist: React.FC<TaskChecklistProps> = ({ groups, canEdit, onItemToggle }) => {
  if (groups.length === 0) return null;

  const handleToggle = (groupId: string, itemId: string) => {
    if (canEdit && onItemToggle) {
      onItemToggle(groupId, itemId);
    }
  };

  const totalItems = groups.reduce((sum, group) => sum + group.items.length, 0);
  const completedItems = groups.reduce((sum, group) => sum + group.items.filter(item => item.completed).length, 0);

  return (
    <div className="space-y-4 mb-4">
      {groups.map((group) => (
        <div key={group.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
          {group.contextBefore && (
            <div className="text-sm text-gray-600 mb-3 leading-relaxed">
              <MarkdownRenderer content={group.contextBefore} />
            </div>
          )}
          
          <div className="space-y-2">
            {group.items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  canEdit ? 'hover:bg-gray-100 cursor-pointer' : ''
                }`}
                onClick={() => handleToggle(group.id, item.id)}
              >
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <CheckSquare 
                      size={18} 
                      className={`${canEdit ? 'text-green-600' : 'text-green-500'}`} 
                    />
                  ) : (
                    <Square 
                      size={18} 
                      className={`${canEdit ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400'}`} 
                    />
                  )}
                </div>
                <span 
                  className={`text-sm flex-1 ${
                    item.completed 
                      ? 'line-through text-gray-500' 
                      : 'text-gray-700'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
          
          {group.contextAfter && (
            <div className="text-sm text-gray-600 mt-3 leading-relaxed">
              <MarkdownRenderer content={group.contextAfter} />
            </div>
          )}
        </div>
      ))}
      
      {canEdit && (
        <p className="text-xs text-gray-500 mt-3">
          Click on items to check them off as you complete them
        </p>
      )}
      
      {!canEdit && completedItems > 0 && (
        <div className="text-xs text-gray-500">
          Progress: {completedItems} / {totalItems} completed
        </div>
      )}
    </div>
  );
};

export default TaskChecklist;