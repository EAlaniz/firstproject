import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';

interface MessageThreadProps {
  conversationId: string | null;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const { address } = useAccount();
  const { messages, isLoading } = useXMTP();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter messages for this conversation
  const threadMessages = conversationId
    ? messages.filter(m => m.conversationId === conversationId)
    : [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading messages…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-white">
      {threadMessages.length === 0 ? (
        <div className="text-center text-gray-400">No messages yet</div>
      ) : (
        threadMessages.map((msg, i) => {
          const isOwn = msg.senderAddress?.toLowerCase() === address?.toLowerCase();
          return (
            <div
              key={i}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="text-sm break-words">{msg.content}</div>
                <div className="text-xs mt-1 opacity-70 text-right">
                  {msg.sentAtNs
                    ? new Date(Number(msg.sentAtNs) / 1e6).toLocaleTimeString()
                    : ''}
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread; 