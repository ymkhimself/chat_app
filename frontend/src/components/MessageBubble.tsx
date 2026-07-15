import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../types/chat";

export default function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";
  return (
    <article className={`message-row ${isUser ? "message-row-user" : "message-row-assistant"}`}>
      {!isUser && <div className="avatar avatar-assistant">✦</div>}
      <div className={`message-bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        <span className="message-label">{isUser ? "You" : "Assistant"}</span>
        {isUser ? <p>{message.content}</p> : <div className="markdown-body">
          {message.content ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
          }}>{message.content}</ReactMarkdown> : !isStreaming && <p>No response received.</p>}
          {isStreaming && <span className="streaming-cursor" />}
        </div>}
      </div>
      {isUser && <div className="avatar avatar-user">Y</div>}
    </article>
  );
}
