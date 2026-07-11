import type { ChatStatus } from "../types/chat";

export default function ConversationHeader({
  status,
  onNewChat,
}: {
  status: ChatStatus;
  onNewChat: () => void;
}) {
  const label = status === "streaming" ? "Thinking" : status === "error" ? "Needs attention" : "Ready";
  return (
    <header className="conversation-header">
      <div className="brand-mark" aria-hidden="true">✦</div>
      <div>
        <h1>AI Chat</h1>
        <p>Local learning app</p>
      </div>
      <div className="header-actions">
        <span className={`status status-${status}`}><span className="status-dot" />{label}</span>
        <button className="new-chat-button" onClick={onNewChat} type="button">New chat</button>
      </div>
    </header>
  );
}
