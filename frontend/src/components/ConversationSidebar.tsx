import type { Conversation } from "../types/conversation";
import ConversationItem from "./ConversationItem";

export default function ConversationSidebar({ conversations, activeId, isLoading, error, onNew, onSelect, onDelete, onRename }: {
  conversations: Conversation[];
  activeId?: string;
  isLoading: boolean;
  error?: string;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
}) {
  return (
    <aside className="conversation-sidebar" aria-label="Conversations">
      <div className="sidebar-heading"><h2>Conversations</h2><button className="new-conversation-button" type="button" onClick={onNew}>+ New chat</button></div>
      {isLoading ? <p className="sidebar-message">Loading conversations...</p> : error ? <p className="sidebar-error">{error}</p> : conversations.length === 0 ? <p className="sidebar-message">No saved conversations yet.</p> : <div className="conversation-list">{conversations.map((conversation) => <ConversationItem key={conversation.id} conversation={conversation} active={conversation.id === activeId} onSelect={() => onSelect(conversation.id)} onDelete={() => onDelete(conversation.id)} onRename={(title) => onRename(conversation.id, title)} />)}</div>}
    </aside>
  );
}
