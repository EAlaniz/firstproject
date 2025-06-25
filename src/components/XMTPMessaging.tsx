import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { initXMTP, getClient } from '../xmtpClient';

export default function XmtpMessenger() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
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
  }, [walletClient, address]);

  const handleSendMessage = async () => {
    const client = xmtpClient || getClient();
    if (!client) return setStatus('XMTP client not ready');
    if (!recipient || !message) return setStatus('Recipient or message missing');

    // Validate recipient address before attempting to create DM
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
