import type { ChatMessage } from "../types/chat";

export default function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";
  return (
    <article className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"}`}>
      {!isUser && <div className="avatar avatar-assistant">✦</div>}
      <div className={`message-bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        <span className="message-label">{isUser ? "You" : "Assistant"}</span>
        <p>{message.content || (isStreaming ? "" : "No response received.")}{isStreaming && !isUser && <span className="streaming-cursor" />}</p>
      </div>
      {isUser && <div className="avatar avatar-user">Y</div>}
    </article>
  );
}
