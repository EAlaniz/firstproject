import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';

export default function XmtpMessenger() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<Client | null>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!walletClient || !address) return;

    const init = async () => {
      try {
        setStatus('Initializing XMTP...');
        const signer = {
          getAddress: async () => address,
          signMessage: async (msg: string) =>
            walletClient.signMessage({ account: address, message: msg }),
        };

        const client = await Client.create(signer, {
          env: 'production',
        });

        setXmtpClient(client);
        setStatus('XMTP client initialized');
        console.log('[XMTP] Client initialized:', client.address);
      } catch (e) {
        console.error('[XMTP] Init failed:', e);
        setStatus('Failed to initialize XMTP');
      }
    };

    init();
  }, [walletClient, address]);

  const handleSendMessage = async () => {
    if (!xmtpClient) return setStatus('XMTP client not ready');
    if (!recipient || !message) return setStatus('Recipient or message missing');

    try {
      setStatus('Sending message...');
      const convo = await xmtpClient.conversations.startConversation(recipient); // ✅ THE ONLY VALID METHOD
      await convo.send(message);
      setStatus('Message sent!');
      setMessage('');
    } catch (e) {
      console.error('[XMTP] Error sending message:', e);
      setStatus('Error sending message: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>XMTP Messenger</h1>

      <label>Recipient address</label>
      <input
        type="text"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="0xRecipientAddress"
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <label>Message</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here"
        rows={4}
        style={{ width: '100%', marginBottom: 10, padding: 8 }}
      />

      <button onClick={handleSendMessage} style={{ padding: '10px 20px' }}>
        Send Message
      </button>

      {status && <p style={{ marginTop: 20, fontWeight: 'bold' }}>{status}</p>}
    </div>
  );
}
