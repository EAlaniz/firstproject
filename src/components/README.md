# XMTP Messaging Components

This directory contains a modular architecture for XMTP messaging with direct message (DM) support only.

## Architecture Overview

### Core Components

- **`XMTPMessaging.tsx`** - Main messaging interface with sidebar and responsive layout
- **`ChatToggle.tsx`** - Router component that renders DM chat only
- **`DMChat.tsx`** - Direct message chat component

### Supporting Components

- **`ConversationsList.tsx`** - Sidebar conversation list
- **`MessageThread.tsx`** - Message display component
- **`MessageInput.tsx`** - Message input with send functionality
- **`NewConversationModal.tsx`** - Modal for creating new conversations

## Key Features

### Modular Design
- **Separation of Concerns**: DM chats are handled in a dedicated component
- **Reusable Components**: Shared components like MessageThread and MessageInput
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Graceful error states

## Usage

```tsx
import { XMTPMessaging } from './components';

// In your app
<XMTPMessaging isOpen={isOpen} onClose={onClose} />
```

The component automatically:
1. Renders DM chat for selected conversations
2. Shows relevant status information
3. Handles errors gracefully

## Configuration

The retry mechanism can be configured via the `useGroupWithRetry` hook options:

```tsx
const groupState = useGroupWithRetry(conversationId, {
  maxRetries: 5,        // Maximum retry attempts
  retryDelay: 2000,     // Delay between retries (ms)
  autoRetry: true,      // Enable automatic retry
  onStateChange: (state) => console.log('State changed:', state)
});
```

## Benefits

1. **Production Ready**: Handles real-world XMTP group sync issues
2. **Better UX**: Clear status indicators and retry options
3. **Maintainable**: Clean separation of concerns
4. **Extensible**: Easy to add new features or modify behavior
5. **Robust**: Comprehensive error handling and fallbacks 