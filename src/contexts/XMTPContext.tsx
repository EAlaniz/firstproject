import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';

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
  
  // Stream management
  const globalStreamRef = useRef<any>(null);
  const streamActiveRef = useRef<boolean>(false);

  // WORKING PATTERN: Simple client initialization
  const initializeClient = useCallback(async () => {
    if (!walletClient || !address || isInitializing || isInitialized) {
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP...');

      console.log('[XMTP] 🚀 Starting simple XMTP initialization...');
      
      const signer = createAutoSigner(walletClient);
      const xmtpClient = await Client.create(signer, { env: 'production' });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');
      
      console.log('[XMTP] ✅ XMTP initialized successfully');
      
      // Start simple background sync
      setTimeout(() => loadConversations(), 1000);
      
    } catch (err) {
      console.error('[XMTP] ❌ Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
      setStatus('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address, isInitializing, isInitialized]);

  // ENHANCED PATTERN: V3-optimized conversation discovery with retry logic
  const loadConversations = useCallback(async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      console.log('[XMTP] 🔄 Loading conversations with enhanced V3 pattern...');
      
      // V3 Enhanced Pattern: Multiple sync attempts with progressive delay
      let conversations: any[] = [];
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`[XMTP] 🔄 Sync attempt ${attempts}/${maxAttempts}...`);
        
        try {
          // Enhanced sync pattern for V3
          await client.conversations.sync();
          
          // V3 specific: Try both list methods
          const allConversations = await client.conversations.list();
          const dmConversations = await client.conversations.listDms();
          const groupConversations = await client.conversations.listGroups();
          
          // Combine and deduplicate
          const conversationMap = new Map();
          [...allConversations, ...dmConversations, ...groupConversations].forEach(conv => {
            conversationMap.set(conv.id, conv);
          });
          
          conversations = Array.from(conversationMap.values());
          
          console.log(`[XMTP] 📊 Discovery results - Attempt ${attempts}:`, {
            total: conversations.length,
            dms: dmConversations.length,
            groups: groupConversations.length,
            combined: allConversations.length
          });
          
          // If we found conversations or this is the last attempt, break
          if (conversations.length > 0 || attempts === maxAttempts) {
            break;
          }
          
          // Progressive delay between attempts (1s, 2s, 3s)
          if (attempts < maxAttempts) {
            console.log(`[XMTP] ⏳ Waiting ${attempts}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, attempts * 1000));
          }
          
        } catch (syncError) {
          console.warn(`[XMTP] ⚠️ Sync attempt ${attempts} failed:`, syncError);
          if (attempts === maxAttempts) {
            throw syncError;
          }
        }
      }
      
      console.log(`[XMTP] ✅ Found ${conversations.length} conversations after ${attempts} attempts`);
      
      // Enhanced debug logging for each conversation
      conversations.forEach((conv, index) => {
        const isGroup = 'members' in conv;
        const peerAddress = isGroup ? 'Group' : ('peerAddress' in conv ? conv.peerAddress : 'Unknown');
        const isInbound = !isGroup && peerAddress !== address;
        
        console.log(`[XMTP] 📋 Conversation ${index + 1}:`, {
          id: conv.id,
          type: isGroup ? 'group' : 'dm',
          peerAddress,
          isInbound,
          createdAt: conv.createdAt || 'Unknown',
          lastMessage: conv.lastMessage || 'No messages'
        });
      });
      
      setConversations(conversations as XMTPConversation[]);
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to load conversations after all attempts:', error);
      setError('Failed to discover conversations. This may be due to V3 network delays.');
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

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

  // V3 Enhancement: Manual discovery function for debugging
  const forceDiscoverConversations = useCallback(async () => {
    if (!client) {
      console.warn('[XMTP] Cannot force discovery: client not initialized');
      return;
    }
    
    console.log('[XMTP] 🔍 Force discovering conversations...');
    setError(null);
    await loadConversations();
  }, [client, loadConversations]);

  // ENHANCED PATTERN: V3-optimized message streaming with conversation discovery
  useEffect(() => {
    if (!client || streamActiveRef.current) return;
    
    streamActiveRef.current = true;
    
    const setupStream = async () => {
      try {
        console.log('[XMTP] 🔄 Setting up enhanced V3 message stream...');
        
        globalStreamRef.current = await client.conversations.streamAllMessages();
        
        // Process incoming messages with conversation discovery
        (async () => {
          try {
            for await (const message of globalStreamRef.current) {
              console.log('[XMTP] 📨 New message received:', message);
              
              // V3 Enhancement: Trigger conversation discovery on new message
              // This helps discover inbound conversations that weren't initially found
              const currentConversations = conversations.map(c => c.id);
              if (!currentConversations.includes(message.conversationId)) {
                console.log('[XMTP] 🔍 New conversation detected via message stream, triggering discovery...');
                // Slight delay to allow network propagation
                setTimeout(() => loadConversations(), 1000);
              }
              
              // Add to messages
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
            }
          } catch (streamError) {
            console.warn('[XMTP] Stream error:', streamError);
            // V3 Enhancement: On stream error, try to reconnect and rediscover
            setTimeout(() => {
              console.log('[XMTP] 🔄 Attempting stream recovery and conversation rediscovery...');
              loadConversations();
            }, 5000);
          }
        })();
        
        console.log('[XMTP] ✅ Enhanced V3 message stream active');
        
      } catch (error) {
        console.error('[XMTP] ❌ Failed to setup enhanced stream:', error);
        // V3 Enhancement: Fallback to periodic discovery if streaming fails
        console.log('[XMTP] 🔄 Stream setup failed, relying on periodic sync...');
      }
    };
    
    setupStream();
    
    return () => {
      streamActiveRef.current = false;
      if (globalStreamRef.current) {
        try {
          globalStreamRef.current.return?.();
        } catch (error) {
          console.warn('[XMTP] Error closing stream:', error);
        }
      }
    };
  }, [client, conversations, selectedConversation, loadConversations]);

  // ENHANCED PATTERN: V3-optimized periodic sync with adaptive timing
  useEffect(() => {
    if (!client) return;
    
    let syncInterval: NodeJS.Timeout;
    let intensiveSyncTimeout: NodeJS.Timeout;
    
    // Initial intensive sync for first 2 minutes (V3 network propagation)
    console.log('[XMTP] 🚀 Starting intensive sync period for V3 network propagation...');
    const intensiveSync = () => {
      console.log('[XMTP] 🔄 Intensive periodic sync...');
      loadConversations();
    };
    
    // Intensive sync every 10 seconds for the first 2 minutes
    intensiveSync(); // Immediate first sync
    syncInterval = setInterval(intensiveSync, 10000);
    
    // After 2 minutes, switch to normal sync every 30 seconds
    intensiveSyncTimeout = setTimeout(() => {
      console.log('[XMTP] 🔄 Switching to normal sync interval...');
      clearInterval(syncInterval);
      
      // Normal sync every 30 seconds after intensive period
      syncInterval = setInterval(() => {
        console.log('[XMTP] 🔄 Normal periodic sync...');
        loadConversations();
      }, 30000);
    }, 120000); // 2 minutes
    
    return () => {
      clearInterval(syncInterval);
      clearTimeout(intensiveSyncTimeout);
    };
  }, [client, loadConversations]);

  // Reset state when wallet changes
  useEffect(() => {
    if (address) {
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setIsInitialized(false);
      setClient(null);
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
    <XMTPContext.Provider value={value}>
      {children}
    </XMTPContext.Provider>
  );
};

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (context === undefined) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};