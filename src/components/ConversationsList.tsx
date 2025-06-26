import React, { useState, useMemo } from 'react';
import { UserPlus, Search } from 'lucide-react';
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

  return (
    <aside className="w-full sm:w-80 bg-gray-50 border-r flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <button
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={onNewConversation}
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </button>
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-8 pr-2 py-2 rounded bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No conversations</div>
        ) : (
          filtered.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-4 py-3 border-b hover:bg-blue-50 transition flex flex-col ${selectedId === conv.id ? 'bg-blue-100' : ''}`}
            >
              <span className="font-medium text-sm truncate">{conv.id}</span>
              <span className="text-xs text-gray-500 truncate mt-1">{getLastMessage(conv.id) || 'No messages yet'}</span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
};

export default ConversationsList; 