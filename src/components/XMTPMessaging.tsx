import React, { useState, useEffect } from 'react';
import { X, Menu, RefreshCw } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';
import ConversationsList from './ConversationsList';
import DMChat from './DMChat';
import NewConversationModal from './NewConversationModal';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { 
    isInitialized, 
    selectedConversation, 
    selectConversation, 
    conversations, 
    isLoading, 
    loadMoreConversations, 
    conversationCursor, 
    conversationPreviews, 
    unreadConversations,
    sendMessage,
    forceDiscoverConversations,
    forceDiscoverNewConversations,
    loadMoreMessages
  } = useXMTP();
  
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
      // Close sidebar on mobile after selecting conversation
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
  };

  const handleClose = () => {
    setIsSidebarOpen(false);
    onClose();
  };

  // Handle manual conversation refresh
  const handleRefreshConversations = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('[UI] 🔄 Manual refresh triggered');
      
      // Force discover new conversations first
      await forceDiscoverNewConversations();
      
      // Then force discover all conversations
      await forceDiscoverConversations();
      
      // If there's a selected conversation, reload its messages
      if (selectedConversation) {
        await loadMoreMessages(selectedConversation.id);
        console.log('[UI] 🔄 Reloaded messages for selected conversation');
      }
      
      console.log('[UI] ✅ Manual refresh completed');
    } catch (error) {
      console.error('[UI] ❌ Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle message retry (for failed messages)
  const handleRetry = async (msg: { content?: string; id: string }) => {
    console.log('Retrying message:', msg);
    if (msg.content && selectedConversation) {
      // Retry sending the message using the XMTP context sendMessage function
      try {
        await sendMessage(msg.content, selectedConversation);
        console.log('Retry successful');
      } catch (error) {
        console.error('Retry failed:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onWheel={(e) => e.stopPropagation()}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-t-lg">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg sm:text-xl font-semibold">Messages</h2>
            
            {/* Connection Status Indicator */}
            {isInitialized && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 hidden sm:inline">Connected</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Refresh Button */}
            <button
              onClick={handleRefreshConversations}
              disabled={isRefreshing}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Responsive Layout */}
        <div className="flex flex-1 overflow-hidden">
          {!isInitialized ? (
            /* Loading State - Responsive */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-sm">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Initializing XMTP...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Sidebar - Responsive */}
              <div className={`
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
                absolute md:relative
                z-10 md:z-auto
                w-80 max-w-[85vw] md:max-w-none
                h-full
                bg-white md:bg-gray-50 dark:bg-gray-900 md:dark:bg-gray-800
                border-r border-gray-200 dark:border-gray-700
                transition-transform duration-300 ease-in-out
                flex flex-col
              `}>
                <ConversationsList 
                  onSelect={handleSelectConversation}
                  onNewConversation={() => setIsNewConversationModalOpen(true)}
                  selectedId={selectedConversation?.id}
                  loadMoreConversations={loadMoreConversations}
                  conversationCursor={conversationCursor}
                  isLoading={isLoading}
                  conversationPreviews={conversationPreviews}
                  unreadConversations={unreadConversations}
                />
              </div>

              {/* Mobile Sidebar Overlay */}
              {isSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-5 md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* Main Content - Responsive */}
              <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-w-0">
                {selectedConversation ? (
                  <DMChat 
                    conversationId={selectedConversation.id}
                    onRetry={handleRetry}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <p className="mb-2">Select a conversation to start messaging</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* New Conversation Modal */}
        <NewConversationModal 
          isOpen={isNewConversationModalOpen}
          onClose={() => setIsNewConversationModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default XMTPMessaging;
