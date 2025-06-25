import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, type Signer as XmtpSigner } from '@xmtp/browser-sdk';
import { WalletClient } from 'viem';

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
    getIdentifier: () => {
      throw new Error(
        'Should be replaced by XMTP client.create before use — this is expected behavior'
      );
    },
  } as any;
}

export default function XmtpMessenger() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [client, setClient] = useState<Client | null>(null);
  const [to, setTo] = useState('');
  const [msg, setMsg] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!walletClient || !address) return;

    (async () => {
      setStatus('Initializing XMTP client...');
      try {
        const signer = createXmtpSigner(walletClient);
        const xm = await Client.create(signer, { env: 'production' });
        setClient(xm);
        setStatus('🌐 XMTP initialized');
      } catch (e: any) {
        console.error('XMTP init error:', e);
        setStatus('Initialization failed: ' + e.message);
      }
    })();
  }, [walletClient, address]);

  const handleSend = async () => {
    if (!client) return setStatus('XMTP client not ready');
    if (!to || !msg) return setStatus('Enter recipient and message');

    try {
      setStatus(`Creating conversation with ${to}...`);
      const convo = await client.conversations.newConversation(to);
      setStatus('✅ Sending...');
      await convo.send(msg);
      setMsg('');
      setStatus('✅ Message sent');
    } catch (e: any) {
      console.error('Send error:', e);
      setStatus('Error sending: ' + e.message);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h1>XMTP Messenger</h1>
      <input
        placeholder="Recipient address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />
      <textarea
        placeholder="Your message"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: 8, marginBottom: 8 }}
      />
      <button onClick={handleSend} style={{ padding: 10 }}>
        ➤ Send
      </button>
      <div style={{ marginTop: 12, fontWeight: 'bold' }}>{status}</div>
    </div>
  );
}
