# Frontend Design

## Goal

The frontend should be a simple, readable React chat interface for learning how an AI app works.

The first version should let a user:

- view a chat screen immediately after opening the app
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
+--------------------------------------------+
| AI Chat                                    |
| Local learning app                         |
+--------------------------------------------+
|                                            |
|  Assistant message                         |
|                           User message     |
|  Assistant streaming reply...              |
|                                            |
+--------------------------------------------+
| [ message input                         ]  |
|                                  [Send]    |
+--------------------------------------------+
```

The page should have:

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
    ConversationHeader.tsx
    MessageList.tsx
    MessageBubble.tsx
    ChatInput.tsx
    EmptyState.tsx
  hooks/
    useChatStream.ts
  types/
    chat.ts
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

This hook is the most important learning piece in the frontend. It should stay readable even if it is a little verbose.

### `api/chat.ts`

Responsibility:

- call backend chat endpoints
- hide `fetch` details from components
- expose a small function for streaming chat responses

The first streaming implementation can use `fetch` and `ReadableStream`.

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

## API Assumptions

The frontend should expect the backend to provide:

```text
POST /api/chat/stream
GET  /api/conversations
GET  /api/conversations/{conversation_id}/messages
```

The first frontend milestone only needs `POST /api/chat/stream`.

Conversation loading can come after the core streaming loop is working.

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
- complex sidebars in the first version
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
9. Add conversation loading after streaming works.

Each step should leave the app runnable.

## First Implementation Scope

The first frontend implementation should include:

- `ChatPage`
- `ConversationHeader`
- `MessageList`
- `MessageBubble`
- `ChatInput`
- `EmptyState`
- `useChatStream`
- `api/chat`
- basic responsive CSS

It should not include:

- login
- settings page
- model picker
- file upload
- Markdown rendering
- syntax highlighting
- conversation sidebar
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


