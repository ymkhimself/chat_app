export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  conversationId?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type ChatStatus = "idle" | "streaming" | "error";
