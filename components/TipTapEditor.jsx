"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import {
  Undo2,
  Redo2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Strikethrough as StrikeIcon,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Highlighter,
  ChevronDown,
} from "lucide-react";

export default function TipTapEditor({ valueJSON, valueHTML, onChange }) {
  // ---------------- Toolbar state (declare hooks first!) ----------------
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 192 });

  // Close menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      const b = btnRef.current;
      const m = menuRef.current;
      if (b && b.contains(e.target)) return; // clicking button toggles separately
      if (m && m.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  // Recompute menu position when opened or on resize/scroll
  useLayoutEffect(() => {
    function place() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: r.bottom + 8,
        left: r.left,
        width: 192,
      });
    }
    if (open) {
      place();
      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      return () => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
      };
    }
  }, [open]);

  // ---------------- TipTap editor ----------------
  const editor = useEditor({
    extensions: [
      StarterKit, // bold, italic, strike, lists, history
      Underline,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: "Write your post…" }),
    ],
    content: valueJSON ?? valueHTML ?? "<p></p>",
    onUpdate: ({ editor }) => {
      onChange?.({
        html: editor.getHTML(),
        json: editor.getJSON(),
        text: editor.getText(),
      });
    },
    editorProps: {
      attributes: { class: "prose max-w-none focus:outline-none p-4" },
    },
    immediatelyRender: false,
  });

  useEffect(() => () => editor?.destroy(), [editor]);
  if (!editor) return null;

  // ---------------- UI helpers ----------------
  const Btn = ({ onClick, active, title, children, disabled }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={[
        "h-9 px-2 rounded-lg border text-sm flex items-center gap-1",
        "bg-white border-gray-200 hover:bg-gray-100 transition",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        active ? "ring-1 ring-black/30 bg-gray-100" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );

  const COLORS = [
    { name: "Yellow", val: "#FFF59D" },
    { name: "Green", val: "#C8E6C9" },
    { name: "Blue", val: "#BBDEFB" },
    { name: "Pink", val: "#F8BBD0" },
    { name: "Orange", val: "#FFE0B2" },
  ];

  // ---------------- Render ----------------
  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50">
        {/* History */}
        <div className="flex gap-2 pr-2 mr-2 border-r border-gray-200">
          <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 className="w-4 h-4" />
          </Btn>
          <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 className="w-4 h-4" />
          </Btn>
        </div>

        {/* Marks */}
        <div className="flex gap-2 pr-2 mr-2 border-r border-gray-200">
          <Btn
            title="Bold"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="w-4 h-4" />
          </Btn>
          <Btn
            title="Italic"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="w-4 h-4" />
          </Btn>
          <Btn
            title="Strikethrough"
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <StrikeIcon className="w-4 h-4" />
          </Btn>
          <Btn
            title="Underline"
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <UnderlineIcon className="w-4 h-4" />
          </Btn>
        </div>

        {/* Lists */}
        <div className="flex gap-2 pr-2 mr-2 border-r border-gray-200">
          <Btn
            title="Bullet list"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Btn>
          <Btn
            title="Ordered list"
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Btn>
        </div>

        {/* Highlight (button opens portal dropdown) */}
        <div>
          <Btn
            title="Highlight"
            active={editor.isActive("highlight")}
            onClick={() => setOpen((v) => !v)}
          >
            <span ref={btnRef} className="flex items-center gap-1">
              <Highlighter className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 opacity-70" />
            </span>
          </Btn>
        </div>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="min-h-[220px] bg-white border-t border-gray-200" />

      {/* Dropdown via portal (never clipped) */}
      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
            }}
            className="z-[9999] rounded-lg border border-gray-200 bg-white shadow-md p-2"
          >
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map(({ name, val }) => (
                <button
                  key={val}
                  type="button"
                  aria-label={`Highlight ${name}`}
                  title={name}
                  onClick={() => {
                    editor.chain().focus().setHighlight({ color: val }).run();
                    setOpen(false);
                  }}
                  className="h-7 w-7 rounded-md border border-gray-200 hover:scale-105 transition"
                  style={{ backgroundColor: val }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                editor.chain().focus().unsetHighlight().run();
                setOpen(false);
              }}
              className="mt-2 w-full h-8 rounded-md border border-gray-200 text-xs hover:bg-gray-100"
            >
              Clear highlight
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
