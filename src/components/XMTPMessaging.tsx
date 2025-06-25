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
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return array;
}

async function initializeXMTPClient(walletClient: any, chainId: number): Promise<Client> {
  const getXmtpEnv = (chainId?: number): 'production' | 'dev' | null => {
    if (!chainId) return null;
    if (chainId === 1) return 'production';
    if (chainId === 5) return 'dev';
    if (chainId === 8453) return 'production'; // Base
    return null;
  };

  const xmtpEnv = getXmtpEnv(chainId);
  if (!xmtpEnv) throw new Error(`Unsupported chain ID ${chainId}`);

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

  useEffect(() => {
    async function initXMTP() {
      if (!walletClient) return;
      setIsLoading(true);
      try {
        const client = await initializeXMTPClient(walletClient, chainId);
        setXmtpClient(client);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'XMTP init failed');
      } finally {
        setIsLoading(false);
      }
    }
    initXMTP();
  }, [walletClient, chainId]);

  const handleResolve = async () => {
    if (!recipientInput) return;
    setIsLoading(true);
    const isAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientInput);
    let resolved: string | null = null;
    if (isAddress) {
      resolved = recipientInput;
    } else {
      resolved = await resolveFarcasterHandle(recipientInput);
    }
    if (!resolved) setError('Handle resolution failed');
    setRecipientResolved(resolved);
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!xmtpClient || !recipientResolved || !message.trim()) return;
    setIsLoading(true);
    try {
      const conversation = await xmtpClient.conversations.newConversation(recipientResolved);
      if (!conversation) throw new Error('Failed to start conversation');
      await conversation.send(message);
      setMessages((prev) => [...prev, {
        senderAddress: walletClient?.account.address ?? '',
        content: message,
        timestamp: new Date(),
      }]);
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message send failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!xmtpClient) return;
    let cancelled = false;
    const streamMessages = async () => {
      try {
        const stream = await xmtpClient.conversations.streamAllMessages();
        for await (const msg of stream) {
          if (cancelled) break;
          setMessages((prev) => [
            ...prev,
            {
              senderAddress: msg.senderAddress,
              content: typeof msg.content === 'string' ? msg.content : 'Unsupported type',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error('Streaming error:', err);
        setError('Message stream failed');
      }
    };
    streamMessages();
    return () => { cancelled = true; };
  }, [xmtpClient]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') sendMessage();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">XMTP Messenger</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          {!walletClient ? (
            <p className="text-center text-gray-600">Please connect your wallet.</p>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : !xmtpClient ? (
            <p className="text-center">Initializing XMTP...</p>
          ) : (
            <>
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="@farcaster or 0x..."
                className="w-full p-2 border rounded"
              />
              <button onClick={handleResolve} className="bg-blue-600 text-white px-4 py-2 rounded w-full">
                Resolve
              </button>
              {recipientResolved && (
                <p className="text-sm text-gray-600">Resolved: {recipientResolved}</p>
              )}

              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border rounded"
              />
              <button
                onClick={sendMessage}
                disabled={!recipientResolved || !message.trim() || isLoading}
                className="bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {messages.map((msg, i) => (
                  <div key={i} className={`p-2 rounded ${msg.senderAddress === walletClient?.account.address ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <div className="text-xs text-gray-500">
                      {msg.senderAddress === walletClient?.account.address ? 'You' : msg.senderAddress.slice(0, 6) + '...'}
                    </div>
                    <div>{msg.content}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
