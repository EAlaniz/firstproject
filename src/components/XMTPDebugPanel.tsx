import React, { useState, useEffect } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { getCanSendStatus } from '../utils/xmtpGroupValidation';
import { clearXMTPIdentityWithClient, createAutoSigner } from '../utils/xmtpSigner';
import { useWalletClient } from 'wagmi';

interface XMTPDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const XMTPDebugPanel: React.FC<XMTPDebugPanelProps> = ({ isOpen, onClose }) => {
  const { 
    client: xmtpClient, 
    isInitialized, 
    selectedConversation, 
    conversations,
    error,
    status,
    forceDiscoverConversations
  } = useXMTP();
  
  const { data: walletClient } = useWalletClient();
  
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<string>('');
  const [signerTestResult, setSignerTestResult] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'debug' | 'advanced'>('debug');

  const runDebugCheck = async () => {
    if (!xmtpClient || !selectedConversation) return;
    
    setIsLoading(true);
    try {
      const canSendStatus = await getCanSendStatus(xmtpClient, selectedConversation);
      
      const info = {
        timestamp: new Date().toISOString(),
        clientInitialized: isInitialized,
        selectedConversation: {
          id: selectedConversation.id,
          type: 'members' in selectedConversation ? 'group' : 'dm',
          hasError: 'error' in selectedConversation,
          membershipIsPublished: 'members' in selectedConversation ? (selectedConversation as unknown as { membershipIsPublished?: boolean }).membershipIsPublished ?? 'Unknown' : 'N/A',
          memberCount: 'members' in selectedConversation ? 'Group conversation' : 'DM conversation'
        },
        canSendStatus,
        totalConversations: conversations.length,
        error,
        status
      };
      
      setDebugInfo(info);
      console.log('🔍 XMTP Debug Info:', info);
    } catch (error) {
      console.error('❌ Debug check failed:', error);
      setDebugInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearIdentity = async () => {
    if (!confirm('⚠️ This will delete all XMTP data and require re-initialization. Continue?')) {
      return;
    }
    
    setClearStatus('Clearing...');
    try {
      // Try the built-in method first, fallback to manual clearing
      await clearXMTPIdentityWithClient();
      setClearStatus('✅ Identity cleared! Refresh the page to re-initialize.');
    } catch {
      setClearStatus('❌ Failed to clear identity');
    }
  };

  const testSigner = async () => {
    if (!walletClient) {
      setSignerTestResult('❌ No wallet client available');
      return;
    }
    
    setSignerTestResult('Testing signer...');
    try {
      const signer = createAutoSigner(walletClient);
      const chainId = Number((signer as unknown as { getChainId: () => bigint | Promise<bigint> }).getChainId());
      const identifier = await (signer as unknown as { getIdentifier: () => Promise<string> }).getIdentifier();
      
      setSignerTestResult(`✅ Signer Test Passed!\nChain ID: ${chainId}\nIdentifier: ${identifier}`);
      console.log('🧪 Signer test successful:', { chainId, identifier });
    } catch (error) {
      setSignerTestResult(`❌ Signer Test Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Signer test failed:', error);
    }
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">XMTP V3 Stability Monitor</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'debug', label: '🐛 Debug', desc: 'Basic diagnostics' },
            { id: 'advanced', label: '⚙️ Advanced', desc: 'Recovery tools' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="flex flex-col items-center">
                <span>{tab.label}</span>
                <span className="text-xs text-gray-500">{tab.desc}</span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 space-y-4">
          {/* Debug Tab */}
          {activeTab === 'debug' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={runDebugCheck}
                  disabled={isLoading || !xmtpClient}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Running...' : 'Run Debug Check'}
                </button>
                
                <button
                  onClick={forceDiscoverConversations}
                  disabled={!xmtpClient}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                  title="Force discover inbound conversations (V3 Enhanced)"
                >
                  🔍 Force Discovery
                </button>
                
                <button
                  onClick={testSigner}
                  disabled={!walletClient}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  title="Test the XMTP signer chain ID"
                >
                  🧪 Test Signer
                </button>
              </div>

              {debugInfo && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Debug Results:</h3>
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Current Status:</h3>
                <div className="space-y-1 text-sm">
                  <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
                  <div>Client: {xmtpClient ? '✅' : '❌'}</div>
                  <div>Selected Conversation: {selectedConversation ? '✅' : '❌'}</div>
                  <div>Total Conversations: {conversations.length}</div>
                  <div>Status: {status}</div>
                  {error && <div className="text-red-600">Error: {error}</div>}
                </div>
              </div>
            </div>
          )}


          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleClearIdentity}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  title="Clear XMTP identity to fix chain ID issues (development only)"
                >
                  🗑️ Clear Identity
                </button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Advanced Recovery Tools</h3>
                <p className="text-yellow-700 text-sm mb-4">
                  These tools are for development and troubleshooting. Use with caution in production.
                </p>
                
                <div className="space-y-2 text-sm">
                  <div><strong>Clear Identity:</strong> Removes all XMTP data and forces re-initialization</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {clearStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              clearStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              clearStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {clearStatus}
            </div>
          )}

          {signerTestResult && activeTab === 'debug' && (
            <div className={`p-3 rounded-lg text-sm whitespace-pre-line ${
              signerTestResult.includes('✅') ? 'bg-green-100 text-green-800' : 
              signerTestResult.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {signerTestResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 