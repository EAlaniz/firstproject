import React, { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';
import ConversationsList from './ConversationsList';
import MessageThread from './MessageThread';
import MessageInput from './MessageInput';
import NewConversationModal from './NewConversationModal';
import { getCanSendStatusWithRetry } from '../utils/xmtpGroupValidation';
import { toast } from 'react-hot-toast';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { client: xmtpClient, isInitialized, selectedConversation, selectConversation, conversations, isLoading, sendMessage, loadMoreConversations, conversationCursor, conversationPreviews, unreadConversations, loadMoreMessages, messageCursors } = useXMTP();
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // NEW: Enhanced canSend status with retry mechanism
  const [canSendStatus, setCanSendStatus] = useState<{
    canSend: boolean;
    isGroup: boolean;
    retries: number;
    totalTime: number;
    error?: string;
  }>({ 
    canSend: true, 
    isGroup: false,
    retries: 0,
    totalTime: 0
  });

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

  // NEW: Enhanced canSend validation with retry mechanism
  useEffect(() => {
    if (!isInitialized || !selectedConversation || !xmtpClient) {
      setCanSendStatus({ 
        canSend: true, 
        isGroup: false,
        retries: 0,
        totalTime: 0
      });
      return;
    }

    const validateCanSend = async () => {
      try {
        console.log('[XMTP] Starting canSend validation with retry...');
        const status = await getCanSendStatusWithRetry(xmtpClient, selectedConversation);
        setCanSendStatus(status);
        console.log('[XMTP] canSend status with retry:', status);
        
        // Show toast for group sync status
        if (status.isGroup && !status.canSend && status.retries > 0) {
          toast(`Group syncing... (${status.retries} retries, ${status.totalTime}ms)`, { 
            icon: '⏳',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('[XMTP] canSend validation failed:', error);
        setCanSendStatus({ 
          canSend: false, 
          isGroup: 'members' in selectedConversation,
          retries: 0,
          totalTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    validateCanSend();
  }, [isInitialized, selectedConversation, xmtpClient]);

  // Add handleSend for MessageInput
  async function handleSend(text: string) {
    if (!selectedConversation) return;
    setIsSending(true);
    try {
      // Warn if group membership sync may be in progress
      if ('error' in selectedConversation) {
        toast('Group membership sync may still be in progress. Messages may be delayed or fail.', { icon: '⚠️' });
      }
      await selectedConversation.send(text);
    } catch (err: any) {
      console.error('[XMTP] Failed to send message:', err);
      toast.error(`Send failed: ${err?.message ?? 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  }

  // UPDATED: Use the enhanced canSend status
  const canSend = canSendStatus.canSend;

  // Debug log
  React.useEffect(() => {
    console.log('[XMTP] canSend:', canSend, selectedConversation);
    if (selectedConversation && 'members' in selectedConversation) {
      const group = selectedConversation as any;
      console.log('[XMTP] group.membershipIsPublished:', group.membershipIsPublished);
    }
  }, [canSend, selectedConversation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full h-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header - Responsive */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-white rounded-t-lg">
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
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                bg-white md:bg-gray-50
                border-r border-gray-200
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
              <div className="flex-1 flex flex-col bg-white min-w-0">
                {selectedConversation ? (
                  <>
                    {/* Message Thread - Responsive */}
                    <div className="flex-1 overflow-hidden">
                      <MessageThread 
                        conversationId={selectedConversation.id}
                        loadMoreMessages={loadMoreMessages}
                        messageCursors={messageCursors}
                        isLoading={isLoading}
                      />
                    </div>
                    
                    {/* Message Input - Responsive */}
                    {!isLoading && selectedConversation && (
                      <>
                        <MessageInput onSend={handleSend} disabled={isSending || isLoading} canSend={canSend} />
                        {/* UPDATED: Enhanced status messages with retry info */}
                        {!canSend && selectedConversation && (
                          <div className="text-yellow-500 text-xs mt-2 px-4">
                            {canSendStatus.isGroup ? (
                              <>
                                Group syncing... 
                                {canSendStatus.retries > 0 && ` (${canSendStatus.retries} retries, ${canSendStatus.totalTime}ms)`}
                                {canSendStatus.error && ` - ${canSendStatus.error}`}
                              </>
                            ) : (
                              canSendStatus.error || 'Cannot send messages'
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  /* Empty State - Responsive */
                  <div className="flex-1 flex items-center justify-center p-4">
                    <div className="text-center max-w-sm">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No conversation selected</h3>
                      <p className="text-gray-600 text-sm sm:text-base">Choose a conversation from the sidebar to start messaging</p>
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
