import React, { useState, useMemo } from 'react';
import { UserPlus, Search, MessageCircle, Trash2 } from 'lucide-react';
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
  const { conversations, messages, deleteConversation } = useXMTP();
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Ensure conversations is always an array
  const safeConversations = conversations || [];

  // Debug: log conversations passed to UI
  console.log('[DEBUG] Conversations passed to ConversationsList UI:', safeConversations);

  // Filter conversations by search
  const filtered = useMemo(() => {
    if (!search.trim()) return safeConversations;
    return safeConversations.filter(c => c.id.toLowerCase().includes(search.toLowerCase()));
  }, [safeConversations, search]);

  // Get last message for preview
  function getLastMessage(conversationId: string) {
    const safeMessages = messages || [];
    const convMsgs = safeMessages.filter(m => m.conversationId === conversationId);
    if (!convMsgs.length) return '';
    return convMsgs[convMsgs.length - 1].content;
  }

  // Format address for display
  function formatAddress(address: string) {
    if (!address || address.length <= 12) return address || 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      {/* Header - Responsive */}
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b bg-white">
        <button
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px]"
          onClick={onNewConversation}
        >
          <UserPlus className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden">New</span>
        </button>
        
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px]"
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List - Responsive */}
      <div className="flex-1 overflow-y-auto">
        {!filtered || filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm sm:text-base">
              {search.trim() ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!search.trim() && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Start a new conversation to begin messaging
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filtered.map(conv => (
              <div key={conv.id} className="relative group">
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`
                    w-full text-left p-3 sm:p-4 rounded-lg hover:bg-blue-50 focus:bg-blue-100 transition-colors
                    flex flex-col space-y-1 min-h-[60px] sm:min-h-[70px]
                    border
                    ${selectedId === conv.id 
                      ? 'bg-blue-100 border-blue-300' 
                      : unreadConversations.has(conv.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent hover:border-blue-100'}
                  `}
                >
                  <div className="flex items-center space-x-3">
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
                  </div>
                </button>
                {/* Delete button, only visible on hover */}
                <button
                  className="absolute top-2 right-2 p-1 rounded hover:bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteId(conv.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {/* Confirm delete dialog */}
                {confirmDeleteId === conv.id && (
                  <div className="absolute z-50 top-10 right-2 bg-white border border-gray-200 rounded shadow-lg p-3 flex flex-col items-center">
                    <p className="text-sm mb-2">Delete this conversation?</p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                          setConfirmDeleteId(null);
                        }}
                      >Delete</button>
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                      >Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More Button for Pagination */}
      {conversationCursor && (
        <button
          onClick={loadMoreConversations}
          className="w-full py-2 text-blue-600 border-t border-gray-200 bg-white hover:bg-blue-50 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {/* Mobile Footer Info */}
      <div className="p-3 sm:p-4 border-t bg-white md:hidden">
        <div className="text-center text-xs text-gray-500">
          {filtered ? filtered.length : 0} conversation{(filtered ? filtered.length : 0) !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList; 