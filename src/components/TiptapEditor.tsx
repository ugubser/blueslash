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
      <div className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded-lg border-2 border-gray-200 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Bold"
        >
          <Bold size={14} />
          <span className="hidden md:inline">Bold</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Italic"
        >
          <Italic size={14} />
          <span className="hidden md:inline">Italic</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Heading 2"
        >
          <Heading2 size={14} />
          <span className="hidden md:inline">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Heading 3"
        >
          <Heading3 size={14} />
          <span className="hidden md:inline">H3</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Bullet List"
        >
          <List size={14} />
          <span className="hidden md:inline">List</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Ordered List"
        >
          <ListOrdered size={14} />
          <span className="hidden md:inline">Ordered</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Checklist"
        >
          <CheckSquare size={14} />
          <span className="hidden md:inline">Checklist</span>
        </button>
        <button
          type="button"
          onClick={setLink}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Link"
        >
          <LinkIcon size={14} />
          <span className="hidden md:inline">Link</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className="mario-button-blue flex items-center gap-2 px-3 py-1 text-sm"
          title="Code Block"
        >
          <Code size={14} />
          <span className="hidden md:inline">Code</span>
        </button>
      </div>

      <div className="tiptap-editor-content" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
