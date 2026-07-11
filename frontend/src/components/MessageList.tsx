import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/chat";
import EmptyState from "./EmptyState";
import MessageBubble from "./MessageBubble";

export default function MessageList({ messages, isStreaming }: { messages: ChatMessage[]; isStreaming: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  return (
    <div className="message-list" aria-live="polite">
      {messages.length === 0 ? <EmptyState /> : messages.map((message) => <MessageBubble key={message.id} message={message} isStreaming={isStreaming && message === messages[messages.length - 1]} />)}
      <div ref={endRef} />
    </div>
  );
}
