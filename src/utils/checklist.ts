import { v4 as uuidv4 } from 'uuid';
import type { ChecklistGroup } from '../types';

export const parseMarkdownChecklist = (description: string): ChecklistGroup[] => {
  const lines = description.split('\n');
  const groups: ChecklistGroup[] = [];
  let currentGroup: ChecklistGroup | null = null;
  let contextLines: string[] = [];

  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/;

  for (const line of lines) {
    const match = line.match(checklistRegex);
    
    if (match) {
      // This is a checklist item
      if (!currentGroup) {
        // Start a new group
        currentGroup = {
          id: uuidv4(),
          items: [],
          contextBefore: contextLines.length > 0 ? contextLines.join('\n').trim() : undefined
        };
        contextLines = [];
      }

      const isCompleted = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      
      currentGroup.items.push({
        id: uuidv4(),
        text,
        completed: isCompleted
      });
    } else {
      // This is not a checklist item
      if (currentGroup && currentGroup.items.length > 0) {
        // Finish the current group and start collecting context for the next
        groups.push(currentGroup);
        currentGroup = null;
      }
      
      // Collect context lines (skip empty lines at the start of context)
      if (line.trim() !== '' || contextLines.length > 0) {
        contextLines.push(line);
      }
    }
  }

  // Don't forget the last group if it exists
  if (currentGroup && currentGroup.items.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

export const hasChecklistItems = (description: string): boolean => {
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/gm;
  return checklistRegex.test(description);
};

export const renderDescriptionWithoutChecklist = (description: string): string => {
  const groups = parseMarkdownChecklist(description);
  
  if (groups.length === 0) {
    return description;
  }

  // Build description from context parts only
  let result = '';
  const lines = description.split('\n');
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/;
  
  for (const line of lines) {
    if (!checklistRegex.test(line)) {
      result += line + '\n';
    }
  }
  
  return result.trim();
};

export const generateMarkdownFromChecklist = (groups: ChecklistGroup[]): string => {
  return groups.map(group => {
    let result = '';
    if (group.contextBefore) {
      result += group.contextBefore + '\n\n';
    }
    result += group.items.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
    return result;
  }).join('\n\n');
};