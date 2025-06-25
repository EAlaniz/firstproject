import React, { useEffect, useState } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { Client, type Signer, type Identifier, type IdentifierKind } from '@xmtp/browser-sdk';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    array[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return array;
}

export default function XMTPMessaging({ isOpen, onClose }: XMTPMessagingProps) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!walletClient || !address) return;
    async function initXmtp() {
      setStatus('Initializing XMTP client...');
      try {
        if (!walletClient) throw new Error('Wallet client not available');
        // Create a custom signer compatible with XMTP
        const accountIdentifier: Identifier = {
          identifier: walletClient.account.address,
          identifierKind: 'Ethereum' as IdentifierKind,
        };
        const signer: Signer = {
          type: 'EOA',
          signMessage: async (msg: string) => {
            if (!walletClient) throw new Error('Wallet client not available');
            const sig = await walletClient.signMessage({ message: msg });
            return hexToUint8Array(sig);
          },
          getIdentifier: () => accountIdentifier,
        };
        const client = await Client.create(signer, { env: 'production' });
        setXmtpClient(client);
        setStatus('XMTP client initialized');
      } catch (error) {
        console.error('Failed to initialize XMTP client', error);
        setStatus('Failed to initialize XMTP client');
      }
    }
    initXmtp();
  }, [walletClient, address]);

  async function sendMessage() {
    if (!xmtpClient) {
      setStatus('XMTP client not ready');
      return;
    }
    if (!recipient.trim()) {
      setStatus('Please enter recipient address');
      return;
    }
    if (!message.trim()) {
      setStatus('Please enter a message');
      return;
    }
    try {
      setStatus(`Creating conversation with ${recipient}...`);
      // Correct method for XMTP SDK v3.2.1 (type assertion for newConversation)
      const conversation = await (xmtpClient.conversations as any).newConversation(recipient);
      setStatus('Sending message...');
      await conversation.send(message);
      setStatus('Message sent!');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Failed to send message');
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">XMTP Messenger</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient address"
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-2 border rounded"
          />
          <button
            onClick={sendMessage}
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
          >
            Send
          </button>
          <div className="text-sm text-gray-600">{status}</div>
        </div>
      </div>
    </div>
  );
}
