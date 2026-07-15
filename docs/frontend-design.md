# Frontend Design

## Goal

The frontend should be a simple, readable React chat interface for learning how an AI app works.

The first version should let a user:

- view a chat screen immediately after opening the app
- view and manage their existing conversations in a conversation list
- create a new conversation and switch between conversations
- type a message
- send the message to the backend
- see the assistant response stream into the page
- continue the same conversation over multiple turns
- understand the code structure without learning a large frontend framework first

This is not a marketing site. The main screen should be the actual chat app.

## Design Principles

Keep the first frontend small and explicit.

- Use React function components and TypeScript.
- Keep API calls in `frontend/src/api/`.
- Keep reusable UI in `frontend/src/components/`.
- Keep streaming and chat state in `frontend/src/hooks/`.
- Keep shared frontend types in `frontend/src/types/`.
- Prefer plain CSS before introducing a UI framework.
- Avoid global state libraries for the first version.
- Avoid advanced chat features until the basic send-and-stream loop works.

The code should make the data flow easy to follow:

```text
User action
  -> component event handler
  -> chat hook
  -> API client
  -> FastAPI backend
  -> streamed response
  -> hook updates message state
  -> components re-render
```

## First Screen

The first screen should be a focused chat workspace.

Suggested layout:

```text
+------------------+-------------------------+
| Conversations    | AI Chat                 |
| [+ New chat]     | Local learning app      |
|                  +-------------------------+
| > Project idea   |                         |
|   Recipe helper  |  Assistant message      |
|   Untitled       |              User msg   |
|                  |  Assistant reply...     |
|                  |                         |
|                  +-------------------------+
|                  | [ message input    ]   |
|                  |                 [Send]  |
+------------------+-------------------------+
```

The page should have:

- a conversation sidebar with the conversation list and a clear new-chat action
- a loading state while conversations are being fetched
- an empty state when there are no saved conversations
- a selected state for the active conversation
- a delete action for each conversation, with a safe confirmation or undo pattern
- a small header with the app name and connection/status area
- a scrollable message list
- an empty state when there are no messages
- a composer fixed at the bottom of the chat panel
- clear disabled/loading states while the assistant is responding
- readable error messages when a request fails

## Component Plan

Recommended first component structure:

```text
frontend/src/
  App.tsx
  api/
    chat.ts
  components/
    ChatPage.tsx
    ConversationSidebar.tsx
    ConversationItem.tsx
    ConversationHeader.tsx
    MessageList.tsx
    MessageBubble.tsx
    ChatInput.tsx
    EmptyState.tsx
  hooks/
    useChatStream.ts
  types/
    chat.ts
    conversation.ts
  styles/
    globals.css
```

### `App.tsx`

Responsibility:

- render the main application page

For the first version, `App.tsx` can simply render `ChatPage`.

### `ChatPage.tsx`

Responsibility:

- own the overall chat page layout
- call `useChatStream`
- pass message state and callbacks down to child components

It should not contain low-level streaming code.

### `ConversationSidebar.tsx`

Responsibility:

- render the conversation list beside the active chat
- show loading and empty states
- highlight the active conversation
- expose new-conversation, select-conversation, and delete-conversation actions

The sidebar should remain a presentational component. Conversation fetching and mutations should live in a small conversation hook or API client.

### `ConversationItem.tsx`

Responsibility:

- render one conversation title and its updated time when useful
- expose a clearly scoped delete action
- indicate which conversation is currently active

### `ConversationHeader.tsx`

Responsibility:

- display the app name
- show simple status text such as `Ready`, `Thinking`, or `Offline`
- optionally expose a new-chat button later

### `MessageList.tsx`

Responsibility:

- render all messages in order
- scroll to the newest message when a response grows
- show `EmptyState` when there are no messages

### `MessageBubble.tsx`

Responsibility:

- render one message
- visually distinguish `user` from `assistant`
- preserve line breaks in message content

The first version does not need Markdown rendering or syntax highlighting.

### `ChatInput.tsx`

Responsibility:

- manage the text input field
- submit on button click
- submit on Enter
- insert a new line with Shift+Enter
- prevent empty messages
- disable input or send button while needed

### `useChatStream.ts`

Responsibility:

- store current `messages`
- store `conversationId`
- store `isStreaming`
- store `error`
- expose a `sendMessage` function
- append streamed assistant text into the active assistant message
- reset or load message state when the active conversation changes

This hook is the most important learning piece in the frontend. It should stay readable even if it is a little verbose.

### `api/chat.ts`

Responsibility:

- call backend chat endpoints
- hide `fetch` details from components
- expose a small function for streaming chat responses

The first streaming implementation can use `fetch` and `ReadableStream`.

### `api/conversations.ts`

Responsibility:

- list conversations
- create a conversation
- delete a conversation
- load messages for a selected conversation

