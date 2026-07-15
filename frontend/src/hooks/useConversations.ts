import { useCallback, useEffect, useState } from "react";
import { createConversation, deleteConversation, listConversations, updateConversation } from "../api/conversations";
import type { Conversation } from "../types/conversation";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setConversations(await listConversations());
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load conversations.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const create = useCallback(async () => {
    const conversation = await createConversation();
    setConversations((current) => [conversation, ...current]);
    return conversation;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteConversation(id);
    setConversations((current) => current.filter((conversation) => conversation.id !== id));
  }, []);

  const rename = useCallback(async (id: string, title: string) => {
    const conversation = await updateConversation(id, title);
    setConversations((current) => current.map((item) => item.id === id ? conversation : item));
  }, []);

  return { conversations, isLoading, error, refresh, create, remove, rename };
}
