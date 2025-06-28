# XMTP Messaging Components

This directory contains a modular architecture for XMTP messaging with smart retry logic and separation of concerns.

## Architecture Overview

### Core Components

- **`XMTPMessaging.tsx`** - Main messaging interface with sidebar and responsive layout
- **`ChatToggle.tsx`** - Router component that renders appropriate chat type (DM vs Group)
- **`DMChat.tsx`** - Direct message chat component (simple, no retry logic needed)
- **`GroupChat.tsx`** - Group chat component with smart retry logic and status display

### Supporting Components

- **`ConversationsList.tsx`** - Sidebar conversation list
- **`MessageThread.tsx`** - Message display component
- **`MessageInput.tsx`** - Message input with send functionality
- **`NewConversationModal.tsx`** - Modal for creating new conversations

### Custom Hooks

- **`useGroupWithRetry.ts`** - Smart retry logic for group membership syncing

## Key Features

### Smart Retry Mechanism
The `useGroupWithRetry` hook provides:
- Automatic retry with configurable delays
- Manual retry and refresh functions
- Real-time status updates
- Error handling and logging
- Membership validation

### Modular Design
- **Separation of Concerns**: DM and Group chats are handled separately
- **Reusable Components**: Shared components like MessageThread and MessageInput
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Graceful error states with retry options

### Group Chat Features
- Real-time membership status display
- Automatic retry for membership syncing
- Visual indicators for sync progress
- Manual retry and refresh buttons
- Detailed error reporting

## Usage

```tsx
import { XMTPMessaging } from './components';

// In your app
<XMTPMessaging isOpen={isOpen} onClose={onClose} />
```

The component automatically:
1. Detects conversation type (DM vs Group)
2. Applies appropriate retry logic for groups
3. Shows relevant status information
4. Handles errors gracefully

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