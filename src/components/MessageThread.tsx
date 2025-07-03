import React, { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import type { DecodedMessage } from '@xmtp/browser-sdk';

interface MessageThreadProps {
  conversationId: string | null;
  loadMoreMessages: (conversationId: string) => void;
  messageCursors: { [convId: string]: string | null };
  isLoading: boolean;
  onRetry?: (msg: DecodedMessage<string>) => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId, loadMoreMessages, messageCursors, isLoading, onRetry }) => {
  const { address } = useAccount();
  const { messages, client } = useXMTP();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user's inbox ID for proper message ownership detection
  const currentUserInboxId = client?.inboxId;

  // Defensive: use empty array if messages is undefined/null
  const safeMessages = conversationId && messages && messages[conversationId] ? messages[conversationId] : [];

  // For XMTP, messages are already filtered by the selected conversation
  // The messages array contains only messages for the currently selected conversation
  const threadMessages = safeMessages;


  const msgCursor = conversationId ? messageCursors[conversationId] : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  // Group messages by sender for display
  function groupMessages(messages: DecodedMessage<string>[]) {
    const groups: { sender: string; isOwn: boolean; messages: DecodedMessage<string>[] }[] = [];
    let lastSender = null;
    let currentGroup: { sender: string; isOwn: boolean; messages: DecodedMessage<string>[] } | null = null;
    
    for (const msg of messages) {
      // XMTP V3 uses senderInboxId as the primary sender identifier
      const msgFrom = (msg as any).senderInboxId || 
                     (msg as any).senderAddress || 
                     (msg as any).from || 
                     'Unknown';
      
      // Determine if this message is from the current user
      const isCurrentUserMessage = msgFrom === currentUserInboxId || 
                                  msgFrom?.toLowerCase() === address?.toLowerCase();
      
      // Debug logging for sender detection (uncomment for debugging)
      // console.log('[MessageThread] Message sender analysis:', {
      //   msgFrom,
      //   currentUserInboxId,
      //   address,
      //   isCurrentUserMessage,
      //   messageContent: String(msg.content).substring(0, 20)
      // });
      
      if (msgFrom !== lastSender) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { 
          sender: msgFrom, 
          isOwn: isCurrentUserMessage,
          messages: [msg] 
        };
        lastSender = msgFrom;
      } else {
        currentGroup?.messages.push(msg);
      }
    }
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }

  // Message status UI
  function renderStatus(msg: DecodedMessage<string> & { status?: string }) {
    if (msg.status === 'pending') return <span className="text-xs text-gray-400 ml-2">⏳ Sending</span>;
    if (msg.status === 'failed') return <span className="text-xs text-red-500 ml-2 cursor-pointer" onClick={() => onRetry?.(msg)}>❌ Failed — click to retry</span>;
    return null;
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto px-4 py-6 bg-gray-50 dark:bg-gray-900 message-list"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Load More Button for Pagination */}
      {msgCursor && (
        <button
          onClick={() => conversationId && loadMoreMessages(conversationId)}
          className="w-full py-3 text-blue-600 bg-white hover:bg-blue-50 disabled:opacity-50 mb-4 rounded-lg border border-gray-200 font-medium transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More Messages'}
        </button>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-500">Loading messages...</span>
        </div>
      ) : threadMessages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <div>
            <div className="text-4xl mb-3">💬</div>
            <p className="text-gray-500 text-lg">No messages yet</p>
            <p className="text-gray-400 text-sm mt-1">Start the conversation!</p>
          </div>
        </div>
      ) : (
        groupMessages(threadMessages).map((group, groupIdx) => {
          const isOwn = group.isOwn;
          return (
            <div key={groupIdx} className={`mb-4 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {/* Sender label */}
              <div className={`text-xs mb-1 ${isOwn ? 'mr-2 text-blue-600 dark:text-blue-400' : 'ml-2 text-gray-500 dark:text-gray-400'}`}>
                {isOwn ? 'You' : 'Contact'}
              </div>
              {group.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[80%] px-4 py-3 mb-2 break-words ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md self-end ml-auto shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md self-start mr-auto shadow-sm border border-gray-100 dark:border-gray-700'
                  }`}
                >
                  <div className="text-sm leading-relaxed">{typeof msg.content === 'string' ? msg.content : String(msg.content || '')}</div>
                  <div className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                    {msg.sentAtNs
                      ? new Date(Number(msg.sentAtNs) / 1e6).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                    {renderStatus(msg)}
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageThread; 