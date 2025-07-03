import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';
import { XMTPStreamManager } from '../utils/xmtpStreamManager';
import { XMTPDiscoveryManager } from '../utils/xmtpDiscoveryManager';
import { memoryManager } from '../utils/xmtpMemoryManager';
import { XMTPErrorBoundary } from '../components/XMTPErrorBoundary';

export type XMTPConversation = Dm<string> | Group<string>;

export interface XMTPContextType {
  // Core XMTP state
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Conversations and messages
  conversations: XMTPConversation[];
  selectedConversation: XMTPConversation | null;
  messages: { [convId: string]: DecodedMessage<string>[] };
  
  // Core actions
  initializeClient: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (message: string, conversation?: XMTPConversation) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<XMTPConversation | null>;
  
  // Simple state
  status: string;
  isLoading: boolean;
  
  // UI compatibility (simplified)
  loadMoreConversations: () => Promise<void>;
  conversationCursor: string | null;
  conversationPreviews: { [id: string]: string };
  unreadConversations: Set<string>;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  loadMessages: (conversationId: string, append?: boolean) => Promise<void>;
  messageCursors: { [convId: string]: string | null };
  isSyncing: boolean;
  deleteConversation: (conversationId: string) => void;
  deleteConversations: (conversationIds: string[]) => void;
  
  // V3 Enhancement: Manual discovery trigger for debugging
  forceDiscoverConversations: () => Promise<void>;
}

const XMTPContext = createContext<XMTPContextType | undefined>(undefined);

interface XMTPProviderProps {
  children: ReactNode;
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Core state
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const [isLoading, setIsLoading] = useState(false);
  
