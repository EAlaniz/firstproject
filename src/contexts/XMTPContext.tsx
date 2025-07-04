import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';
import { XMTPStreamManager } from '../utils/xmtpStreamManager';
import { XMTPDiscoveryManager } from '../utils/xmtpDiscoveryManager';
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
  
  // V3 Enhancement: Manual new conversation detection trigger
  forceDiscoverNewConversations: () => Promise<void>;
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
  const [messageCursors] = useState<{ [convId: string]: string | null }>({});
  const [isSyncing] = useState(false);
  
  // Enhanced V3 managers
  const streamManagerRef = useRef<XMTPStreamManager | null>(null);
  const discoveryManagerRef = useRef<XMTPDiscoveryManager | null>(null);
  const errorRecoveryRef = useRef<number>(0);
  
  // Simple conversation caching
  const conversationCacheRef = useRef<{ [address: string]: XMTPConversation[] }>({});
  const lastCacheTimeRef = useRef<{ [address: string]: number }>({});

  // V3 Database Access Management with Force Cleanup
  const forceCleanupDatabase = useCallback(async (address: string): Promise<void> => {
    try {
      console.log('[XMTP] 🧹 Force cleaning database for address:', address);
      
      // Clear any existing XMTP database locks and keys
      const lockKey = `xmtp-db-lock-${address}`;
      localStorage.removeItem(lockKey);
      
      // Force close any existing database connections
      if ('indexedDB' in window) {
        const dbName = `xmtp-${address}`;
        try {
          // Close any open connections by attempting to delete and recreate
          const deleteReq = indexedDB.deleteDatabase(dbName);
          await new Promise((resolve, reject) => {
            deleteReq.onsuccess = () => resolve(true);
            deleteReq.onerror = () => reject(deleteReq.error);
            deleteReq.onblocked = () => {
              console.warn('[XMTP] Database delete blocked, forcing cleanup...');
              setTimeout(resolve, 2000); // Continue after 2 seconds
            };
          });
          console.log('[XMTP] ✅ Database cleanup completed');
        } catch (error) {
          console.warn('[XMTP] Database cleanup warning (non-critical):', error);
        }
      }
      
      // Clear browser storage for this address
      try {
        if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
          await navigator.storage.estimate();
        }
      } catch (error) {
        console.warn('[XMTP] Storage cleanup warning:', error);
      }
      
    } catch (error) {
      console.warn('[XMTP] Database cleanup warning (continuing anyway):', error);
    }
  }, []);

  const checkDatabaseAccess = useCallback(async (address: string): Promise<boolean> => {
    const lockKey = `xmtp-db-lock-${address}`;
    const tabId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    try {
      // Check if another tab has database access
      const existingLock = localStorage.getItem(lockKey);
      if (existingLock) {
        const lockData = JSON.parse(existingLock);
        const lockAge = Date.now() - lockData.timestamp;
        
        // If lock is older than 20 seconds, assume stale and force cleanup
        if (lockAge > 20000) {
          console.log('[XMTP] 🔒 Stale database lock detected, forcing cleanup...');
          await forceCleanupDatabase(address);
          // Wait a moment for cleanup to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log('[XMTP] ❌ Database access blocked by another tab/instance');
          setError('XMTP is already running in another tab. Please close other tabs and refresh, or wait 20 seconds.');
          return false;
        }
      }
      
      // Force cleanup before acquiring lock (prevents access handle conflicts)
      await forceCleanupDatabase(address);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay
      
      // Acquire database lock
      localStorage.setItem(lockKey, JSON.stringify({
        tabId,
        timestamp: Date.now()
      }));
      
      // Set up lock renewal and cleanup
      const lockInterval = setInterval(() => {
        localStorage.setItem(lockKey, JSON.stringify({
          tabId,
          timestamp: Date.now()
        }));
      }, 10000); // Renew every 10 seconds
      
      // Cleanup on page unload
      const cleanup = () => {
        clearInterval(lockInterval);
        const currentLock = localStorage.getItem(lockKey);
        if (currentLock) {
          const currentLockData = JSON.parse(currentLock);
          if (currentLockData.tabId === tabId) {
            localStorage.removeItem(lockKey);
          }
        }
      };
      
      window.addEventListener('beforeunload', cleanup);
      window.addEventListener('unload', cleanup);
      window.addEventListener('pagehide', cleanup);
      
      return true;
    } catch (error) {
      console.error('[XMTP] ❌ Database access check failed:', error);
      return false;
    }
  }, [forceCleanupDatabase]);

  // ENHANCED V3 PATTERN: Robust client initialization with recovery
  const initializeClient = useCallback(async () => {
    if (!walletClient || !address || isInitializing || isInitialized) {
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Checking browser compatibility...');
      
      // Browser environment compatibility checks
      if (typeof window === 'undefined') {
        throw new Error('XMTP requires a browser environment');
      }
      
      if (!window.localStorage) {
        throw new Error('Browser does not support localStorage. Please enable cookies and storage.');
      }
      
      if (!window.indexedDB) {
        throw new Error('Browser does not support IndexedDB. Please use a modern browser.');
      }
      
      setStatus('Checking database access...');
      
      // Check for database access conflicts
      const hasAccess = await checkDatabaseAccess(address);
      if (!hasAccess) {
        setIsInitializing(false);
        return;
      }
      
      setStatus('Initializing XMTP V3...');
      errorRecoveryRef.current = 0;

      console.log('[XMTP] 🚀 Starting enhanced XMTP V3 initialization...');
      
      
      const signer = createAutoSigner(walletClient);
      
      // V3: Generate or retrieve database encryption key (required for V3)
      const getOrCreateEncryptionKey = async (): Promise<Uint8Array> => {
        const keyName = `xmtp-db-key-${address}`;
        const stored = localStorage.getItem(keyName);
        if (stored) {
          return new Uint8Array(JSON.parse(stored));
        }
        
        // Browser compatibility check for crypto API
        if (!window.crypto || !window.crypto.getRandomValues) {
          throw new Error('Browser does not support required cryptographic APIs. Please use a modern browser.');
        }
        
        const key = crypto.getRandomValues(new Uint8Array(32));
        localStorage.setItem(keyName, JSON.stringify(Array.from(key)));
        console.log('[XMTP] ✅ V3 encryption key generated for address:', address);
        return key;
      };
      
      const dbEncryptionKey = await getOrCreateEncryptionKey();
      
      // V3: Create client with database access protection
      setStatus('Creating XMTP client...');
      const xmtpClient = await Client.create(signer, { 
        env: 'production',
        dbEncryptionKey // Required for V3 local database
      });
      
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('Loading conversations...');
      
      console.log('[XMTP] ✅ XMTP V3 initialized successfully');
      
      // Initialize managers and start discovery in parallel for faster loading
      const initPromises = [
        initializeManagers(xmtpClient),
        // Start immediate conversation discovery without waiting
        loadConversationsV3().catch(error => {
          console.error('[XMTP] ❌ Initial discovery failed:', error);
        })
      ];
      
      // Don't await - let them run in background
      Promise.all(initPromises).then(() => {
        setStatus('XMTP V3 ready');
        console.log('[XMTP] 🚀 Fast initialization completed');
        
        // Start backup discovery after initial load
        setTimeout(() => startBackupDiscovery(), 1000);
      }).catch(error => {
        console.error('[XMTP] ❌ Parallel initialization failed:', error);
      });
      
    } catch (err) {
      console.error('[XMTP] ❌ V3 Initialization failed:', err);
      errorRecoveryRef.current++;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize XMTP V3';
      
      // Handle specific database access errors
      if (errorMessage.includes('createSyncAccessHandle') || errorMessage.includes('Access Handle')) {
        setError('Database access conflict detected. Please close other XMTP tabs and refresh.');
        setStatus('Database conflict');
        setIsInitializing(false);
        return;
      }
      
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
  }, [walletClient, address, isInitializing, isInitialized, checkDatabaseAccess]);

  // Initialize enhanced managers
  const initializeManagers = useCallback(async (xmtpClient: Client) => {
    try {
      // Initialize discovery manager
      if (!discoveryManagerRef.current) {
        discoveryManagerRef.current = new XMTPDiscoveryManager();
        await discoveryManagerRef.current.initialize(xmtpClient);
      }

      // Initialize stream manager
      if (!streamManagerRef.current) {
        streamManagerRef.current = new XMTPStreamManager(xmtpClient);
        
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
            [message.conversationId]: String(message.content) || 'New message'
          }));
          
          // Mark as unread if not currently selected
          if (!selectedConversation || selectedConversation.id !== message.conversationId) {
            setUnreadConversations(prev => new Set([...prev, message.conversationId]));
          }
          
          // Enhanced new conversation detection
          const currentConversations = conversations.map(c => c.id);
          if (!currentConversations.includes(message.conversationId)) {
            console.log('[XMTP] 🆕 NEW INCOMING CONVERSATION detected:', message.conversationId);
            console.log('[XMTP] Message details:', {
              from: (message as any).senderAddress || (message as any).from,
              content: String(message.content).substring(0, 50),
              timestamp: new Date()
            });
            
            // Immediate discovery for new conversations using specialized method
            setTimeout(() => {
              console.log('[XMTP] 🔄 Triggering specialized new conversation detection...');
              if (discoveryManagerRef.current) {
                discoveryManagerRef.current.discoverNewIncomingConversations().then((result) => {
                  console.log('[XMTP] ✅ New conversation detection completed:', result);
                  
                  // Update conversations list with new discoveries
                  const freshConversations = discoveryManagerRef.current!.getCachedConversations();
                  setConversations(freshConversations as XMTPConversation[]);
                  
                  // If we found new conversations, also run full discovery for safety
                  if (result.total > 0) {
                    setTimeout(() => loadConversationsV3(), 1000);
                  }
                }).catch(error => {
                  console.error('[XMTP] ❌ New conversation detection failed:', error);
                  // Fallback to regular discovery
                  loadConversationsV3();
                });
              } else {
                console.warn('[XMTP] Discovery manager not available, using fallback');
                loadConversationsV3();
              }
            }, 500);
          }
        });
        
        // Set up error handler with enhanced recovery
        streamManagerRef.current.onError((error) => {
          console.error('[XMTP] Enhanced stream error:', error);
          setError(`Stream error: ${error.message}`);
          
          // Enhanced error handling based on error type
          const errorType = (error as any).errorType;
          if (errorType === 'WASM_PANIC') {
            console.log('[XMTP] WASM panic detected, applying cooldown...');
            // Simple cooldown without memory manager
            setTimeout(() => {}, 5000);
          } else if (errorType === 'BORROW_MUT_ERROR') {
            console.log('[XMTP] BorrowMutError detected, performing cleanup...');
            // Simple cleanup without memory manager
            setTimeout(() => {}, 2000);
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

  // OPTIMIZED V3 PATTERN: Fast discovery with caching
  const loadConversationsV3 = useCallback(async () => {
    if (!client || !isInitialized || !address) {
      console.warn('[XMTP] Client not available for discovery');
      return;
    }
    
    // Check cache first (cache for 30 seconds)
    const cacheKey = address;
    const cached = conversationCacheRef.current[cacheKey];
    const lastCacheTime = lastCacheTimeRef.current[cacheKey] || 0;
    const cacheAge = Date.now() - lastCacheTime;
    
    if (cached && cacheAge < 30000) {
      console.log('[XMTP] ⚡ Using cached conversations');
      setConversations(cached);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('[XMTP] 🚀 Fast loading conversations...');
      
      // Try discovery manager first, fallback to direct client if needed
      let discoveredConversations: any[] = [];
      
      if (discoveryManagerRef.current) {
        try {
          await discoveryManagerRef.current.discoverConversations();
          discoveredConversations = discoveryManagerRef.current.getCachedConversations();
          console.log('[XMTP] ✅ Discovery manager found', discoveredConversations.length, 'conversations');
        } catch (error) {
          console.warn('[XMTP] Discovery manager failed, using direct client method');
        }
      }
      
      // Fallback to direct client discovery if discovery manager not ready or failed
      if (discoveredConversations.length === 0) {
        try {
          const conversations = await client.conversations.list();
          discoveredConversations = conversations;
          console.log('[XMTP] ✅ Direct client found', discoveredConversations.length, 'conversations');
        } catch (error) {
          console.error('[XMTP] ❌ Direct client discovery also failed:', error);
        }
      }
      
      // Cache the results
      if (discoveredConversations.length > 0) {
        conversationCacheRef.current[cacheKey] = discoveredConversations as XMTPConversation[];
        lastCacheTimeRef.current[cacheKey] = Date.now();
      }
      
      console.log(`[XMTP] 📊 Fast discovery completed: ${discoveredConversations.length} conversations found`);
      
      setConversations(discoveredConversations as XMTPConversation[]);
      
      if (discoveredConversations.length > 0) {
        setError(null);
      }
      
    } catch (error) {
      console.error('[XMTP] ❌ Fast discovery failed:', error);
      setError('Discovery failed. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [client, isInitialized, address]);

  // Legacy method for backward compatibility
  const loadConversations = loadConversationsV3;

  // Backup discovery system for inbound conversations
  const startBackupDiscovery = useCallback(() => {
    if (!client || !discoveryManagerRef.current) return;
    
    console.log('[XMTP] 🔄 Starting backup discovery for inbound conversations...');
    
    // Poll every 30 seconds for the first 5 minutes
    let attempts = 0;
    const maxAttempts = 10; // 5 minutes
    
    const backupInterval = setInterval(async () => {
      attempts++;
      
      try {
        // Force discovery of new conversations
        const currentCount = conversations.length;
        await loadConversationsV3();
        
        // If we found new conversations, reduce polling frequency
        if (conversations.length > currentCount) {
          console.log('[XMTP] ✅ Backup discovery found new conversations, reducing polling frequency');
          clearInterval(backupInterval);
          
          // Continue with slower polling (every 2 minutes)
          setInterval(async () => {
            await loadConversationsV3();
          }, 120000);
        }
        
        // Stop intensive polling after 5 minutes
        if (attempts >= maxAttempts) {
          console.log('[XMTP] 🔄 Backup discovery completed, switching to normal polling');
          clearInterval(backupInterval);
          
          // Continue with normal polling every 60 seconds
          setInterval(async () => {
            await loadConversationsV3();
          }, 60000);
        }
        
      } catch (error) {
        console.error('[XMTP] ❌ Backup discovery error:', error);
      }
    }, 30000); // Every 30 seconds
    
  }, [client, conversations.length, loadConversationsV3]);

  // WORKING PATTERN: Simple conversation selection
  const selectConversation = useCallback(async (conversation: XMTPConversation) => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // V3: Sync conversation first to get latest messages
      await conversation.sync();
      
      // V3: Load messages with pagination
      const msgs = await conversation.messages({
        limit: 50n
      });
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
      console.log('[XMTP] 📤 Sending message...', { message, conversationId: conversation.id });
      
      const sentMessage = await conversation.send(message);
      
      console.log('[XMTP] 📤 Sent message object:', sentMessage);
      
      // Add to local messages immediately for optimistic UI
      setMessages(prev => ({
        ...prev,
        [conversation.id]: [...(prev[conversation.id] || []), sentMessage as unknown as DecodedMessage<string>]
      }));
      
      // Refresh messages to get the latest state from XMTP
      setTimeout(async () => {
        try {
          await conversation.sync();
          const msgs = await conversation.messages({
            limit: 50n
          });
          setMessages(prev => ({ ...prev, [conversation.id]: msgs }));
          console.log('[XMTP] 🔄 Refreshed messages after send');
        } catch (error) {
          console.error('[XMTP] ❌ Failed to refresh messages after send:', error);
        }
      }, 1000);
      
      console.log('[XMTP] ✅ Message sent successfully');
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to send message:', error);
      setError('Failed to send message');
    }
  }, [selectedConversation, client]);

  // V3 PATTERN: Inbox ID-based conversation creation
  const createConversation = useCallback(async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) return null;
    
    try {
      console.log(`[XMTP] 🔄 Creating V3 conversation with ${recipientAddress}...`);
      
      // V3: Validate address format
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientAddress);
      if (!isValidAddress) {
        setError('Invalid Ethereum address format');
        return null;
      }
      
      // V3: Normalize address
      const normalizedAddress = recipientAddress.toLowerCase();
      
      // V3: Prevent self-conversation
      if (normalizedAddress === address?.toLowerCase()) {
        setError('Cannot create conversation with yourself');
        return null;
      }
      
      // V3: Check if recipient can receive messages using correct API
      console.log(`[XMTP] 🔍 Checking if ${normalizedAddress} can receive messages...`);
      const canMessageResult = await Client.canMessage([
        { identifier: normalizedAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      if (!canMessageResult || (Array.isArray(canMessageResult) && !canMessageResult[0])) {
        setError('Recipient is not registered on XMTP network');
        return null;
      }
      
      console.log(`[XMTP] ✅ Recipient ${normalizedAddress} can receive messages`);
      
      // V3: Get inbox ID from address (required for official V3 pattern)
      console.log(`[XMTP] 🔍 Getting inbox ID for ${normalizedAddress}...`);
      
      // V3: Get inbox ID using correct browser SDK method
      const inboxId = await client.findInboxIdByIdentifier({
        identifier: normalizedAddress,
        identifierKind: 'Ethereum'
      });
      
      if (!inboxId) {
        setError('Could not find inbox ID for recipient address');
        return null;
      }
      
      const recipientInboxId = inboxId;
      console.log(`[XMTP] ✅ Found inbox ID: ${recipientInboxId}`);
      
      // V3: Create conversation using inbox ID (official V3 pattern)
      const conversation = await client.conversations.newDm(recipientInboxId);
      
      console.log('[XMTP] ✅ V3 conversation created successfully');
      
      // Reload conversations to pick up the new one
      await loadConversations();
      
      // Auto-select the new conversation
      setTimeout(() => {
        selectConversation(conversation as XMTPConversation);
      }, 500);
      
      return conversation as XMTPConversation;
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to create conversation:', error);
      
      // Handle specific errors with proper V3 error messages
      const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation';
      
      if (errorMessage.includes('hexadecimal') || errorMessage.includes('SQLSTATE 22023')) {
        setError('Address format error. Please verify the recipient address.');
      } else if (errorMessage.includes('inbox')) {
        setError('Could not find recipient on XMTP network. They may need to initialize XMTP first.');
      } else if (errorMessage.includes('grpc error 500')) {
        setError('Network error. Please try again in a moment.');
      } else if (errorMessage.includes('database') || errorMessage.includes('access')) {
        setError('Database access error. Please refresh the page and try again.');
      } else {
        setError('Failed to create conversation. Please try again.');
      }
      
      return null;
    }
  }, [client, loadConversations, address]);

  // UI compatibility methods (simplified)
  const loadMoreConversations = useCallback(async () => {
    // Simple: just reload conversations
    await loadConversations();
  }, [loadConversations]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    // V3: Load more messages with pagination
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      // V3: Sync conversation first to get latest messages
      await conversation.sync();
      
      const msgs = await conversation.messages({
        limit: 25n
      });
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
      await discoveryManagerRef.current.discoverConversations();
      await loadConversationsV3();
      console.log('[XMTP] ✅ Force discovery completed');
    } catch (error) {
      console.error('[XMTP] ❌ Force discovery failed:', error);
      setError('Force discovery failed - check debug panel for details');
    }
  }, [client, loadConversationsV3]);

  // V3 Enhancement: Manual new conversation detection trigger
  const forceDiscoverNewConversations = useCallback(async () => {
    if (!discoveryManagerRef.current) {
      console.warn('[XMTP] Cannot detect new conversations: discovery manager not initialized');
      return;
    }
    
    console.log('[XMTP] 🆕 Force detecting new incoming conversations...');
    setError(null);

    try {
      const result = await discoveryManagerRef.current.discoverNewIncomingConversations();
      console.log('[XMTP] ✅ Force new conversation detection result:', result);
      
      // Update conversations list with fresh discoveries
      const freshConversations = discoveryManagerRef.current.getCachedConversations();
      setConversations(freshConversations as XMTPConversation[]);
      
      if (result.total > 0) {
        console.log('[XMTP] 🎉 New conversations detected, running full sync...');
        setTimeout(() => loadConversationsV3(), 1000);
      }
      
    } catch (error) {
      console.error('[XMTP] ❌ Force new conversation detection failed:', error);
      setError('New conversation detection failed - check debug panel for details');
    }
  }, [loadConversationsV3]);

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
    forceDiscoverNewConversations,
  };

  return (
    <XMTPErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[XMTP] Error boundary caught error:', error, errorInfo);
        setError(`XMTP Error: ${error.message}`);
        
        // Enhanced error recovery
        if (error.message.includes('WASM') || error.message.includes('BorrowMut')) {
          console.log('[XMTP] WASM/BorrowMut error detected, applying simple cooldown...');
          // Simple error handling without memory manager
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