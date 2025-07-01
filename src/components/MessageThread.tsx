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
  const { messages, isSyncing, selectedConversation } = useXMTP();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Defensive: use empty array if messages is undefined/null
  const safeMessages = conversationId && messages && messages[conversationId] ? messages[conversationId] : [];

  // For XMTP, messages are already filtered by the selected conversation
  // The messages array contains only messages for the currently selected conversation
  const threadMessages = safeMessages;

  // Debug logging (disabled to reduce console spam)
  // console.log('[MessageThread] Messages state:', {
  //   totalMessages: safeMessages.length,
  //   threadMessages: threadMessages.length,
  //   conversationId,
  //   selectedConversationId: selectedConversation?.id,
  //   messages: safeMessages.map(m => ({ id: m.id, content: m.content?.substring(0, 50) }))
  // });

  const msgCursor = conversationId ? messageCursors[conversationId] : null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages.length]);

  // Group messages by sender for display
  function groupMessages(messages: DecodedMessage<string>[]) {
    const groups: { sender: string; messages: DecodedMessage<string>[] }[] = [];
    let lastSender = null;
    let currentGroup: { sender: string; messages: DecodedMessage<string>[] } | null = null;
    for (const msg of messages) {
      const msgFrom = (msg as DecodedMessage<string> & { from?: string; senderAddress?: string }).from || 
                     (msg as DecodedMessage<string> & { from?: string; senderAddress?: string }).senderAddress || 'Unknown';
      if (msgFrom !== lastSender) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { sender: msgFrom, messages: [msg] };
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
    <div className="flex-1 overflow-y-auto px-4 py-6 bg-white dark:bg-black message-list">
      {/* Sync badge/status */}
      <div className="text-sm text-gray-500 dark:text-gray-400 px-2 pb-2">
        {isSyncing ? '🔄 Syncing with XMTP...' : '✅ Synced'}
      </div>
      {/* Load More Button for Pagination */}
      {msgCursor && (
        <button
          onClick={() => conversationId && loadMoreMessages(conversationId)}
          className="w-full py-2 text-blue-600 border-b border-gray-200 bg-white hover:bg-blue-50 disabled:opacity-50 mb-2"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
      {isLoading ? (
        <div className="text-gray-400 text-sm px-4 py-2">Loading messages...</div>
      ) : threadMessages.length === 0 ? (
        <div className="text-center text-gray-400">No messages yet</div>
      ) : (
        groupMessages(threadMessages).map((group, groupIdx) => {
          const isOwn = group.sender?.toLowerCase() === address?.toLowerCase();
          return (
            <div key={groupIdx} className={`mb-4 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              {/* Sender label for group (hide for own messages) */}
              {!isOwn && (
                <div className="text-xs text-gray-500 mb-1 ml-2">
                  {group.sender ? `${group.sender.slice(0, 8)}...${group.sender.slice(-4)}` : 'Unknown'}
                </div>
              )}
              {group.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`message-bubble ${isOwn ? 'mine' : 'theirs'} max-w-[70%] px-4 py-2 rounded-2xl mb-1 text-sm break-words shadow-md bg-white dark:bg-black ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-none self-end'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none self-start dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <div className="text-base">{msg.content}</div>
                  <div className="timestamp text-xs mt-1 opacity-70 text-right">
                    {msg.sentAtNs
                      ? new Date(Number(msg.sentAtNs) / 1e6).toLocaleTimeString()
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