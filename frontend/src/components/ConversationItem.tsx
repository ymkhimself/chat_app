import { useState } from "react";
import type { FormEvent } from "react";
import type { Conversation } from "../types/conversation";

export default function ConversationItem({ conversation, active, onSelect, onDelete, onRename }: {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [isSaving, setIsSaving] = useState(false);

  const cancelEdit = () => {
    setTitle(conversation.title);
    setIsEditing(false);
  };

  const saveTitle = async (event?: FormEvent) => {
    event?.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    setIsSaving(true);
    try {
      await onRename(nextTitle);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`conversation-item ${active ? "conversation-item-active" : ""}`}>
      {isEditing ? <form className="conversation-edit" onSubmit={(event) => void saveTitle(event)}>
        <input autoFocus value={title} maxLength={200} disabled={isSaving} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") cancelEdit(); }} aria-label="Conversation title" />
        <button type="submit" disabled={isSaving || !title.trim()} aria-label="Save conversation title">✓</button>
      </form> : <>
        <button className="conversation-select" type="button" onClick={onSelect}>
          <span className="conversation-title">{conversation.title || "Untitled"}</span>
          <span className="conversation-date">{new Date(conversation.updatedAt).toLocaleDateString()}</span>
        </button>
        <button className="conversation-rename" type="button" aria-label={`Rename ${conversation.title}`} onClick={() => setIsEditing(true)}>✎</button>
        <button className="conversation-delete" type="button" aria-label={`Delete ${conversation.title}`} onClick={onDelete}>×</button>
      </>}
    </div>
  );
}
