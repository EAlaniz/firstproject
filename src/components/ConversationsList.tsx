import React, { useMemo } from 'react';
import { UserPlus, MessageCircle, Trash2 } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

interface ConversationsListProps {
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  selectedId?: string;
  loadMoreConversations: () => void;
  conversationCursor: string | null;
  isLoading: boolean;
  conversationPreviews: { [id: string]: string };
  unreadConversations: Set<string>;
}

const ConversationsList: React.FC<ConversationsListProps> = ({ onSelect, onNewConversation, selectedId, loadMoreConversations, conversationCursor, isLoading, conversationPreviews, unreadConversations }) => {
  const { conversations, deleteConversation } = useXMTP();

  // Ensure conversations is always an array
  const safeConversations = useMemo(() => conversations || [], [conversations]);

  // Format address for display
  function formatAddress(address: string) {
    if (!address || address.length <= 12) return address || 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  // Skeleton loader component
  const SkeletonConversation = () => (
    <div className="animate-pulse flex items-center space-x-3 p-3">
      <div className="w-8 h-8 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-50 dark:bg-gray-800 flex flex-col">
      {/* Header - Clean and Simple */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Messages</h3>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
          onClick={onNewConversation}
        >
          <UserPlus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && safeConversations.length === 0 ? (
          <div>
            {[...Array(4)].map((_, i) => <SkeletonConversation key={i} />)}
          </div>
        ) : safeConversations.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-base">No conversations yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start a new conversation to begin messaging
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {safeConversations.map(conv => (
              <div key={conv.id} className="relative group">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`
                    w-full text-left p-4 rounded-lg hover:bg-blue-50 focus:bg-blue-100 transition-colors
                    flex items-center space-x-3 min-h-[70px]
                    border
                    ${selectedId === conv.id
                      ? 'bg-blue-100 border-blue-300' 
                      : unreadConversations.has(conv.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent hover:border-blue-100'}
                  `}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 relative">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    {unreadConversations.has(conv.id) && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base sm:text-lg truncate conversation-title">
                      {formatAddress(conv.id)}
                    </p>
                    <p className="message-preview text-xs sm:text-sm text-gray-600 truncate mt-1">
                      {conversationPreviews[conv.id] || 'No messages yet'}
                    </p>
                  </div>
                </button>
                {/* Simple delete button */}
                <button
                  className="absolute top-2 right-2 p-2 rounded-full hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      deleteConversation(conv.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button for Pagination */}
      {conversationCursor && (
        <button
          onClick={loadMoreConversations}
          className="w-full py-3 text-blue-600 border-t border-gray-200 bg-white hover:bg-blue-50 disabled:opacity-50 font-medium"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default ConversationsList; 