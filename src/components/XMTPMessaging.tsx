import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { getClient } from '../xmtpClient';
import { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import { X, MessageCircle, Send, Users, Plus, Search } from 'lucide-react';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Direct client approach (current working functionality)
  const [xmtpClient, setXmtpClient] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  
  // Enhanced features using direct client
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Use the already initialized XMTP client from the main App
  useEffect(() => {
    if (!isOpen) return;
    if (!walletClient || !address) return;

    const init = async () => {
      try {
        setStatus('Loading XMTP client...');
        // Use the already initialized client from the main App
        const client = getClient();
        if (client) {
          setXmtpClient(client);
          setStatus('XMTP client loaded');
          
          // Load conversations after client is ready
          await loadConversations(client);
        } else {
          setStatus('XMTP client not available. Please ensure XMTP is initialized.');
        }
      } catch (e) {
        console.error('[XMTP] Load failed:', e);
        setStatus('Failed to load XMTP client');
      }
    };

    init();
  }, [walletClient, address, isOpen]);

  // Load conversations using direct client
  const loadConversations = async (client: any) => {
    try {
      setIsLoading(true);
      const convos = await client.conversations.list();
      setConversations(convos);
      console.log('Loaded conversations:', convos.length);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages for a conversation using direct client
  const loadMessages = async (conversation: any) => {
    try {
      setIsLoading(true);
      const msgs = await conversation.messages();
      setMessages(msgs);
      console.log('Loaded messages:', msgs.length);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to new messages using direct client
  const subscribeToMessages = (conversation: any) => {
    try {
      const unsubscribe = conversation.streamMessages((message: any) => {
        setMessages(prev => [...prev, message]);
      });
      
      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Failed to subscribe to messages:', error);
    }
  };

  // Create new conversation using direct client
  const createConversation = async (recipientAddress: string) => {
    const client = xmtpClient || getClient();
    if (!client) return null;

    try {
      let conversation;
      if (typeof client.conversations.newDm === 'function') {
        conversation = await client.conversations.newDm(recipientAddress);
      } else if (typeof client.conversations.newDmWithIdentifier === 'function') {
        conversation = await client.conversations.newDmWithIdentifier({
          kind: 'ETHEREUM',
          identifier: recipientAddress,
        });
      } else {
        throw new Error('No valid method found to create DM conversation');
      }
      
      // Add to conversations list
      setConversations(prev => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      return null;
    }
  };

  // Handle message sending using direct client
  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      if (selectedConversation) {
        // Send to existing conversation
        await selectedConversation.send(message);
        setMessage('');
        // Immediately reload messages so the sent message appears
        await loadMessages(selectedConversation);
      } else if (recipient && recipient.trim()) {
        // Create new conversation and send message
        const conversation = await createConversation(recipient.trim());
        if (conversation) {
          await conversation.send(message);
          setMessage('');
          setRecipient('');
          setSelectedConversation(conversation);
          // Immediately reload messages for the new conversation
          await loadMessages(conversation);
          subscribeToMessages(conversation);
          setShowNewMessage(false);
        } else {
          setStatus('Failed to create conversation');
        }
      } else {
        setStatus('Please enter a recipient address');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Error sending message: ' + (error as Error).message);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation);
    subscribeToMessages(conversation);
  };

  // Handle creating new conversation
  const handleCreateNewConversation = async () => {
    if (!recipient || !recipient.trim()) {
      setStatus('Please enter a valid recipient address');
      return;
    }

    // Validate recipient address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient.trim())) {
      setStatus('Invalid Ethereum address. Please enter a valid 0x... address.');
      return;
    }

    try {
      const conversation = await createConversation(recipient.trim());
      if (conversation) {
        setSelectedConversation(conversation);
        setRecipient('');
        setShowNewMessage(false);
        setStatus('Conversation created successfully');
      } else {
        setStatus('Failed to create conversation');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      setStatus('Error creating conversation: ' + (error as Error).message);
    }
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.peerAddress?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">XMTP Messenger</h2>
            {status && (
              <span className="text-sm text-purple-600 font-medium">{status}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col h-[600px]">
          {/* Conversations List */}
          <div className="flex-1 flex">
            <div className="w-1/3 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Conversations</h3>
                  <button
                    onClick={() => setShowNewMessage(true)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                {/* Search conversations */}
                <div className="relative mb-3">
                  <Search size={16} className="absolute left-2 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search conversations..."
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {showNewMessage && (
                  <div className="mb-3 space-y-2">
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="0xRecipientAddress"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateNewConversation}
                        className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700 transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewMessage(false);
                          setRecipient('');
                        }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Conversations list */}
              <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No conversations found' : 'No conversations yet'}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <div
                      key={conversation.topic || conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-l-4 ${
                        selectedConversation?.topic === conversation.topic || selectedConversation?.id === conversation.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-transparent'
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {conversation.peerAddress?.slice(0, 6)}...{conversation.peerAddress?.slice(-4)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {conversation.topic?.slice(0, 20) || conversation.id?.slice(0, 20)}...
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Messages header */}
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">
                      {selectedConversation.peerAddress?.slice(0, 6)}...{selectedConversation.peerAddress?.slice(-4)}
                    </h3>
                  </div>

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {isLoading ? (
                      <div className="text-center text-gray-500">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-gray-500">No messages yet</div>
                    ) : (
                      messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.senderAddress === address ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg ${
                              msg.senderAddress === address
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="text-sm">{String(msg.content)}</div>
                            <div className={`text-xs mt-1 ${
                              msg.senderAddress === address ? 'text-purple-200' : 'text-gray-500'
                            }`}>
                              {new Date(msg.sent).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Message input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                    <p className="text-sm">Choose a conversation from the list to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMTPMessaging;
