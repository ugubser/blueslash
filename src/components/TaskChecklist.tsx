import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { ChecklistItem } from '../types';

interface TaskChecklistProps {
  items: ChecklistItem[];
  canEdit: boolean;
  onItemToggle?: (itemId: string) => void;
}

const TaskChecklist: React.FC<TaskChecklistProps> = ({ items, canEdit, onItemToggle }) => {
  if (items.length === 0) return null;

  const handleToggle = (itemId: string) => {
    if (canEdit && onItemToggle) {
      onItemToggle(itemId);
    }
  };

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-bold text-gray-700 mb-3">Task Checklist:</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
              canEdit ? 'hover:bg-gray-100 cursor-pointer' : ''
            }`}
            onClick={() => handleToggle(item.id)}
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
      
      {canEdit && (
        <p className="text-xs text-gray-500 mt-3">
          Click on items to check them off as you complete them
        </p>
      )}
      
      {!canEdit && items.some(item => item.completed) && (
        <div className="mt-3 text-xs text-gray-500">
          Progress: {items.filter(item => item.completed).length} / {items.length} completed
        </div>
      )}
    </div>
  );
};

export default TaskChecklist;