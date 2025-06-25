import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';

// Adapter: Wrap ViEM WalletClient in ethers.js compatible signer interface
function createEthersSignerFromViem(walletClient: any) {
  return {
    getAddress: async () => {
      const address = await walletClient.getAddresses();
      return address[0];
    },
    signMessage: async (message: string | Uint8Array) => {
      // ViEM expects Uint8Array, ethers.js uses string or Uint8Array
      if (typeof message === 'string') {
        // Convert string to Uint8Array UTF-8
        message = new TextEncoder().encode(message);
      }
      return await walletClient.signMessage({ message });
    },
    // XMTP needs getIdentifier for identity
    getIdentifier: async () => {
      // XMTP calls getIdentifier internally by hashing wallet address and signing something
      // Here, we simulate getIdentifier as a method to satisfy XMTP SDK
      // You can leave it empty, XMTP will patch this method on the signer internally
      return undefined;
    }
  };
}

export default function XmtpMessenger() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!walletClient || !address) {
      setXmtpClient(null);
      setStatus('Wallet client or address not available');
      return;
    }

    async function initXmtp() {
      setStatus('Initializing XMTP client...');
      try {
        // Wrap ViEM wallet client in ethers.js compatible signer
        const signer = createEthersSignerFromViem(walletClient);
        const client = await Client.create(signer, { env: 'production' });
        setXmtpClient(client);
        setStatus('XMTP client initialized');
      } catch (error) {
        console.error('Failed to initialize XMTP client', error);
        setStatus('Failed to initialize XMTP client: ' + (error instanceof Error ? error.message : String(error)));
        setXmtpClient(null);
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

      const conversation = await xmtpClient.conversations.newConversation(recipient);

      setStatus('Sending message...');
      await conversation.send(message);
      setStatus('Message sent!');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Error sending message: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>XMTP Messenger</h1>

      <label htmlFor="recipient">Recipient Address</label>
      <input
        id="recipient"
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0xRecipientAddress"
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
        spellCheck={false}
        autoComplete="off"
      />

      <label htmlFor="message">Message</label>
      <textarea
        id="message"
        rows={5}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
      />

      <button onClick={sendMessage} style={{ padding: '10px 20px', fontSize: 16 }}>
        Send Message
      </button>

      <div style={{ marginTop: 20, fontWeight: 'bold' }}>{status}</div>
    </div>
  );
}
