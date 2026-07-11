import { useChatStream } from "../hooks/useChatStream";
import ChatInput from "./ChatInput";
import ConversationHeader from "./ConversationHeader";
import MessageList from "./MessageList";

export default function ChatPage() {
  const chat = useChatStream();
  return (
    <main className="app-shell">
      <section className="chat-panel" aria-label="AI chat">
        <ConversationHeader status={chat.status} onNewChat={() => window.location.reload()} />
        <MessageList messages={chat.messages} isStreaming={chat.status === "streaming"} />
        <ChatInput
          disabled={chat.status === "streaming"}
          error={chat.error}
          isStreaming={chat.status === "streaming"}
          onSend={chat.sendMessage}
          onStop={chat.stopStreaming}
        />
      </section>
    </main>
  );
}
