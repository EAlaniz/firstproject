import React, { useState } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import ConversationsList from './ConversationsList';
import MessageThread from './MessageThread';
import MessageInput from './MessageInput';
import NewConversationModal from './NewConversationModal';

const XMTPMessaging: React.FC = () => {
  const { isInitialized, selectedConversation, selectConversation, conversations } = useXMTP();
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing XMTP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <ConversationsList 
          onSelect={handleSelectConversation}
          onNewConversation={() => setIsNewConversationModalOpen(true)}
          selectedId={selectedConversation?.id}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Message Thread */}
            <div className="flex-1 overflow-hidden">
              <MessageThread conversationId={selectedConversation.id} />
            </div>
            
            {/* Message Input */}
            <MessageInput />
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
              <p className="text-gray-500 mb-4">Choose a conversation from the sidebar or start a new one</p>
              <button
                onClick={() => setIsNewConversationModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
      />
    </div>
  );
};

export default XMTPMessaging;
