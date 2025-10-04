// components/TiptapEditor.jsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const TiptapEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit, // 包含常用的粗体、斜体、列表等功能
    ],
    content: content, // 从外部传入的 HTML 内容
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML()); // 当内容变化时，调用外部的 onChange 函数
    },
  });

  return <EditorContent editor={editor} />;
};

export default TiptapEditor;
