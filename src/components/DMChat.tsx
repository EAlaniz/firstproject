import React, { useState, useEffect } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import MessageInput from './MessageInput';
import MessageThread from './MessageThread';
import type { DecodedMessage } from '@xmtp/browser-sdk';

interface DMChatProps {
  conversationId: string;
  onRetry?: (msg: DecodedMessage<string>) => void;
}

const DMChat: React.FC<DMChatProps> = ({ conversationId, onRetry }) => {
  const { conversations, loadMoreMessages, messageCursors, isLoading, sendMessage } = useXMTP();
  const [isSending, setIsSending] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Get the conversation object
  const conversation = conversations.find(c => c.id === conversationId);

  // Per-conversation sync effect
  useEffect(() => {
    let cancelled = false;
    async function syncConversation() {
      if (!conversation) return;
      
      setIsSynced(false);
      setSyncStatus('Checking conversation readiness...');
      
      try {
        // For DM conversations, check if we can send messages
        if ('peerAddress' in conversation) {
          // DM conversation - assume ready for now
          if (!cancelled) {
            setIsSynced(true);
            setSyncStatus('Ready');
          }
        } else {
          // Group conversation - try sync if available
          if (typeof (conversation as unknown as { sync?: () => Promise<void> }).sync === 'function') {
            setSyncStatus('Syncing group...');
            await (conversation as unknown as { sync: () => Promise<void> }).sync();
            if (!cancelled) {
              setIsSynced(true);
              setSyncStatus('Synced');
            }
          } else {
            // No sync method available, assume ready
            if (!cancelled) {
              setIsSynced(true);
              setSyncStatus('Ready');
            }
          }
        }
      } catch (error) {
        console.warn('[DMChat] Sync failed:', error);
        if (!cancelled) {
          setSyncStatus('Ready (sync failed)');
          setIsSynced(true); // Allow sending even if sync failed
        }
      }
    }
    
    if (conversation) {
      syncConversation();
    }
    return () => { cancelled = true; };
  }, [conversation]);

  if (!conversation) {
    console.warn('[DMChat] Conversation not found for ID:', conversationId, 'Available:', conversations.map(c => c.id));
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading conversation...<br/>If this persists, try refreshing or starting a new DM.</p>
        </div>
      </div>
    );
  }

  // Handle sending messages using the XMTP context sendMessage function
  const handleSend = async (text: string) => {
    if (!conversation || isSending) {
      console.warn('Cannot send message:', { 
        hasConversation: !!conversation, 
        isSending 
      });
      return;
    }

    setIsSending(true);
    try {
      console.log('[DMChat] Sending message via XMTP context...');
      await sendMessage(text, conversation);
      console.log('✅ Message sent successfully via XMTP context');
    } catch (error) {
      // Check if this is a sync message error (which is actually success)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isSyncMessage = errorMessage.includes('synced') && errorMessage.includes('succeeded');
      
      if (isSyncMessage) {
        console.log('✅ Message sent successfully via XMTP context (sync message)');
        // Don't throw - this is actually success
      } else {
        console.error('❌ Failed to send message via XMTP context:', error);
        throw error; // Let MessageInput handle the error display
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageThread
          conversationId={conversationId}
          loadMoreMessages={loadMoreMessages}
          messageCursors={messageCursors}
          isLoading={isLoading}
          onRetry={onRetry}
        />
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <MessageInput
          onSend={handleSend}
          disabled={isSending}
          canSend={isSynced}
        />
        {!isSynced && (
          <div className="text-yellow-500 text-xs mt-1">{syncStatus || 'Syncing messages, please wait...'}</div>
        )}
      </div>
    </div>
  );
};

export default DMChat; 