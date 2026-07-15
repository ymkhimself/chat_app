import type { ChatStatus } from "../types/chat";

export default function ConversationHeader({
  status,
}: {
  status: ChatStatus;
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
      </div>
    </header>
  );
}
