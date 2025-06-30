import { v4 as uuidv4 } from 'uuid';
import type { ChecklistGroup } from '../types';

export const parseMarkdownChecklist = (description: string): ChecklistGroup[] => {
  const lines = description.split('\n');
  const groups: ChecklistGroup[] = [];
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/;

  // First, identify all checklist item positions
  const checklistItemPositions: number[] = [];
  lines.forEach((line, index) => {
    if (checklistRegex.test(line)) {
      checklistItemPositions.push(index);
    }
  });

  if (checklistItemPositions.length === 0) {
    return groups;
  }

  // Group consecutive checklist items
  const checklistGroups: number[][] = [];
  let currentGroup: number[] = [checklistItemPositions[0]];

  for (let i = 1; i < checklistItemPositions.length; i++) {
    const currentPos = checklistItemPositions[i];
    const prevPos = checklistItemPositions[i - 1];
    
    // Check if there are only empty lines between these positions
    let onlyEmptyBetween = true;
    for (let j = prevPos + 1; j < currentPos; j++) {
      if (lines[j].trim() !== '') {
        onlyEmptyBetween = false;
        break;
      }
    }
    
    if (onlyEmptyBetween) {
      // Part of the same group
      currentGroup.push(currentPos);
    } else {
      // Start a new group
      checklistGroups.push(currentGroup);
      currentGroup = [currentPos];
    }
  }
  checklistGroups.push(currentGroup);

  // Now create ChecklistGroup objects with context
  checklistGroups.forEach((groupPositions, groupIndex) => {
    const firstPos = groupPositions[0];
    const lastPos = groupPositions[groupPositions.length - 1];
    
    // Get context before (only the immediate line before)
    let contextBefore = '';
    if (firstPos > 0) {
      const lineBeforePos = firstPos - 1;
      const lineBefore = lines[lineBeforePos];
      if (lineBefore.trim() !== '') {
        contextBefore = lineBefore;
      }
    }
    
    // Get context after (until next checklist group or end)
    let contextAfter = '';
    const nextGroupStartPos = groupIndex < checklistGroups.length - 1 
      ? checklistGroups[groupIndex + 1][0] 
      : lines.length;
    
    const contextAfterLines: string[] = [];
    for (let i = lastPos + 1; i < nextGroupStartPos; i++) {
      const line = lines[i];
      // Stop if we hit the context line for the next group
      if (i === nextGroupStartPos - 1 && line.trim() !== '') {
        break;
      }
      contextAfterLines.push(line);
    }
    
    // Remove trailing empty lines from contextAfter
    while (contextAfterLines.length > 0 && contextAfterLines[contextAfterLines.length - 1].trim() === '') {
      contextAfterLines.pop();
    }
    
    if (contextAfterLines.length > 0) {
      contextAfter = contextAfterLines.join('\n');
    }

    // Create the items
    const items = groupPositions.map(pos => {
      const line = lines[pos];
      const match = line.match(checklistRegex)!;
      const isCompleted = match[1].toLowerCase() === 'x';
      const text = match[2].trim();
      
      return {
        id: uuidv4(),
        text,
        completed: isCompleted
      };
    });

    const group: ChecklistGroup = {
      id: uuidv4(),
      items,
      ...(contextBefore && { contextBefore }),
      ...(contextAfter && { contextAfter })
    };

    groups.push(group);
  });

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

  // Build description excluding checklist items AND their context lines
  const lines = description.split('\n');
  const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]\s*(.+)$/;
  const excludeLines = new Set<number>();
  
  // Mark all checklist-related lines for exclusion
  lines.forEach((line, index) => {
    if (checklistRegex.test(line)) {
      excludeLines.add(index);
    }
  });
  
  // Mark context lines for exclusion
  groups.forEach(group => {
    if (group.contextBefore) {
      const contextIndex = lines.findIndex(line => line === group.contextBefore);
      if (contextIndex !== -1) {
        excludeLines.add(contextIndex);
      }
    }
    if (group.contextAfter) {
      const contextAfterLines = group.contextAfter.split('\n');
      contextAfterLines.forEach(contextLine => {
        const contextIndex = lines.findIndex(line => line === contextLine);
        if (contextIndex !== -1) {
          excludeLines.add(contextIndex);
        }
      });
    }
  });
  
  // Build result with remaining lines
  const resultLines: string[] = [];
  lines.forEach((line, index) => {
    if (!excludeLines.has(index)) {
      resultLines.push(line);
    }
  });
  
  return resultLines.join('\n').trim();
};

export const generateMarkdownFromChecklist = (groups: ChecklistGroup[]): string => {
  return groups.map(group => {
    let result = '';
    if (group.contextBefore) {
      result += group.contextBefore + '\n';
    }
    result += group.items.map(item => `- [${item.completed ? 'x' : ' '}] ${item.text}`).join('\n');
    if (group.contextAfter) {
      result += '\n' + group.contextAfter;
    }
    return result;
  }).join('\n\n');
};