import { useCallback, useRef, useState } from "react";
import { streamChat } from "../api/chat";
import { createConversation, listMessages } from "../api/conversations";
import type { ChatMessage, ChatStatus } from "../types/chat";

const makeId = () => crypto.randomUUID();

export function useChatStream() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string>();
  const abortRef = useRef<AbortController | undefined>(undefined);

  const selectConversation = useCallback(async (id?: string) => {
    if (status === "streaming") return;
    setConversationId(id);
    setError(undefined);
    if (!id) {
      setMessages([]);
      return;
    }
    setMessages([]);
    try {
      setMessages(await listMessages(id));
      setStatus("idle");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load messages.");
      setStatus("error");
    }
  }, [status]);

  const sendMessage = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || status === "streaming") return;

    let activeConversationId = conversationId;
    if (!activeConversationId) {
      const conversation = await createConversation();
      activeConversationId = conversation.id;
      setConversationId(conversation.id);
    }
    const assistantId = makeId();
    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", content: text },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setError(undefined);
    setStatus("streaming");
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await streamChat(text, {
        conversationId: activeConversationId,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: message.content + chunk }
                : message,
            ),
          );
        },
      });
      if (result.conversationId) setConversationId(result.conversationId);
      setStatus("idle");
    } catch (caught) {
      if ((caught as Error).name === "AbortError") return;
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setStatus("error");
    } finally {
      abortRef.current = undefined;
    }
  }, [conversationId, status]);

  const stopStreaming = useCallback(() => abortRef.current?.abort(), []);
  return { messages, conversationId, status, error, sendMessage, stopStreaming, selectConversation };
}
