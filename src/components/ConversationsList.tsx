import React, { useState, useMemo } from 'react';
import { UserPlus, Search, MessageCircle } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

interface ConversationsListProps {
  onSelect: (id: string) => void;
  onNewConversation: () => void;
  selectedId?: string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({ onSelect, onNewConversation, selectedId }) => {
  const { conversations, messages } = useXMTP();
  const [search, setSearch] = useState('');

  // Filter conversations by search
  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(c => c.id.toLowerCase().includes(search.toLowerCase()));
  }, [conversations, search]);

  // Get last message for preview
  function getLastMessage(conversationId: string) {
    const convMsgs = messages.filter(m => m.conversationId === conversationId);
    if (!convMsgs.length) return '';
    return convMsgs[convMsgs.length - 1].content;
  }

  // Format address for display
  function formatAddress(address: string) {
    if (address.length <= 12) return address;
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
        {filtered.length === 0 ? (
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
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`
                  w-full text-left p-3 sm:p-4 rounded-lg hover:bg-blue-50 transition-colors
                  flex flex-col space-y-1 min-h-[60px] sm:min-h-[70px]
                  ${selectedId === conv.id 
                    ? 'bg-blue-100 border border-blue-200' 
                    : 'border border-transparent hover:border-blue-100'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">
                      {formatAddress(conv.id)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate mt-1">
                      {getLastMessage(conv.id) || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Footer Info */}
      <div className="p-3 sm:p-4 border-t bg-white md:hidden">
        <div className="text-center text-xs text-gray-500">
          {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList; 