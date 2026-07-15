export type StreamChatOptions = {
  conversationId?: string;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
};

export async function streamChat(
  message: string,
  options: StreamChatOptions,
): Promise<{ conversationId?: string }> {
  const response = await fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation_id: options.conversationId,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    let detail = "Unable to send your message.";
    try {
      const payload = await response.json();
      detail = payload.detail ?? detail;
    } catch {
      // Keep the friendly fallback when the server does not return JSON.
    }
    throw new Error(detail);
  }

  if (!response.body) throw new Error("The server did not return a stream.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const isEventStream = response.headers.get("content-type")?.includes("text/event-stream") ?? false;
  let returnedConversationId: string | undefined = response.headers.get("x-conversation-id") ?? undefined;
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const decoded = decoder.decode(value, { stream: true });
    if (!isEventStream) {
      options.onChunk(decoded);
      continue;
    }
    buffer += decoded;

    // Support plain text chunks, plus simple newline-delimited JSON/SSE data.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.startsWith("data:") ? line.slice(5).trim() : line;
      if (!data || data === "[DONE]") continue;
      try {
        const event = JSON.parse(data) as {
          content?: string;
          text?: string;
          conversation_id?: string;
        };
        returnedConversationId = event.conversation_id ?? returnedConversationId;
        options.onChunk(event.content ?? event.text ?? "");
      } catch {
        options.onChunk(data);
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    if (isEventStream) {
      const data = buffer.startsWith("data:") ? buffer.slice(5).trim() : buffer;
      if (data !== "[DONE]") options.onChunk(data);
    } else {
      options.onChunk(buffer);
    }
  }
  return { conversationId: returnedConversationId };
}
