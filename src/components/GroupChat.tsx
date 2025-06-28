import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { useGroupWithRetry } from '../hooks/useGroupWithRetry';
import MessageInput from './MessageInput';
import MessageThread from './MessageThread';

interface GroupChatProps {
  conversationId: string;
  onRetry?: (msg: any) => void;
}

const GroupChat: React.FC<GroupChatProps> = ({ conversationId, onRetry }) => {
  const { address } = useAccount();
  const { client, conversations, loadMoreMessages, messageCursors, isLoading, sendMessage } = useXMTP();
  
  // Use the enhanced group hook with retry logic
  const {
    canSend,
    membershipIsPublished,
    isRetrying,
    retryCount,
    lastError,
    lastSyncTime,
    retry: manualRetry,
    refresh,
    isGroup
  } = useGroupWithRetry(conversationId, {
    maxRetries: 5,
    retryDelay: 2000,
    autoRetry: true,
    onStateChange: (state) => {
      console.log('🔄 Group state changed:', state);
    }
  });

  const [isSending, setIsSending] = useState(false);

  // Get the conversation object
  const conversation = conversations.find(c => c.id === conversationId);

  // Handle sending messages using the XMTP context sendMessage function
  const handleSend = async (text: string) => {
    if (!conversation || !canSend || isSending) {
      console.warn('Cannot send message:', { 
        hasConversation: !!conversation, 
        canSend, 
        isSending 
      });
      return;
    }

    setIsSending(true);
    try {
      console.log('[GroupChat] Sending message via XMTP context...');
      await sendMessage(text, conversation);
      console.log('✅ Message sent successfully via XMTP context');
    } catch (error) {
      console.error('❌ Failed to send message via XMTP context:', error);
      throw error; // Let MessageInput handle the error display
    } finally {
      setIsSending(false);
    }
  };

  // Render group status information
  const renderGroupStatus = () => {
    if (!isGroup) return null;

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
              Group Chat Status
            </h3>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <div className="flex items-center gap-2">
                <span>📤 Can Send:</span>
                <span className={canSend ? 'text-green-600' : 'text-red-600'}>
                  {canSend ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>📋 Membership:</span>
                <span className={membershipIsPublished ? 'text-green-600' : 'text-yellow-600'}>
                  {membershipIsPublished ? '✅ Published' : '⏳ Syncing...'}
                </span>
              </div>
              {lastError && (
                <div className="text-red-600">
                  ❌ Error: {lastError}
                </div>
              )}
              {lastSyncTime && (
                <div className="text-gray-600">
                  🔄 Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {isRetrying && (
              <div className="text-xs text-blue-600 animate-pulse">
                🔄 Retrying... ({retryCount})
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={manualRetry}
                disabled={isRetrying}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Retry
              </button>
              <button
                onClick={refresh}
                disabled={isRetrying}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading group chat...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (lastError && !canSend && retryCount >= 3) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Group Chat Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {lastError}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={manualRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Group status panel */}
      {renderGroupStatus()}
      
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
        {!canSend ? (
          <div className="text-center py-4">
            <div className="text-yellow-600 dark:text-yellow-400 mb-2">
              ⏳ Group membership is syncing...
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Messaging will be available shortly. This usually takes a few seconds.
            </p>
            {isRetrying && (
              <p className="text-xs text-blue-600 mt-2">
                🔄 Retrying... ({retryCount}/5)
              </p>
            )}
          </div>
        ) : (
          <MessageInput
            onSend={handleSend}
            disabled={isSending}
            canSend={canSend}
          />
        )}
      </div>
    </div>
  );
};

export default GroupChat; 