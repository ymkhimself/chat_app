import type { ChatMessage } from "../types/chat";
import type { Conversation } from "../types/conversation";

type ConversationPayload = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

function toConversation(payload: ConversationPayload): Conversation {
  return {
    id: payload.id,
    title: payload.title,
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    let detail = "Unable to update conversations.";
    try {
      const payload = await response.json();
      detail = payload.detail ?? detail;
    } catch {
      // Use the fallback for non-JSON errors.
    }
    throw new Error(detail);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function listConversations(): Promise<Conversation[]> {
  const payload = await request<ConversationPayload[]>("/api/conversations");
  return payload.map(toConversation);
}

export async function createConversation(title = "New conversation"): Promise<Conversation> {
  const payload = await request<ConversationPayload>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return toConversation(payload);
}

export async function updateConversation(id: string, title: string): Promise<Conversation> {
  const payload = await request<ConversationPayload>(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return toConversation(payload);
}

export async function deleteConversation(id: string): Promise<void> {
  await request<void>(`/api/conversations/${id}`, { method: "DELETE" });
}

export async function listMessages(id: string): Promise<ChatMessage[]> {
  const payload = await request<Array<{
    id: string;
    conversation_id: string;
    role: ChatMessage["role"];
    content: string;
    created_at: string;
  }>>(`/api/conversations/${id}/messages`);
  return payload.map((message) => ({
    id: message.id,
    conversationId: message.conversation_id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
  }));
}
