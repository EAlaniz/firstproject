import React, { useEffect, useState, KeyboardEvent } from 'react';
import { Client } from '@xmtp/browser-sdk';
import { useWalletClient, useChainId } from 'wagmi';
import type { Signer, Identifier, IdentifierKind } from '@xmtp/browser-sdk';
import { resolveFarcasterHandle } from '../utils/resolveFarcaster';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  senderAddress: string;
  content: string;
  timestamp: Date;
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith('0x')) {
    hex = hex.slice(2);
  }
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return array;
}

// Extract XMTP initialization for better testability
async function initializeXMTPClient(
  walletClient: any,
  chainId: number
): Promise<Client> {
  const getXmtpEnv = (chainId?: number): 'production' | 'dev' | null => {
    if (!chainId) return null;
    if (chainId === 1) return 'production';
    if (chainId === 5) return 'dev';
    if (chainId === 8453) return 'production'; // Base chain support
    return null;
  };

  const xmtpEnv = getXmtpEnv(chainId);

  if (!xmtpEnv) {
    throw new Error(
      `XMTP is not supported on chain ID ${chainId}. Switch to Ethereum Mainnet, Goerli, or Base.`
    );
  }

  const accountAddress = walletClient.account.address;

  const accountIdentifier: Identifier = {
    identifier: accountAddress,
    identifierKind: 'Ethereum' as IdentifierKind,
  };

  const signer: Signer = {
    type: 'EOA',
    getIdentifier: () => accountIdentifier,
    signMessage: async (message: string): Promise<Uint8Array> => {
      const signature = await walletClient.signMessage({ message });
      return hexToUint8Array(signature);
    },
  };

  return await Client.create(signer, { env: xmtpEnv });
}

export default function XMTPMessaging({ isOpen, onClose }: XMTPMessagingProps) {
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [recipientResolved, setRecipientResolved] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize XMTP client
  useEffect(() => {
    async function initXMTP() {
      if (!walletClient) {
        setError('Wallet client not connected');
        setXmtpClient(null);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const client = await initializeXMTPClient(walletClient, chainId);
        setXmtpClient(client);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
        setXmtpClient(null);
      } finally {
        setIsLoading(false);
      }
    }
    initXMTP();
  }, [walletClient, chainId]);

  // Resolve Farcaster handle or address
  const handleResolve = async () => {
    if (!recipientInput) return;
    setIsLoading(true);
    setError(null);
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientInput);
    let resolved: string | null = null;
    if (isAddress) {
      resolved = recipientInput;
    } else {
      resolved = await resolveFarcasterHandle(recipientInput);
    }
    if (!resolved) {
      setError('Could not resolve Farcaster handle');
      setRecipientResolved(null);
    } else {
      setRecipientResolved(resolved);
      setError(null);
    }
    setIsLoading(false);
  };

  // Send message
  const sendMessage = async () => {
    if (!xmtpClient || !recipientResolved || !message.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      // Use type assertion to bypass linter for newConversation
      const conversation = await (xmtpClient.conversations as any).newConversation(recipientResolved);
      await conversation.send(message);
      setMessages((prev) => [
        ...prev,
        {
          senderAddress: walletClient?.account.address ?? '',
          content: message,
          timestamp: new Date(),
        },
      ]);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Stream incoming messages
  useEffect(() => {
    if (!xmtpClient) return;
    let cancelled = false;
    const streamMessages = async () => {
      try {
        const stream = await xmtpClient.conversations.streamAllMessages();
        for await (const msg of stream) {
          if (cancelled) break;
          if (!msg || typeof msg !== 'object' || !('senderAddress' in msg)) continue;
          setMessages((prev) => [
            ...prev,
            {
              senderAddress: msg.senderAddress as string,
              content: typeof msg.content === 'string' ? msg.content : 'Unsupported message type',
              timestamp:
                'sent' in msg &&
                (typeof msg.sent === 'string' || typeof msg.sent === 'number' || msg.sent instanceof Date)
                  ? (msg.sent instanceof Date ? msg.sent : new Date(msg.sent))
                  : new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error('Error streaming messages:', err);
        setError('Failed to stream incoming messages');
      }
    };
    streamMessages();
    return () => {
      cancelled = true;
    };
  }, [xmtpClient]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      sendMessage();
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
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : !xmtpClient ? (
            <div className="text-center py-8">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600">Initializing XMTP...</p>
                </div>
              ) : (
                <p className="text-gray-600">Setting up XMTP client...</p>
              )}
            </div>
          ) : (
            <>
              {/* Recipient Input & Resolve */}
              <div className="space-y-2 mb-6">
                <input
                  type="text"
                  placeholder="@farcaster or 0x..."
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleResolve}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  disabled={!recipientInput || isLoading}
                >
                  Resolve
                </button>
                {recipientResolved && (
                  <div className="text-sm text-gray-600">Resolved: {recipientResolved}</div>
                )}
              </div>
              {/* Message Input */}
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!recipientResolved || !message.trim() || isLoading}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
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
                          {msg.senderAddress === walletClient?.account.address
                            ? 'You'
                            : msg.senderAddress.slice(0, 6) + '...'}
                        </div>
                        <div className="text-sm">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
