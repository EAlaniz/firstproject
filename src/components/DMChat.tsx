import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import MessageInput from './MessageInput';
import MessageThread from './MessageThread';

interface DMChatProps {
  conversationId: string;
  onRetry?: (msg: any) => void;
}

const DMChat: React.FC<DMChatProps> = ({ conversationId, onRetry }) => {
  const { address } = useAccount();
  const { conversations, loadMoreMessages, messageCursors, isLoading, sendMessage } = useXMTP();
  const [isSending, setIsSending] = useState(false);

  // Get the conversation object
  const conversation = conversations.find(c => c.id === conversationId);

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
      console.error('❌ Failed to send message via XMTP context:', error);
      throw error; // Let MessageInput handle the error display
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
          canSend={true} // DMs can always send if conversation exists
        />
      </div>
    </div>
  );
};

export default DMChat; 