import React, { useState } from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import { getCanSendStatus } from '../utils/xmtpGroupValidation';
import { clearXMTPIdentity } from '../utils/xmtpSigner';

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
    status 
  } = useXMTP();
  
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clearStatus, setClearStatus] = useState<string>('');

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
          membershipIsPublished: 'members' in selectedConversation ? (selectedConversation as any).membershipIsPublished : 'N/A',
          memberCount: 'members' in selectedConversation ? 
            (Array.isArray((selectedConversation as any).members) ? 
              (selectedConversation as any).members.length : 
              Object.keys((selectedConversation as any).members || {}).length) : 'N/A'
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
      await clearXMTPIdentity();
      setClearStatus('✅ Identity cleared! Refresh the page to re-initialize.');
    } catch (error) {
      setClearStatus('❌ Failed to clear identity');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">XMTP Debug Panel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={runDebugCheck}
              disabled={isLoading || !xmtpClient}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Running...' : 'Run Debug Check'}
            </button>
            
            <button
              onClick={handleClearIdentity}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              title="Clear XMTP identity to fix chain ID issues (development only)"
            >
              🗑️ Clear Identity
            </button>
          </div>

          {clearStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              clearStatus.includes('✅') ? 'bg-green-100 text-green-800' : 
              clearStatus.includes('❌') ? 'bg-red-100 text-red-800' : 
              'bg-yellow-100 text-yellow-800'
            }`}>
              {clearStatus}
            </div>
          )}

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
      </div>
    </div>
  );
}; 