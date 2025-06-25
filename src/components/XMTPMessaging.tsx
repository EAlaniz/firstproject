import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, Signer as XmtpSigner } from '@xmtp/browser-sdk';
import { WalletClient } from 'viem';

// Helper: Convert Viem wallet client to XMTP-compatible signer
const viemToXmtpSigner = (walletClient: WalletClient): XmtpSigner => {
  return {
    getAddress: async () => {
      const [address] = await walletClient.getAddresses();
      return address;
    },
    signMessage: async (message: string | Uint8Array) => {
      const msg = typeof message === 'string' ? new TextEncoder().encode(message) : message;
      return walletClient.signMessage({ message: msg });
    },
  };
};

export default function XmtpMessenger() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!walletClient || !address) return;

    const initXmtp = async () => {
      setStatus('Initializing XMTP...');
      try {
        const signer = viemToXmtpSigner(walletClient);
        const client = await Client.create(signer, { env: 'production' });
        setXmtpClient(client);
        setStatus('XMTP initialized');
      } catch (err: any) {
        console.error('XMTP init failed:', err);
        setStatus(`Failed: ${err.message}`);
      }
    };

    initXmtp();
  }, [walletClient, address]);

  const sendMessage = async () => {
    if (!xmtpClient) return setStatus('XMTP not ready');
    if (!recipient || !message) return setStatus('Recipient and message required');

    try {
      setStatus('Creating conversation...');
      const convo = await xmtpClient.conversations.newConversation(recipient);
      setStatus('Sending...');
      await convo.send(message);
      setStatus('Sent!');
      setMessage('');
    } catch (err: any) {
      console.error('Send failed:', err);
      setStatus(`Send failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>XMTP Messenger</h2>

      <input
        type="text"
        placeholder="Recipient address"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        style={{ width: '100%', marginBottom: 12, padding: 8 }}
      />

      <textarea
        placeholder="Your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        style={{ width: '100%', marginBottom: 12, padding: 8 }}
      />

      <button onClick={sendMessage} style={{ padding: 10, fontSize: 16 }}>
        Send
      </button>

      <p style={{ marginTop: 20 }}>{status}</p>
    </div>
  );
}
