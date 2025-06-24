import { v4 as uuidv4 } from 'uuid';
import type { ChecklistItem } from '../types';

export const parseMarkdownChecklist = (description: string): ChecklistItem[] => {
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/gm;
  const items: ChecklistItem[] = [];
  let match;

  while ((match = checklistRegex.exec(description)) !== null) {
    const isCompleted = match[1].toLowerCase() === 'x';
    const text = match[2].trim();
    
    items.push({
      id: uuidv4(),
      text,
      completed: isCompleted
    });
  }

  return items;
};

export const hasChecklistItems = (description: string): boolean => {
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/gm;
  return checklistRegex.test(description);
};

export const renderDescriptionWithoutChecklist = (description: string): string => {
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/gm;
  return description.replace(checklistRegex, '').trim();
};

export const generateMarkdownFromChecklist = (items: ChecklistItem[]): string => {
  return items.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
};