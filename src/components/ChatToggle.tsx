Ccimport React from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import DMChat from './DMChat';
import type { DecodedMessage } from '@xmtp/browser-sdk';

interface ChatToggleProps {
  conversationId: string | null;
  onRetry?: (msg: DecodedMessage<string>) => void;
}

const ChatToggle: React.FC<ChatToggleProps> = ({ conversationId, onRetry }) => {
  const { conversations } = useXMTP();

  // If no conversation is selected, show placeholder
  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  // Find the conversation to determine its type
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Always render DMChat only
  return <DMChat conversationId={conversationId} onRetry={onRetry} />;
};

export default ChatToggle; 