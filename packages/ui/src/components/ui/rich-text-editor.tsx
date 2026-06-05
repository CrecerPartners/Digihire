import React, { useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading2, Heading3, List, ListOrdered, Quote, Link as LinkIcon,
  Unlink2, Minus,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeight?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function ToolbarButton({ onClick, active, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:opacity-40 disabled:pointer-events-none',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 self-center" />;
}

export function RichTextEditor({
  value = '',
  onChange,
  placeholder,
  disabled = false,
  className,
  minHeight = '120px',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange?.(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external value changes (e.g. when edit dialog opens for a different record)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (current !== next) {
      editor.commands.setContent(next, { emitUpdate: false } as any);
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const addLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', prev ?? 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <>
      {/* Scoped prose styles for ProseMirror content */}
      <style>{`
        .dgh-editor .ProseMirror {
          outline: none;
          min-height: ${minHeight};
          padding: 10px 12px;
          font-size: 0.875rem;
          line-height: 1.6;
        }
        .dgh-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
        }
        .dgh-editor .ProseMirror h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75em 0 0.25em; }
        .dgh-editor .ProseMirror h3 { font-size: 1rem; font-weight: 600; margin: 0.6em 0 0.2em; }
        .dgh-editor .ProseMirror strong { font-weight: 700; }
        .dgh-editor .ProseMirror em { font-style: italic; }
        .dgh-editor .ProseMirror s { text-decoration: line-through; }
        .dgh-editor .ProseMirror u { text-decoration: underline; }
        .dgh-editor .ProseMirror ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .dgh-editor .ProseMirror ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .dgh-editor .ProseMirror li { margin: 0.15em 0; }
        .dgh-editor .ProseMirror blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 0.75em;
          color: hsl(var(--muted-foreground));
          margin: 0.5em 0;
        }
        .dgh-editor .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 0.75em 0; }
        .dgh-editor .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        .dgh-editor .ProseMirror p { margin: 0.25em 0; }
        .dgh-editor .ProseMirror > *:first-child { margin-top: 0; }
        .dgh-editor .ProseMirror > *:last-child { margin-bottom: 0; }
      `}</style>

      <div
        className={cn(
          'dgh-editor rounded-md border border-input bg-background text-sm shadow-sm transition-colors',
          'focus-within:ring-1 focus-within:ring-ring',
          disabled && 'opacity-60 pointer-events-none',
          className,
        )}
      >
        {/* Toolbar */}
        {editor && (
          <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
            <ToolbarButton
              title="Bold (Ctrl+B)"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Italic (Ctrl+I)"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Underline (Ctrl+U)"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Strikethrough"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough size={13} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title="Heading 2"
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 size={13} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title="Bullet list"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered list"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Blockquote"
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote size={13} />
            </ToolbarButton>
            <ToolbarButton
              title="Horizontal rule"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus size={13} />
            </ToolbarButton>

            <Divider />

            <ToolbarButton
              title={editor.isActive('link') ? 'Edit link' : 'Add link'}
              active={editor.isActive('link')}
              onClick={addLink}
            >
              <LinkIcon size={13} />
            </ToolbarButton>
            {editor.isActive('link') && (
              <ToolbarButton
                title="Remove link"
                onClick={() => editor.chain().focus().unsetLink().run()}
              >
                <Unlink2 size={13} />
              </ToolbarButton>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          data-placeholder={placeholder}
        />
      </div>
    </>
  );
}

/** Read-only renderer for HTML saved by RichTextEditor. Sanitized via DOMPurify. */
export function RichTextContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const safeHtml = useMemo(
    () => (html ? DOMPurify.sanitize(html, { USE_PROFILES: { html: true } }) : ''),
    [html],
  );

  if (!safeHtml) return null;

  return (
    <>
      <style>{`
        .dgh-content h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75em 0 0.25em; }
        .dgh-content h3 { font-size: 1rem; font-weight: 600; margin: 0.6em 0 0.2em; }
        .dgh-content strong { font-weight: 700; }
        .dgh-content em { font-style: italic; }
        .dgh-content s { text-decoration: line-through; }
        .dgh-content u { text-decoration: underline; }
        .dgh-content ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .dgh-content ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .dgh-content li { margin: 0.15em 0; }
        .dgh-content blockquote {
          border-left: 3px solid hsl(var(--border));
          padding-left: 0.75em;
          color: hsl(var(--muted-foreground));
          margin: 0.5em 0;
        }
        .dgh-content hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 0.75em 0; }
        .dgh-content a { color: hsl(var(--primary)); text-decoration: underline; }
        .dgh-content p { margin: 0.25em 0; }
        .dgh-content > *:first-child { margin-top: 0; }
        .dgh-content > *:last-child { margin-bottom: 0; }
      `}</style>
      <div
        className={cn('dgh-content text-sm', className)}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    </>
  );
}
