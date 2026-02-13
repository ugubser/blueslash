import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from '@tiptap/markdown';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Link as LinkIcon,
  Code,
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '100px',
}) => {
  const lastEmittedMarkdown = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content,
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      lastEmittedMarkdown.current = md;
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (content === lastEmittedMarkdown.current) return;
    lastEmittedMarkdown.current = content;
    editor.commands.setContent(content, { emitUpdate: false, contentType: 'markdown' });
  }, [content, editor]);

  if (!editor) return null;

  const setLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt('Enter URL:');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-2 p-1.5 bg-gray-50 rounded-lg border-2 border-gray-200 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('bold') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('italic') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`tiptap-toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Heading 2"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`tiptap-toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Heading 3"
        >
          <Heading3 size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('bulletList') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('orderedList') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('taskList') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Checklist"
        >
          <CheckSquare size={16} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-0.5" />

        <button
          type="button"
          onClick={setLink}
          className={`tiptap-toolbar-btn ${editor.isActive('link') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Link"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`tiptap-toolbar-btn ${editor.isActive('codeBlock') ? 'bg-blue-100 text-mario-blue border-mario-blue' : ''}`}
          title="Code Block"
        >
          <Code size={16} />
        </button>
      </div>

      <div className="tiptap-editor-content" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
