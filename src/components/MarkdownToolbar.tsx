import React from 'react';
import { Bold, Link, List, CheckSquare } from 'lucide-react';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onTextChange: (text: string) => void;
}

const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ textareaRef, onTextChange }) => {
  const insertMarkdown = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const replacement = selectedText || placeholder;
    
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    const newText = beforeText + before + replacement + after + afterText;
    onTextChange(newText);

    // Set focus and cursor position while preserving scroll
    setTimeout(() => {
      const scrollTop = textarea.scrollTop;
      textarea.focus();
      textarea.scrollTop = scrollTop;
      
      if (selectedText) {
        // If text was selected, position cursor after the inserted markdown
        const newCursorPos = start + before.length + replacement.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      } else if (placeholder) {
        // If using placeholder, select the placeholder text
        const newStart = start + before.length;
        const newEnd = newStart + placeholder.length;
        textarea.setSelectionRange(newStart, newEnd);
      } else {
        // Position cursor between before and after
        const newCursorPos = start + before.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const insertAtCursor = (text: string, selectText?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textValue = textarea.value;
    const beforeCursor = textValue.substring(0, cursorPosition);
    const afterCursor = textValue.substring(cursorPosition);

    // Check if we need to add a newline before the item
    const needsNewlineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n');
    const prefix = needsNewlineBefore ? '\n' + text : text;
    
    const newValue = beforeCursor + prefix + (selectText || '') + afterCursor;
    onTextChange(newValue);

    // Set cursor position while preserving scroll
    setTimeout(() => {
      const scrollTop = textarea.scrollTop;
      textarea.focus();
      textarea.scrollTop = scrollTop;
      
      if (selectText) {
        const newStart = cursorPosition + prefix.length;
        const newEnd = newStart + selectText.length;
        textarea.setSelectionRange(newStart, newEnd);
      } else {
        const newCursorPosition = cursorPosition + prefix.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
  };

  const addBold = () => insertMarkdown('**', '**', 'bold text');
  const addLink = () => insertMarkdown('[', '](url)', 'link text');
  const addUnorderedList = () => insertAtCursor('- ', 'list item');
  const addChecklistItem = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textValue = textarea.value;
    const beforeCursor = textValue.substring(0, cursorPosition);
    const afterCursor = textValue.substring(cursorPosition);

    // Check if we need to add context line before checklist
    const lines = beforeCursor.split('\n');
    const lastLine = lines[lines.length - 1];
    
    let prefix = '';
    
    // Check if we're already inside a checklist context
    const checklistRegex = /^[\s]*[-*]\s*\[(\s|x|X)\]/;
    const isLastLineChecklist = checklistRegex.test(lastLine);
    
    // Look backwards to see if there's already a checklist context
    let hasRecentChecklistContext = false;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (checklistRegex.test(line)) {
        hasRecentChecklistContext = true;
        break;
      }
      if (line.trim() === '') continue;
      // If we hit non-empty, non-checklist text, we have potential context
      break;
    }
    
    if (isLastLineChecklist || hasRecentChecklistContext) {
      // We're already in a checklist context, just add the item
      prefix = (beforeCursor.endsWith('\n') ? '' : '\n') + '- [ ] ';
    } else if (beforeCursor.length === 0 || lastLine.trim() === '') {
      // Need a context line
      prefix = 'Checklist items:\n- [ ] ';
    } else {
      // There's text but no checklist context yet, just add the item
      prefix = (beforeCursor.endsWith('\n') ? '' : '\n') + '- [ ] ';
    }
    
    const newValue = beforeCursor + prefix + 'item' + afterCursor;
    onTextChange(newValue);

    // Select the word "item" while preserving scroll
    setTimeout(() => {
      const scrollTop = textarea.scrollTop;
      textarea.focus();
      textarea.scrollTop = scrollTop;
      
      const newStart = cursorPosition + prefix.length;
      const newEnd = newStart + 4; // length of "item"
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  return (
    <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border-2 border-gray-200">
      <button
        type="button"
        onClick={addBold}
        className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
        title="Bold"
      >
        <Bold size={14} />
        <span className="hidden md:inline">Bold</span>
      </button>
      
      <button
        type="button"
        onClick={addLink}
        className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
        title="Link"
      >
        <Link size={14} />
        <span className="hidden md:inline">Link</span>
      </button>
      
      <button
        type="button"
        onClick={addUnorderedList}
        className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
        title="Bullet List"
      >
        <List size={14} />
        <span className="hidden md:inline">List</span>
      </button>
      
      
      <button
        type="button"
        onClick={addChecklistItem}
        className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
        title="Checklist Item"
      >
        <CheckSquare size={14} />
        <span className="hidden md:inline">Checklist</span>
      </button>
    </div>
  );
};

export default MarkdownToolbar;