Keep these functions small and typed so the sidebar and chat hook do not need to know the fetch details.

## Frontend Types

Start with a small set of types.

```ts
export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  conversationId?: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
};

export type ChatStatus = "idle" | "streaming" | "error";
```

Conversation types should be kept separately in `frontend/src/types/conversation.ts`:

```ts
export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};
```

These types may later be aligned more closely with backend response schemas.

## Streaming Flow

The expected frontend streaming flow:

```text
1. User submits text.
2. Frontend adds a user message to local state immediately.
3. Frontend adds an empty assistant message.
4. Frontend sends a POST request to the backend streaming endpoint.
5. Backend streams text chunks.
6. Frontend appends each chunk to the assistant message.
7. Stream ends.
8. Frontend marks the request as complete.
```

Important behavior:

- The UI should feel responsive before the backend finishes.
- The assistant bubble should appear as soon as streaming starts.
- If the request fails, the user message should remain visible.
- The error should be shown without crashing the page.

## Conversation Context Management

The database keeps the complete message history, but the backend should not
send an unbounded history to the model on every request. The first context
management version uses a rolling summary:

```text
complete messages in SQLite
  -> keep the newest messages within the message and character budgets
  -> summarize older messages when they leave the active window
  -> store the summary on the conversation
  -> send summary + recent messages to the model
```

The summary is model-facing context, not a replacement for the original
messages. The frontend can continue loading and displaying the complete
conversation history.

Backend defaults should be configurable through environment variables:

```text
CHAT_MAX_HISTORY_MESSAGES=20
CHAT_CONTEXT_MAX_CHARS=24000
CHAT_SUMMARY_MAX_CHARS=4000
```

Summary behavior:

- create a summary only when older messages fall outside the active context window
- include the previous summary when creating the next summary
- preserve user goals, decisions, constraints, technical details, and unresolved questions
- keep the summary bounded in length
- reserve context budget for the summary before selecting recent messages
- if summarization fails, continue with the recent-message context and log the failure

## API Assumptions

The frontend should expect the backend to provide:

```text
POST /api/chat/stream
GET  /api/conversations
GET  /api/conversations/{conversation_id}/messages
```

The frontend should use these endpoints as follows:

- load `GET /api/conversations` when the page opens and after conversation mutations
- use `POST /api/conversations` for an explicit new conversation
- use `GET /api/conversations/{conversation_id}/messages` when switching conversations
- use `DELETE /api/conversations/{conversation_id}` after the user confirms deletion
- include the active conversation ID in `POST /api/chat/stream`

The chat stream remains the core interaction, but conversation loading should be implemented alongside the sidebar so the active conversation is always clear.

## Styling Direction

The interface should feel like a practical chat tool:

- calm neutral background
- white chat surface
- clear spacing
- readable message width
- subtle borders
- user messages aligned to the right
- assistant messages aligned to the left
- input area always easy to find

Avoid:

- decorative landing page sections
- large hero content
- heavy animations
- nested or overly complex sidebar navigation
- one-color novelty themes

CSS should start in `frontend/src/styles/globals.css`. If the file grows too large later, component-level CSS files can be introduced.

## Development Order

Build the frontend in small steps.

1. Create the static chat layout using mock messages.
2. Split the layout into components.
3. Add `ChatInput` behavior with local-only messages.
4. Add frontend types.
5. Add `api/chat.ts`.
6. Add `useChatStream.ts`.
7. Connect the UI to the backend streaming endpoint.
8. Add loading and error states.
9. Add the conversation API client and conversation types.
10. Add the conversation sidebar with loading, empty, selected, and delete states.
11. Load messages when the user switches conversations.
12. Add new-conversation and delete-conversation behavior.
13. Add context message limits and configurable character budgets.
14. Add conversation-level rolling summaries for older messages.

Each step should leave the app runnable.

## First Implementation Scope

The first frontend implementation should include:

- `ChatPage`
- `ConversationSidebar`
- `ConversationItem`
- `ConversationHeader`
- `MessageList`
- `MessageBubble`
- `ChatInput`
- `EmptyState`
- `useChatStream`
- `api/chat`
- `api/conversations`
- basic responsive CSS

It should not include:

- login
- settings page
- model picker
- file upload
- Markdown rendering
- syntax highlighting
- global state library
- UI component framework

## Open Questions

These can be decided before implementation or during the first pass:

- Should the first version create a new conversation automatically on the first message?
- Should the backend return message IDs during the stream, or should the frontend use temporary IDs?
- Should the streaming format be plain text chunks or server-sent event style lines?
- Should a failed assistant response create a visible failed assistant message, or only show an error near the input?

Recommended beginner-friendly defaults:

- create a conversation automatically on the first message
- use temporary frontend IDs while streaming
- stream plain text chunks first
- show errors near the input and keep the user's message visible


