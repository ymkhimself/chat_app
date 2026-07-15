import { useEffect, useState } from "react";
import { useChatStream } from "../hooks/useChatStream";
import { useConversations } from "../hooks/useConversations";
import ChatInput from "./ChatInput";
import ConversationHeader from "./ConversationHeader";
import MessageList from "./MessageList";
import ConversationSidebar from "./ConversationSidebar";

export default function ChatPage() {
  const chat = useChatStream();
  const conversations = useConversations();
  const [activeId, setActiveId] = useState<string>();

  useEffect(() => {
    if (!activeId && conversations.conversations.length > 0) {
      const first = conversations.conversations[0].id;
      setActiveId(first);
      void chat.selectConversation(first);
    }
  }, [activeId, conversations.conversations, chat.selectConversation]);

  const selectConversation = (id: string) => { setActiveId(id); void chat.selectConversation(id); };
  const newConversation = async () => { const conversation = await conversations.create(); setActiveId(conversation.id); void chat.selectConversation(conversation.id); };
  const deleteCurrent = async (id: string) => {
    if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
    await conversations.remove(id);
    if (id === activeId) {
      const next = conversations.conversations.find((conversation) => conversation.id !== id);
      setActiveId(next?.id);
      void chat.selectConversation(next?.id);
    }
  };
  return (
    <main className="app-shell">
      <section className="chat-workspace" aria-label="AI chat">
        <ConversationSidebar conversations={conversations.conversations} activeId={activeId} isLoading={conversations.isLoading} error={conversations.error} onNew={() => void newConversation()} onSelect={selectConversation} onDelete={(id) => void deleteCurrent(id)} onRename={conversations.rename} />
        <section className="chat-panel"><ConversationHeader status={chat.status} /><MessageList messages={chat.messages} isStreaming={chat.status === "streaming"} /><ChatInput disabled={chat.status === "streaming"} error={chat.error} isStreaming={chat.status === "streaming"} onSend={chat.sendMessage} onStop={chat.stopStreaming} /></section>
      </section>
    </main>
  );
}
