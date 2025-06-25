import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { initXMTP, getClient } from '../xmtpClient';
import { X } from 'lucide-react';

interface XMTPMessagingProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPMessaging: React.FC<XMTPMessagingProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [xmtpClient, setXmtpClient] = useState<any>(null);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isOpen) return;
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
  }, [walletClient, address, isOpen]);

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
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('synced 1 messages, 0 failed 1 succeeded')) {
        setStatus('Message sent! (sync status: 1 succeeded)');
      } else {
        setStatus('Error sending message: ' + msg);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">XMTP Messenger</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0xRecipientAddress"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Send Message
          </button>
          {status && (
            <p className="mt-4 font-bold text-center text-purple-700">{status}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMTPMessaging;
