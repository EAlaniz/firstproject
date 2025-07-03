import React, { useState, useEffect } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { getCanSendStatus } from '../utils/xmtpGroupValidation';
import { clearXMTPIdentityWithClient, createAutoSigner } from '../utils/xmtpSigner';
import { useWalletClient } from 'wagmi';
import { memoryManager } from '../utils/xmtpMemoryManager';
import { networkManager, getNetworkQualityReport } from '../utils/networkConnectivity';

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
  const [memoryReport, setMemoryReport] = useState<any>(null);
  const [networkReport, setNetworkReport] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'debug' | 'memory' | 'network' | 'advanced'>('debug');

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

  const runMemoryDiagnostics = async () => {
    try {
      const memoryStats = memoryManager.getCurrentStats();
      const xmtpReport = memoryManager.getXMTPMemoryReport();
      const fullReport = memoryManager.getMemoryReport();
      
      setMemoryReport({
        ...fullReport,
        xmtp: xmtpReport,
        stats: memoryStats,
        timestamp: new Date().toISOString()
      });
      
      console.log('🧠 Memory diagnostics:', { memoryStats, xmtpReport, fullReport });
    } catch (error) {
      console.error('❌ Memory diagnostics failed:', error);
      setMemoryReport({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const runNetworkDiagnostics = async () => {
    try {
      const networkQuality = getNetworkQualityReport();
      const endpointHealth = networkManager.getEndpointHealth();
      const currentStatus = networkManager.getCurrentNetworkStatus();
      
      setNetworkReport({
        quality: networkQuality,
        endpoints: endpointHealth,
        status: currentStatus,
        timestamp: new Date().toISOString()
      });
      
      console.log('🌐 Network diagnostics:', { networkQuality, endpointHealth, currentStatus });
    } catch (error) {
      console.error('❌ Network diagnostics failed:', error);
      setNetworkReport({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const performMemoryCleanup = async () => {
    try {
      await memoryManager.performXMTPCleanup();
      await memoryManager.forceCleanup();
      console.log('🧹 Memory cleanup completed');
      
      // Refresh memory report
      await runMemoryDiagnostics();
    } catch (error) {
      console.error('❌ Memory cleanup failed:', error);
    }
  };

  const enableBorrowMutProtection = () => {
    memoryManager.setBorrowMutCooldown(true);
    setTimeout(() => {
      memoryManager.setBorrowMutCooldown(false);
    }, 10000); // 10 second cooldown
  };

  // Auto-refresh diagnostics
  useEffect(() => {
    if (isOpen && (activeTab === 'memory' || activeTab === 'network')) {
      const interval = setInterval(() => {
        if (activeTab === 'memory') {
          runMemoryDiagnostics();
        } else if (activeTab === 'network') {
          runNetworkDiagnostics();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

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
            { id: 'memory', label: '🧠 Memory', desc: 'WASM & memory' },
            { id: 'network', label: '🌐 Network', desc: 'Connectivity' },
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

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={runMemoryDiagnostics}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  🧠 Memory Scan
                </button>
                
                <button
                  onClick={performMemoryCleanup}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  🧹 Cleanup Memory
                </button>
                
                <button
                  onClick={enableBorrowMutProtection}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                >
                  🛡️ BorrowMut Shield
                </button>
              </div>

              {memoryReport && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Memory Report:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Memory Usage:</strong> {memoryReport.usage?.toFixed(1)}%
                    </div>
                    <div>
                      <strong>Trend:</strong> {memoryReport.trend}
                    </div>
                    <div>
                      <strong>XMTP Memory:</strong> {Math.round((memoryReport.xmtp?.xmtpMemory || 0) / 1024 / 1024)}MB
                    </div>
                    <div>
                      <strong>Stream Buffers:</strong> {memoryReport.xmtp?.streamBuffers || 0}
                    </div>
                    <div>
                      <strong>WASM Instances:</strong> {memoryReport.xmtp?.wasmInstances || 0}
                    </div>
                    <div>
                      <strong>JS Heap:</strong> {Math.round((memoryReport.current?.usedJSHeapSize || 0) / 1024 / 1024)}MB
                    </div>
                  </div>
                  
                  {memoryReport.recommendations?.length > 0 && (
                    <div className="mt-4">
                      <strong>Recommendations:</strong>
                      <ul className="list-disc list-inside text-sm mt-2">
                        {memoryReport.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-yellow-700">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Network Tab */}
          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={runNetworkDiagnostics}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  🌐 Network Scan
                </button>
              </div>

              {networkReport && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Network Report:</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <strong>Suitable for XMTP:</strong> {networkReport.quality?.suitableForXMTP ? '✅' : '❌'}
                    </div>
                    <div>
                      <strong>Connection:</strong> {networkReport.status?.connectionType} ({networkReport.status?.effectiveType})
                    </div>
                    <div>
                      <strong>Online:</strong> {networkReport.status?.isOnline ? '✅' : '❌'}
                    </div>
                    {networkReport.status?.rtt && (
                      <div>
                        <strong>Latency:</strong> {networkReport.status.rtt}ms
                      </div>
                    )}
                    
                    <div>
                      <strong>XMTP Endpoints:</strong>
                      <div className="mt-2 space-y-1">
                        {networkReport.endpoints?.map((endpoint: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                            <span className="truncate">{endpoint.endpoint}</span>
                            <span className={endpoint.healthy ? 'text-green-600' : 'text-red-600'}>
                              {endpoint.healthy ? '✅' : '❌'} {endpoint.latency}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong>Recommendation:</strong> {networkReport.quality?.recommendation}
                    </div>
                  </div>
                </div>
              )}
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
                  <div><strong>BorrowMut Shield:</strong> Activates protection against BorrowMutError for 10 seconds</div>
                  <div><strong>Memory Cleanup:</strong> Forces garbage collection and XMTP-specific cleanup</div>
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