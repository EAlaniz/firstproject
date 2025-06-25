import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { initXMTP, getClient } from '../xmtpClient';
import { useXMTP } from '../contexts/XMTPContext';
import { Conversation, DecodedMessage } from '@xmtp/browser-sdk';
import { X, MessageCircle, Send, Users, Plus } from 'lucide-react';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Context-based XMTP (for advanced features)
  const xmtpContext = useXMTP();
  
  // Direct client approach (for current working functionality)
  const [xmtpClient, setXmtpClient] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  
  // Enhanced UI state
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  // Initialize direct client (preserves current working functionality)
  useEffect(() => {
    if (!isOpen) return;
    if (!walletClient || !address) return;

    const init = async () => {
      try {
        setStatus('Initializing XMTP...');
        const client = await initXMTP(walletClient);
        setXmtpClient(client);
        setStatus('XMTP client initialized');
      } catch (e) {
        console.error('[XMTP] Init failed:', e);
        setStatus('Failed to initialize XMTP');
      }
    };

    init();
  }, [walletClient, address, isOpen]);

  // Initialize context client when wallet is available
  useEffect(() => {
    if (walletClient && address && !xmtpContext.client && !xmtpContext.isInitializing) {
      const initContext = async () => {
        try {
          const { ethers } = await import('ethers');
          const provider = new ethers.BrowserProvider(walletClient);
          const signer = await provider.getSigner();
          await xmtpContext.initializeClient(signer);
        } catch (error) {
          console.error('Failed to initialize XMTP context:', error);
        }
      };
      initContext();
    }
  }, [walletClient, address, xmtpContext]);

  // Load conversations when context client is ready
  useEffect(() => {
    if (xmtpContext.client && xmtpContext.conversations.length === 0) {
      xmtpContext.loadConversations();
    }
  }, [xmtpContext.client, xmtpContext.conversations.length]);

  // Handle simple message sending (current working approach)
  const handleSendMessage = async () => {
    const client = xmtpClient || getClient();
    if (!client) return setStatus('XMTP client not ready');
    if (!recipient || !message) return setStatus('Recipient or message missing');

    // Validate recipient address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      setStatus('Invalid Ethereum address. Please enter a valid 0x... address.');
      return;
    }

    try {
      setStatus('Sending message...');
      let convo;
      if (typeof (client.conversations as any).newDm === 'function') {
        convo = await (client.conversations as any).newDm(recipient);
      } else if (typeof (client.conversations as any).newDmWithIdentifier === 'function') {
        convo = await (client.conversations as any).newDmWithIdentifier({
          kind: 'ETHEREUM',
          identifier: recipient,
        });
      } else {
        throw new Error('No valid method found to create DM conversation on XMTP client');
      }
      await convo.send(message);
      setStatus('Message sent!');
      setMessage('');
      setRecipient('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('synced 1 messages, 0 failed 1 succeeded')) {
        setStatus('Message sent! (sync status: 1 succeeded)');
      } else {
        setStatus('Error sending message: ' + msg);
      }
    }
  };

  // Handle advanced message sending (context approach)
  const handleAdvancedSendMessage = async () => {
    if (!message.trim()) return;
    
    try {
      if (selectedConversation) {
        await xmtpContext.sendMessage(selectedConversation, message);
        setMessage('');
      } else if (recipient) {
        const conversation = await xmtpContext.createConversation(recipient);
        if (conversation) {
          await xmtpContext.sendMessage(conversation, message);
          setMessage('');
          setRecipient('');
          setSelectedConversation(conversation);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await xmtpContext.loadMessages(conversation);
    xmtpContext.subscribeToMessages(conversation);
  };

  // Simple view (current working functionality)
  const renderSimpleView = () => (
    <div className="p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Recipient address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0xRecipientAddress"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here"
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <button
        onClick={handleSendMessage}
        className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
      >
        Send Message
      </button>
      {status && (
        <p className="mt-4 font-bold text-center text-purple-700">{status}</p>
      )}
    </div>
  );

  // Advanced view (new features)
  const renderAdvancedView = () => (
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
            {showNewMessage && (
              <div className="mb-3">
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0xRecipientAddress"
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={() => setShowNewMessage(false)}
                  className="text-xs text-gray-500 mt-1"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {xmtpContext.conversations.map((convo, index) => (
              <div
                key={convo.id || index}
                onClick={() => handleSelectConversation(convo)}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedConversation?.id === convo.id ? 'bg-purple-50 border-r-2 border-purple-500' : ''
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {convo.peerAddress?.slice(0, 6)}...{convo.peerAddress?.slice(-4)}
                </div>
                <div className="text-xs text-gray-500">Click to view messages</div>
              </div>
            ))}
            {xmtpContext.conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {xmtpContext.messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`p-2 rounded-lg max-w-xs ${
                      msg.senderAddress === address
                        ? 'bg-purple-100 ml-auto'
                        : 'bg-gray-100'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {msg.senderAddress?.slice(0, 6)}...{msg.senderAddress?.slice(-4)}
                    </div>
                    <div className="text-sm">{String(msg.content)}</div>
                  </div>
                ))}
                {xmtpContext.messages.length === 0 && (
                  <div className="text-center text-gray-500 text-sm">
                    No messages yet
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdvancedSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleAdvancedSendMessage}
                    disabled={!message.trim()}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
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
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">XMTP Messenger</h2>
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('simple')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'simple'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Simple
              </button>
              <button
                onClick={() => setViewMode('advanced')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  viewMode === 'advanced'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Advanced
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {viewMode === 'simple' ? renderSimpleView() : renderAdvancedView()}
      </div>
    </div>
  );
};

export default XMTPMessaging;
