import React, { useEffect, useState } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useWalletClient } from 'wagmi';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  senderAddress: string;
  content: string;
  timestamp: Date;
}

export default function XMTPMessaging({ isOpen, onClose }: XMTPMessagingProps) {
  const { data: walletClient } = useWalletClient();
  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize XMTP when wallet client is available
  useEffect(() => {
    async function initXMTP() {
      if (!walletClient) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log('Initializing XMTP V3 client...');
        
        // Create signer using wallet client (following starter code pattern)
        const signer = {
          getAddress: () => Promise.resolve(walletClient.account.address),
          signMessage: (message: string) => walletClient.signMessage({ message }),
        };

        console.log('Signer created for address:', await signer.getAddress());

        // Initialize client with signer and environment
        const client = await Client.create(signer as any, { env: 'production' });

        console.log('✅ XMTP V3 client created successfully');
        setXmtpClient(client);

        // Start streaming messages
        for await (const convo of await client.conversations.stream()) {
          for await (const msg of await convo.streamMessages()) {
            const newMessage: Message = {
              senderAddress: msg.senderAddress,
              content: msg.content as string,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      } catch (err) {
        console.error('❌ Failed to initialize XMTP V3 client:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
      } finally {
        setIsLoading(false);
      }
    }

    initXMTP();
  }, [walletClient]);

  // Send message function (following starter code pattern)
  const sendMessage = async () => {
    if (!xmtpClient || !recipient.trim() || !message.trim()) return;

    try {
      setIsLoading(true);
      
      // Create or find DM conversation
      const convo = await xmtpClient.conversations.newConversation(recipient);
      
      // Send the message
      await convo.send(message);
      
      // Add message to local state
      const newMessage: Message = {
        senderAddress: walletClient?.account.address || '',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      setMessage('');
      setRecipient('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">XMTP Mini App Messenger</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {!walletClient ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please connect your wallet to use XMTP messaging.</p>
            </div>
          ) : !xmtpClient ? (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Initializing XMTP...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">Setting up XMTP client...</p>
                  {error && (
                    <p className="text-red-600 text-sm">{error}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Message Input */}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Farcaster Address or Wallet"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!recipient.trim() || !message.trim() || isLoading}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isLoading ? 'Sending...' : 'Send via XMTP'}
                </button>
              </div>

              {/* Messages */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Messages</h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No messages yet. Start a conversation!</p>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg ${
                          msg.senderAddress === walletClient?.account.address
                            ? 'bg-blue-100 ml-8'
                            : 'bg-gray-100 mr-8'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {msg.senderAddress === walletClient?.account.address ? 'You' : msg.senderAddress.slice(0, 6) + '...'}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 