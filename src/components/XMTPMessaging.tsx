import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, type XmtpClient, type XmtpSigner } from '@xmtp/browser-sdk';
import type { WalletClient } from 'viem';

export default function XMTPMessaging() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<XmtpClient | null>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('Ready');

  // 🛠️ Custom signer factory with proper getIdentifier for XMTP V3
  function createXmtpSigner(walletClient: WalletClient): XmtpSigner {
    return {
      getAddress: async () => {
        const [addr] = await walletClient.getAddresses();
        return addr;
      },
      signMessage: async (msg) => {
        const message = typeof msg === 'string' ? new TextEncoder().encode(msg) : msg;
        return await walletClient.signMessage({ message });
      },
      getIdentifier: async () => {
        const [address] = await walletClient.getAddresses();
        return {
          identifier: address,
          identifierKind: 'Ethereum',
        };
      },
    };
  }

  // 🧠 Initialize XMTP on mount
  useEffect(() => {
    if (!walletClient || !address) return;

    async function initXMTP() {
      setStatus('Initializing XMTP client...');
      try {
        const signer = createXmtpSigner(walletClient);
        const client = await Client.create(signer, {
          env: 'production',
        });
        setXmtpClient(client);
        setStatus('XMTP client initialized');
        console.log('[XMTP] Client initialized:', client);
      } catch (e) {
        console.error('[XMTP] init error:', e);
        setStatus('XMTP init failed: ' + (e instanceof Error ? e.message : String(e)));
      }
    }

    initXMTP();
  }, [walletClient, address]);

  // 📨 Send message function
  async function handleSendMessage() {
    if (!xmtpClient) {
      setStatus('XMTP client not ready');
      return;
    }
    if (!recipient.trim()) {
      setStatus('Enter a recipient address');
      return;
    }
    if (!message.trim()) {
      setStatus('Enter a message');
      return;
    }
  
    try {
      setStatus('Creating conversation...');
      const convo = await xmtpClient.conversations.new(recipient); // ✅ CORRECT METHOD
      await convo.send(message);
      setStatus('Message sent!');
      setMessage('');
    } catch (err) {
      console.error('[XMTP] Error sending message:', err);
      setStatus('Error sending message: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>XMTP Messenger</h2>

      <label>Recipient Wallet Address:</label>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0x..."
        style={{ width: '100%', marginBottom: 12, padding: 8 }}
      />

      <label>Message:</label>
      <textarea
        rows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hello from Farcaster Mini App!"
        style={{ width: '100%', marginBottom: 12, padding: 8 }}
      />

      <button
        onClick={handleSendMessage}
        style={{
          padding: '10px 20px',
          backgroundColor: '#222',
          color: '#fff',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Send
      </button>

      <p style={{ marginTop: 16, fontWeight: 'bold' }}>{status}</p>
    </div>
  );
}