  // Conversations and messages
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [convId: string]: DecodedMessage<string>[] }>({});
  
  // UI compatibility state (simplified)
  const [conversationPreviews, setConversationPreviews] = useState<{ [id: string]: string }>({});
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [messageCursors, setMessageCursors] = useState<{ [convId: string]: string | null }>({});
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Enhanced V3 managers
  const streamManagerRef = useRef<XMTPStreamManager | null>(null);
  const discoveryManagerRef = useRef<XMTPDiscoveryManager | null>(null);
  const errorRecoveryRef = useRef<number>(0);

  // ENHANCED V3 PATTERN: Robust client initialization with recovery
  const initializeClient = useCallback(async () => {
    if (!walletClient || !address || isInitializing || isInitialized) {
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP V3...');
      errorRecoveryRef.current = 0;

      console.log('[XMTP] 🚀 Starting enhanced XMTP V3 initialization...');
      
      // Start memory monitoring
      memoryManager.startMonitoring();
      
      const signer = createAutoSigner(walletClient);
      const xmtpClient = await Client.create(signer, { env: 'production' });
      
      // Register client with memory manager
      memoryManager.registerXMTPClient(xmtpClient, `client-${Date.now()}`);
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP V3 ready');
      
      console.log('[XMTP] ✅ XMTP V3 initialized successfully');
      
      // Initialize enhanced managers
      await initializeManagers(xmtpClient);
      
      // Start enhanced discovery
      setTimeout(() => loadConversationsV3(), 1000);
      
    } catch (err) {
      console.error('[XMTP] ❌ V3 Initialization failed:', err);
      errorRecoveryRef.current++;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP V3';
      setError(errorMessage);
      setStatus('V3 Initialization failed');
      
      // Enhanced error recovery
      if (errorRecoveryRef.current < 3) {
        console.log(`[XMTP] Scheduling recovery attempt ${errorRecoveryRef.current}/3...`);
        setTimeout(() => {
          setIsInitializing(false);
          initializeClient();
        }, errorRecoveryRef.current * 5000);
        return;
      }
    } finally {
      if (errorRecoveryRef.current >= 3) {
        setIsInitializing(false);
      }
    }
  }, [walletClient, address, isInitializing, isInitialized]);

  // Initialize enhanced managers
  const initializeManagers = useCallback(async (xmtpClient: Client) => {
    try {
      // Initialize discovery manager
      if (!discoveryManagerRef.current) {
        discoveryManagerRef.current = new XMTPDiscoveryManager({
          enableDeepSync: true,
          enableCrossWalletDetection: true,
          enableIdentityBasedDiscovery: true,
          wasmStabilityDelay: 3000
        });
        await discoveryManagerRef.current.initialize(xmtpClient);
      }

      // Initialize stream manager
      if (!streamManagerRef.current) {
        streamManagerRef.current = new XMTPStreamManager({
          borrowMutErrorCooldown: 5000,
          wasmPanicRecoveryDelay: 10000,
          maxConsecutiveErrors: 3
        });
        await streamManagerRef.current.initialize(xmtpClient);
        
        // Set up message handler
        streamManagerRef.current.onMessage((message) => {
          console.log('[XMTP] Enhanced stream message:', message);
          
          // Update messages state
          setMessages(prev => ({
            ...prev,
            [message.conversationId]: [
              ...(prev[message.conversationId] || []),
              message
            ]
          }));
          
          // Update conversation preview
          setConversationPreviews(prev => ({
            ...prev,
            [message.conversationId]: (message.content as string) || 'New message'
          }));
          
          // Mark as unread if not currently selected
          if (!selectedConversation || selectedConversation.id !== message.conversationId) {
            setUnreadConversations(prev => new Set([...prev, message.conversationId]));
          }
          
          // Trigger conversation discovery for new conversations
          const currentConversations = conversations.map(c => c.id);
          if (!currentConversations.includes(message.conversationId)) {
            console.log('[XMTP] New conversation detected, triggering discovery...');
            setTimeout(() => loadConversationsV3(), 1000);
          }
        });
        
        // Set up error handler with enhanced recovery
        streamManagerRef.current.onError((error) => {
          console.error('[XMTP] Enhanced stream error:', error);
          setError(`Stream error: ${error.message}`);
          
          // Enhanced error handling based on error type
          const errorType = (error as any).errorType;
          if (errorType === 'WASM_PANIC') {
            console.log('[XMTP] WASM panic detected, enabling memory protection...');
            memoryManager.setBorrowMutCooldown(true);
            setTimeout(() => memoryManager.setBorrowMutCooldown(false), 15000);
          } else if (errorType === 'BORROW_MUT_ERROR') {
            console.log('[XMTP] BorrowMutError detected, performing cleanup...');
            memoryManager.performXMTPCleanup();
          }
        });
        
        // Start enhanced streaming
        streamManagerRef.current.startStream();
      }
      
      console.log('[XMTP] ✅ Enhanced managers initialized');
    } catch (error) {
      console.error('[XMTP] ❌ Failed to initialize managers:', error);
    }
  }, [selectedConversation, conversations]);

  // ENHANCED V3 PATTERN: Discovery using enhanced discovery manager
  const loadConversationsV3 = useCallback(async () => {
    if (!client || !discoveryManagerRef.current) return;
    
    try {
      setIsLoading(true);
      console.log('[XMTP] 🔄 Loading conversations with enhanced V3 discovery manager...');
      
      // Use enhanced discovery manager
      const discoveryResult = await discoveryManagerRef.current.discoverConversations();
      
      console.log('[XMTP] 📊 Enhanced discovery results:', discoveryResult);
      
      // Get the cached conversations from discovery manager
      const discoveredConversations = discoveryManagerRef.current.getCachedConversations();
      
      // Enhanced debug logging
      discoveredConversations.forEach((conv, index) => {
        const isGroup = 'members' in conv;
        const peerAddress = isGroup ? 'Group' : ('peerAddress' in conv ? conv.peerAddress : 'Unknown');
        const isInbound = !isGroup && peerAddress !== address;
        
        console.log(`[XMTP] 📋 Enhanced Conversation ${index + 1}:`, {
          id: conv.id,
          type: isGroup ? 'group' : 'dm',
          peerAddress,
          isInbound,
          createdAt: conv.createdAt || 'Unknown',
          lastMessage: conv.lastMessage || 'No messages',
          discoveryMethod: discoveryResult.method
        });
      });
      
      setConversations(discoveredConversations as XMTPConversation[]);
      
      // Clear error if discovery was successful
      if (discoveryResult.total > 0) {
        setError(null);
      } else if (discoveryResult.total === 0) {
        console.warn('[XMTP] No conversations discovered - this may indicate network issues or new wallet');
      }
      
    } catch (error) {
      console.error('[XMTP] ❌ Enhanced discovery failed:', error);
      setError('Enhanced discovery failed. Network or WASM stability issues detected.');
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

  // Legacy method for backward compatibility
  const loadConversations = loadConversationsV3;

  // WORKING PATTERN: Simple conversation selection
  const selectConversation = useCallback(async (conversation: XMTPConversation) => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Load messages for this conversation
      const msgs = await conversation.messages();
      setMessages(prev => ({ ...prev, [conversation.id]: msgs }));
      
      // Clear unread status
      setUnreadConversations(prev => {
        const newSet = new Set(prev);
        newSet.delete(conversation.id);
        return newSet;
      });
      
      console.log(`[XMTP] ✅ Selected conversation with ${msgs.length} messages`);
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to select conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // WORKING PATTERN: Simple message sending
  const sendMessage = useCallback(async (message: string, targetConversation?: XMTPConversation) => {
    const conversation = targetConversation || selectedConversation;
    if (!conversation || !client) return;
    
    try {
      console.log('[XMTP] 📤 Sending message...');
      
      const sentMessage = await conversation.send(message);
      
      // Add to local messages
      setMessages(prev => ({
        ...prev,
        [conversation.id]: [...(prev[conversation.id] || []), sentMessage as DecodedMessage<string>]
      }));
      
      console.log('[XMTP] ✅ Message sent successfully');
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to send message:', error);
      setError('Failed to send message');
    }
  }, [selectedConversation, client]);

  // PROVEN WORKING PATTERN: Standard XMTP conversation creation
  const createConversation = useCallback(async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) return null;
    
    try {
      console.log(`[XMTP] 🔄 Creating conversation with ${recipientAddress}...`);
      
      // Standard XMTP canMessage check
      const canMessage = await Client.canMessage([
        { identifier: recipientAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      if (!canMessage || (Array.isArray(canMessage) && !canMessage[0])) {
        setError('Recipient is not registered on XMTP');
        return null;
      }
      
      // Standard XMTP conversation creation
      const conversation = await client.conversations.newDm(recipientAddress);
      
      console.log('[XMTP] ✅ Conversation created successfully');
      
      // Reload conversations to pick up the new one
      await loadConversations();
      
      // Auto-select the new conversation
      setTimeout(() => {
        selectConversation(conversation as XMTPConversation);
      }, 500);
      
      return conversation as XMTPConversation;
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to create conversation:', error);
      setError('Failed to create conversation');
      return null;
    }
  }, [client, loadConversations]);

  // UI compatibility methods (simplified)
  const loadMoreConversations = useCallback(async () => {
    // Simple: just reload conversations
    await loadConversations();
  }, [loadConversations]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    // Simple: reload messages for conversation
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      const msgs = await conversation.messages();
      setMessages(prev => ({ ...prev, [conversationId]: msgs }));
    }
  }, [conversations]);

  const loadMessages = useCallback(async (conversationId: string, _append = false) => {
    // Simple: same as loadMoreMessages (append parameter ignored for simplicity)
    await loadMoreMessages(conversationId);
  }, [loadMoreMessages]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
    }
  }, [selectedConversation]);

  const deleteConversations = useCallback((conversationIds: string[]) => {
    setConversations(prev => prev.filter(c => !conversationIds.includes(c.id)));
    if (selectedConversation && conversationIds.includes(selectedConversation.id)) {
      setSelectedConversation(null);
    }
  }, [selectedConversation]);

  // V3 Enhancement: Enhanced manual discovery function for debugging
  const forceDiscoverConversations = useCallback(async () => {
    if (!client || !discoveryManagerRef.current) {
      console.warn('[XMTP] Cannot force discovery: client or discovery manager not initialized');
      return;
    }
    
    console.log('[XMTP] 🔍 Force discovering conversations with enhanced V3 patterns...');
    setError(null);
    
    try {
      // Force fresh discovery with all patterns
      await discoveryManagerRef.current.discoverConversations(true);
      await loadConversationsV3();
      console.log('[XMTP] ✅ Force discovery completed');
    } catch (error) {
      console.error('[XMTP] ❌ Force discovery failed:', error);
      setError('Force discovery failed - check debug panel for details');
    }
  }, [client, loadConversationsV3]);

  // Enhanced streaming is now handled by the XMTPStreamManager
  // No additional effects needed here as the manager handles everything

  // Enhanced periodic sync - lighter since discovery manager handles heavy lifting
  useEffect(() => {
    if (!client || !discoveryManagerRef.current) return;
    
    let syncInterval: NodeJS.Timeout;
    
    // Lighter periodic sync every 60 seconds
    // The discovery manager and stream manager handle most real-time updates
    syncInterval = setInterval(() => {
      console.log('[XMTP] 🔄 Periodic enhanced sync...');
      loadConversationsV3();
    }, 60000);
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [client, loadConversationsV3]);

  // Reset state when wallet changes with enhanced cleanup
  useEffect(() => {
    if (address) {
      // Enhanced cleanup for V3 managers
      if (streamManagerRef.current) {
        streamManagerRef.current.destroy();
        streamManagerRef.current = null;
      }
      
      if (discoveryManagerRef.current) {
        discoveryManagerRef.current.destroy();
        discoveryManagerRef.current = null;
      }
      
      // Stop memory monitoring
      memoryManager.stopMonitoring();
      
      // Reset state
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setIsInitialized(false);
      setClient(null);
      setError(null);
      errorRecoveryRef.current = 0;
      
      console.log('[XMTP] ✅ Enhanced cleanup completed for wallet change');
    }
  }, [address]);

  const value: XMTPContextType = {
    // Core state
    client,
    isInitialized,
    isInitializing,
    error,
    status,
    isLoading,
    
    // Data
    conversations,
    selectedConversation,
    messages,
    
    // Actions
    initializeClient,
    selectConversation,
    sendMessage,
    createConversation,
    
    // UI compatibility
    loadMoreConversations,
    conversationCursor: null, // Simplified: no pagination
    conversationPreviews,
    unreadConversations,
    loadMoreMessages,
    loadMessages,
    messageCursors,
    isSyncing,
    deleteConversation,
    deleteConversations,
    
    // V3 Enhancement
    forceDiscoverConversations,
  };

  return (
    <XMTPErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[XMTP] Error boundary caught error:', error, errorInfo);
        setError(`XMTP Error: ${error.message}`);
        
        // Enhanced error recovery
        if (error.message.includes('WASM') || error.message.includes('BorrowMut')) {
          console.log('[XMTP] WASM/BorrowMut error detected, triggering memory protection...');
          memoryManager.setBorrowMutCooldown(true);
          setTimeout(() => memoryManager.setBorrowMutCooldown(false), 15000);
        }
      }}
      maxRetries={3}
    >
      <XMTPContext.Provider value={value}>
        {children}
      </XMTPContext.Provider>
    </XMTPErrorBoundary>
  );
};

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (context === undefined) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};