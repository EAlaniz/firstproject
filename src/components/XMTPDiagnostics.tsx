import React, { useEffect, useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client } from '@xmtp/browser-sdk';
import { initXMTP, getClient } from '../xmtpClient';

interface XMTPDiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const XMTPDiagnostics: React.FC<XMTPDiagnosticsProps> = ({ isOpen, onClose }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [diagnostics, setDiagnostics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testMessage, setTestMessage] = useState('Hello from diagnostics!');
  const [testResults, setTestResults] = useState<any>({});

  const runDiagnostics = async () => {
    if (!address || !walletClient) return;
    
    setIsLoading(true);
    const results: any = {};

    try {
      // 1. Check if user can message (is registered) on production
      console.log('Checking XMTP registration for:', address);
      const canMessage = await Client.canMessage([{
        identifier: address,
        identifierKind: 'Ethereum'
      }], 'production');
      results.canMessage = canMessage;
      console.log('Can message result (production):', canMessage);

      // 2. Check if user can message on dev environment
      const canMessageDev = await Client.canMessage([{
        identifier: address,
        identifierKind: 'Ethereum'
      }], 'dev');
      results.canMessageDev = canMessageDev;
      console.log('Can message result (dev):', canMessageDev);

      // 3. Try to initialize client on production
      if (canMessage) {
        try {
          const client = await initXMTP(walletClient);
          results.clientInitialized = !!client;
          results.clientAddress = (client as any)?.address;
          
          // 4. Check conversations
          if (client) {
            const conversations = await client.conversations.list();
            results.conversationsCount = conversations.length;
            results.conversations = conversations.map((conv: any) => ({
              peerAddress: conv.peerAddress,
              topic: conv.topic,
              id: conv.id
            }));
          }
        } catch (error) {
          results.clientError = error instanceof Error ? error.message : String(error);
        }
      }

      // 5. Check environment variables and configuration
      results.envVars = {
        XMTP_ENV: import.meta.env.VITE_XMTP_ENV || 'production',
        NODE_ENV: import.meta.env.NODE_ENV,
        BASE_RPC_URL: import.meta.env.VITE_BASE_RPC_URL,
        IS_PRODUCTION: import.meta.env.NODE_ENV === 'production'
      };

      // 6. Check platform/environment detection
      results.platform = {
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isFarcaster: window.location.href.includes('warpcast') || window.location.href.includes('farcaster'),
        isMiniApp: window.location.href.includes('mini-app') || window.location.href.includes('farcaster'),
        protocol: window.location.protocol,
        hostname: window.location.hostname
      };

    } catch (error) {
      results.error = error instanceof Error ? error.message : String(error);
    }

    setDiagnostics(results);
    setIsLoading(false);
  };

  const testCrossPlatformMessaging = async () => {
    if (!testRecipient || !testMessage || !address) {
      setTestResults({ error: 'Please enter a recipient address and message' });
      return;
    }

    setTestResults({ loading: true });

    try {
      const client = getClient();
      if (!client) {
        setTestResults({ error: 'XMTP client not initialized' });
        return;
      }

      // Test message sending
      let conversation;
      if (typeof (client.conversations as any).newDm === 'function') {
        conversation = await (client.conversations as any).newDm(testRecipient);
      } else if (typeof (client.conversations as any).newDmWithIdentifier === 'function') {
        conversation = await (client.conversations as any).newDmWithIdentifier({
          kind: 'ETHEREUM',
          identifier: testRecipient,
        });
      } else {
        throw new Error('No valid method found to create DM conversation');
      }

      await conversation.send(testMessage);
      
      setTestResults({ 
        success: true, 
        message: 'Test message sent successfully!',
        conversation: {
          peerAddress: (conversation as any).peerAddress,
          topic: (conversation as any).topic
        }
      });

    } catch (error) {
      setTestResults({ 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };

  const checkRecipientRegistration = async () => {
    if (!testRecipient) {
      setTestResults({ error: 'Please enter a recipient address' });
      return;
    }

    setTestResults({ loading: true });

    try {
      const canMessage = await Client.canMessage([{
        identifier: testRecipient,
        identifierKind: 'Ethereum'
      }], 'production');
      setTestResults({ 
        recipientCheck: {
          address: testRecipient,
          canMessage,
          status: canMessage ? 'Registered on XMTP Production' : 'Not registered on XMTP Production'
        }
      });
    } catch (error) {
      setTestResults({ 
        error: `Error checking recipient: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  useEffect(() => {
    if (isOpen && address) {
      runDiagnostics();
    }
  }, [isOpen, address]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">XMTP Cross-Platform Diagnostics</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Running diagnostics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Wallet Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current Wallet</h3>
                <p className="text-sm font-mono">{address}</p>
              </div>

              {/* XMTP Registration Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">XMTP Registration Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Production Environment:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      diagnostics.canMessage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {diagnostics.canMessage ? '✅ Registered' : '❌ Not Registered'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">Development Environment:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      diagnostics.canMessageDev ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {diagnostics.canMessageDev ? '✅ Registered' : '❌ Not Registered'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Platform Detection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Platform Detection</h3>
                <div className="space-y-1 text-sm">
                  <div>Environment: {diagnostics.platform?.isMobile ? 'Mobile' : 'Desktop'}</div>
                  <div>Farcaster Mini App: {diagnostics.platform?.isFarcaster ? 'Yes' : 'No'}</div>
                  <div>Protocol: {diagnostics.platform?.protocol}</div>
                  <div>Hostname: {diagnostics.platform?.hostname}</div>
                </div>
              </div>

              {/* Client Status */}
              {diagnostics.clientInitialized && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Client Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Client Address:</span>
                      <span className="text-sm font-mono">{diagnostics.clientAddress}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Conversations:</span>
                      <span className="text-sm">{diagnostics.conversationsCount || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Environment Configuration */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Environment Configuration</h3>
                <div className="space-y-1 text-sm">
                  <div>XMTP_ENV: <span className="font-mono">{diagnostics.envVars?.XMTP_ENV}</span></div>
                  <div>NODE_ENV: <span className="font-mono">{diagnostics.envVars?.NODE_ENV}</span></div>
                  <div>BASE_RPC_URL: <span className="font-mono">{diagnostics.envVars?.BASE_RPC_URL}</span></div>
                  <div>IS_PRODUCTION: <span className="font-mono">{diagnostics.envVars?.IS_PRODUCTION ? 'true' : 'false'}</span></div>
                </div>
              </div>

              {/* Cross-Platform Testing */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Cross-Platform Testing</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Test Recipient Address</label>
                    <input
                      type="text"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      placeholder="0xRecipientAddress"
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">Test Message</label>
                    <input
                      type="text"
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      placeholder="Test message content"
                      className="w-full border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={checkRecipientRegistration}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Check Recipient
                    </button>
                    <button
                      onClick={testCrossPlatformMessaging}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors"
                    >
                      Send Test Message
                    </button>
                  </div>
                  
                  {/* Test Results */}
                  {testResults.loading && (
                    <div className="text-center py-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-xs text-blue-600 mt-1">Testing...</p>
                    </div>
                  )}
                  
                  {testResults.error && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-sm text-red-700">{testResults.error}</p>
                    </div>
                  )}
                  
                  {testResults.success && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-green-700">{testResults.message}</p>
                      {testResults.conversation && (
                        <div className="mt-2 text-xs text-green-600">
                          <div>Peer: {testResults.conversation.peerAddress}</div>
                          <div>Topic: {testResults.conversation.topic?.slice(0, 20)}...</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {testResults.recipientCheck && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {testResults.recipientCheck.address}: {testResults.recipientCheck.status}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Troubleshooting Guide */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Cross-Platform Troubleshooting</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Production Environment:</strong> All platforms must use XMTP production environment</li>
                  <li>• <strong>Registration:</strong> Both sender and recipient must be registered on XMTP</li>
                  <li>• <strong>Coinbase Wallet Mobile:</strong> Enable XMTP in Settings → Developer Settings</li>
                  <li>• <strong>Farcaster Mini App:</strong> Ensure XMTP is enabled in the mini app environment</li>
                  <li>• <strong>Address Format:</strong> Use exact same address format (lowercase recommended)</li>
                  <li>• <strong>Network:</strong> Ensure both wallets are on Base mainnet</li>
                  <li>• <strong>First Message:</strong> Try sending from mobile to desktop first</li>
                </ul>
              </div>

              {diagnostics.error && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">Error</h3>
                  <p className="text-sm text-red-700">{diagnostics.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMTPDiagnostics; 