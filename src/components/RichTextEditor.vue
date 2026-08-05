<script setup>
import { watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Write here...' },
})
const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

// Sync value dari luar (misal saat restore draft) ke editor
watch(() => props.modelValue, (val) => {
  if (editor.value && editor.value.getHTML() !== val) {
    editor.value.commands.setContent(val || '', false)
  }
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<template>
  <div class="rte-wrap">
    <div class="rte-toolbar" v-if="editor">
      <button type="button" @click="editor.chain().focus().toggleBold().run()" :class="{ active: editor.isActive('bold') }" title="Bold">
        <b>B</b>
      </button>
      <button type="button" @click="editor.chain().focus().toggleItalic().run()" :class="{ active: editor.isActive('italic') }" title="Italic">
        <i>I</i>
      </button>
      <button type="button" @click="editor.chain().focus().toggleBulletList().run()" :class="{ active: editor.isActive('bulletList') }" title="Bullet List">
        • List
      </button>
      <button type="button" @click="editor.chain().focus().toggleOrderedList().run()" :class="{ active: editor.isActive('orderedList') }" title="Numbered List">
        1. List
      </button>
    </div>
    <editor-content :editor="editor" class="rte-content" />
  </div>
</template>

<style scoped>
.rte-wrap {
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-input);
  overflow: hidden;
}
.rte-toolbar {
  display: flex;
  gap: 4px;
  padding: 6px;
  border-bottom: 1px solid var(--border-main);
  background: var(--bg-card);
}
.rte-toolbar button {
  padding: 4px 8px;
  border: 1px solid var(--border-main);
  border-radius: 6px;
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  transition: all 0.15s ease;
}
.rte-toolbar button:hover { border-color: #6366f1; color: #6366f1; }
.rte-toolbar button.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.rte-content {
  padding: 10px 12px;
  min-height: 110px;
  font-size: 0.875rem;
  color: var(--text-primary);
}
.rte-content :deep(.ProseMirror) {
  outline: none;
  min-height: 90px;
}
.rte-content :deep(.ProseMirror p) { margin: 0 0 6px; }
.rte-content :deep(.ProseMirror ul),
.rte-content :deep(.ProseMirror ol) { padding-left: 1.2rem; margin: 0 0 6px; }
.rte-content :deep(p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--text-muted);
  pointer-events: none;
  height: 0;
}
</style>