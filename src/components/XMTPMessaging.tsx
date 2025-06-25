import React, { useEffect, useState } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { createWalletClient, custom } from 'viem';
import { base } from 'viem/chains';
import { useAccount } from 'wagmi';

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
  const [xmtp, setXmtp] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState('');
  const [text, setText] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  // Create signer function
  const createSigner = async () => {
    const walletClient = createWalletClient({
      chain: base,
      transport: custom(window.ethereum),
    });

    const [walletAddress] = await walletClient.getAddresses();

    return {
      getAddress: () => Promise.resolve(walletAddress),
      signMessage: (message: string) =>
        walletClient.signMessage({ account: walletAddress, message }),
    };
  };

  // Initialize XMTP
  const initXMTP = async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Initializing XMTP V3 client...');
      
      const signer = await createSigner();
      console.log('Signer created for address:', await signer.getAddress());

      // Initialize client with signer and environment
      const xmtpClient = await Client.create(signer as any, { env: 'production' });

      console.log('✅ XMTP V3 client created successfully');
      setXmtp(xmtpClient);

      // Start streaming messages
      startMessageStream(xmtpClient);
    } catch (err) {
      console.error('❌ Failed to initialize XMTP V3 client:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
    } finally {
      setIsLoading(false);
    }
  };

  // Start message stream
  const startMessageStream = async (client: Client) => {
    try {
      console.log('Starting message stream...');
      
      // Stream conversations and messages
      for await (const conv of await client.conversations.stream()) {
        console.log('New conversation:', conv.id);
        
        for await (const msg of await conv.streamMessages()) {
          const newMessage: Message = {
            senderAddress: msg.senderAddress,
            content: msg.content as string,
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, newMessage]);
        }
      }
    } catch (error) {
      console.error('❌ Error in message stream:', error);
    }
  };

  // Start conversation and send message
  const startConvAndSend = async () => {
    if (!xmtp || !recipient.trim() || !text.trim()) return;

    try {
      setIsLoading(true);
      
      // Create or find DM conversation
      const conv = await (xmtp.conversations as any).newConversation(recipient);
      setConversation(conv);
      
      // Send the message
      await conv.send(text);
      
      // Add message to local state
      const newMessage: Message = {
        senderAddress: address || '',
        content: text,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
      
      setText('');
      setRecipient('');
    } catch (err) {
      console.error('❌ Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (isConnected && address && !xmtp && !isLoading) {
      initXMTP();
    }
  }, [isConnected, address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">XMTP Messaging</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please connect your wallet to use XMTP messaging.</p>
            </div>
          ) : !xmtp ? (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Initializing XMTP...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={initXMTP}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Initialize XMTP
                  </button>
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
                  placeholder="Recipient Address (0x...)"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Your message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && startConvAndSend()}
                  />
                  <button
                    onClick={startConvAndSend}
                    disabled={!recipient.trim() || !text.trim() || isLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </button>
                </div>
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
                          msg.senderAddress === address
                            ? 'bg-blue-100 ml-8'
                            : 'bg-gray-100 mr-8'
                        }`}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {msg.senderAddress === address ? 'You' : msg.senderAddress.slice(0, 6) + '...'}
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