import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Code2,
  Eraser,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Sigma,
  Table2,
  TextCursorInput,
  Underline
} from 'lucide-react';

const BLOCK_OPTIONS = [
  { label: 'Normal', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Quote', value: 'quote' },
  { label: 'Code block', value: 'code' }
];

export default function RichTextEditor({ value, onChange }) {
  const selectionRef = useRef(null);
  const blockTriggerRef = useRef(null);
  const blockMenuRef = useRef(null);
  const [blockMenuOpen, setBlockMenuOpen] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ left: 0, top: 0, width: 0 });
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false })
    ],
    editorProps: {
      handleDOMEvents: {
        mousedown: (view) => {
          view.focus();
          return false;
        }
      }
    },
    content: value || '',
    onSelectionUpdate: ({ editor: nextEditor }) => {
      const { from, to } = nextEditor.state.selection;
      selectionRef.current = { from, to };
    },
    onUpdate: ({ editor: nextEditor }) => onChange(nextEditor.getHTML())
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) editor.commands.setContent(value || '', false);
  }, [editor, value]);

  useEffect(() => {
    if (!blockMenuOpen) return undefined;

    function closeMenu(event) {
      if (blockTriggerRef.current?.contains(event.target)) return;
      if (blockMenuRef.current?.contains(event.target)) return;
      setBlockMenuOpen(false);
    }

    window.addEventListener('mousedown', closeMenu);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      window.removeEventListener('mousedown', closeMenu);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [blockMenuOpen]);

  if (!editor) return null;

  function rememberSelection() {
    const { from, to } = editor.state.selection;
    selectionRef.current = { from, to };
  }

  function chainWithSelection() {
    const selection = selectionRef.current;
    let chain = editor.chain().focus();
    if (selection && selection.from <= editor.state.doc.content.size && selection.to <= editor.state.doc.content.size) {
      chain = chain.setTextSelection(selection);
    }
    return chain;
  }

  function setLink() {
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL', previousUrl);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  }

  function setImage() {
    const url = window.prompt('Enter image URL');
    if (!url?.trim()) return;
    editor.chain().focus().setImage({ src: url.trim() }).run();
  }

  function setBlock(nextValue) {
    let chain = chainWithSelection();
    if (editor.isActive('listItem') && ['paragraph', 'h1', 'h2', 'h3', 'quote', 'code'].includes(nextValue)) {
      chain = chain.liftListItem('listItem');
    }
    if (nextValue === 'paragraph') chain.setParagraph().run();
    if (nextValue === 'h1') chain.setHeading({ level: 1 }).run();
    if (nextValue === 'h2') chain.setHeading({ level: 2 }).run();
    if (nextValue === 'h3') chain.setHeading({ level: 3 }).run();
    if (nextValue === 'quote') chain.toggleBlockquote().run();
    if (nextValue === 'code') chain.toggleCodeBlock().run();
  }

  function currentBlock() {
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('blockquote')) return 'quote';
    if (editor.isActive('codeBlock')) return 'code';
    return 'paragraph';
  }

  function insertTable() {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function toggleBlockMenu() {
    rememberSelection();
    const rect = blockTriggerRef.current.getBoundingClientRect();
    setBlockMenuPosition({
      left: Math.round(rect.left),
      top: Math.round(rect.bottom + 6),
      width: rect.width
    });
    setBlockMenuOpen((open) => !open);
  }

  const activeBlock = currentBlock();
  const activeBlockLabel = BLOCK_OPTIONS.find((option) => option.value === activeBlock)?.label || 'Normal';
  const focusEditorFromContent = () => {
    if (blockMenuOpen) setBlockMenuOpen(false);
    const activeElement = document.activeElement;
    if (activeElement?.closest?.('.rte-toolbar')) activeElement.blur();
  };

  return (
    <div className="rte">
      <div className="rte-toolbar">
        <div className="rte-select-wrap">
          <button
            ref={blockTriggerRef}
            className="rte-select"
            type="button"
            tabIndex={-1}
            aria-haspopup="listbox"
            aria-expanded={blockMenuOpen}
            onMouseDown={(event) => {
              rememberSelection();
              event.preventDefault();
            }}
            onClick={toggleBlockMenu}
          >
            <span>{activeBlockLabel}</span>
          </button>
          <ChevronDown className="rte-select-icon h-3.5 w-3.5" aria-hidden="true" />
        </div>
        {blockMenuOpen ? createPortal(
          <div
            ref={blockMenuRef}
            className="rte-block-menu"
            role="listbox"
            style={{ left: blockMenuPosition.left, top: blockMenuPosition.top, width: blockMenuPosition.width }}
          >
            {BLOCK_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={activeBlock === option.value}
                className={activeBlock === option.value ? 'active' : ''}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={() => {
                  setBlock(option.value);
                  setBlockMenuOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        ) : null}
        <span className="rte-divider" />
        <button type="button" title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold className="h-4 w-4" /></button>
        <button type="button" title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic className="h-4 w-4" /></button>
        <button type="button" title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}><Underline className="h-4 w-4" /></button>
        <span className="rte-divider" />
        <button type="button" title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''}><ListOrdered className="h-4 w-4" /></button>
        <button type="button" title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}><List className="h-4 w-4" /></button>
        <button type="button" title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}><AlignLeft className="h-4 w-4" /></button>
        <button type="button" title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}><AlignCenter className="h-4 w-4" /></button>
        <button type="button" title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}><AlignRight className="h-4 w-4" /></button>
        <span className="rte-divider" />
        <button type="button" title="Link" onClick={setLink} className={editor.isActive('link') ? 'active' : ''}><LinkIcon className="h-4 w-4" /></button>
        <button type="button" title="Image" onClick={setImage}><ImageIcon className="h-4 w-4" /></button>
        <button type="button" title="Table" onClick={insertTable}><Table2 className="h-4 w-4" /></button>
        <button type="button" title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} className={editor.isActive('code') ? 'active' : ''}><Sigma className="h-4 w-4" /></button>
        <button type="button" title="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={editor.isActive('codeBlock') ? 'active' : ''}><Code2 className="h-4 w-4" /></button>
        <button type="button" title="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><TextCursorInput className="h-4 w-4" /><Eraser className="h-3 w-3" /></button>
      </div>
      <EditorContent className="rte-content" editor={editor} onMouseDownCapture={focusEditorFromContent} />
    </div>
  );
}
