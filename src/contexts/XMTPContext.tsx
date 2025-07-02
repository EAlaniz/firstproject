import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';
import { validateGroupMembership } from '../utils/xmtpGroupValidation';


// Type guard for optional SDK methods
function hasMethod<T>(obj: unknown, method: string): obj is T {
  return typeof obj === 'object' && obj !== null && method in obj && typeof (obj as Record<string, unknown>)[method] === 'function';
}

export type XMTPConversation = Dm<string> | Group<string>;

export interface XMTPContextType {
  // Client state
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Connection state
  isOnline: boolean;
  reconnect: () => Promise<void>;
  
  // Conversations
  conversations: XMTPConversation[];
  selectedConversation: XMTPConversation | null;
  messages: { [convId: string]: DecodedMessage<string>[] };
  
  // Actions
  initializeClient: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (message: string, conversation?: XMTPConversation, onSuccess?: () => void) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<XMTPConversation | null>;
  
  // Status
  status: string;
  isLoading: boolean;
  
  // Enhanced features - REMOVED manual sync functions for seamless UX
  // forceXMTPResync: () => Promise<void>; // REMOVED - should be automatic
  // forceConversationDiscovery: () => Promise<void>; // REMOVED - should be automatic
  lastSyncTime: Date | null;
  
  // Seamless UX features
  isAutoSyncing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  messageDeliveryStatus: 'connected' | 'syncing' | 'reconnecting' | 'offline';
  
  // Pagination
  loadMoreConversations: () => Promise<void>;
  conversationCursor: string | null;
  loadMoreMessages: (conversationId: string) => Promise<void>;
  messageCursors: { [convId: string]: string | null };
  loadMessages: (conversationId: string, append?: boolean) => Promise<void>;
  
  // Message preview and unread state
  conversationPreviews: { [id: string]: string };
  unreadConversations: Set<string>;
  
  // New states
  isSyncing: boolean;
  
  // Delete a conversation by ID
  deleteConversation: (conversationId: string) => void;
  deleteConversations: (conversationIds: string[]) => void;
  
  // Conversation helper methods (XMTP V3 spec)
  getConversationById: (conversationId: string) => XMTPConversation | null;
  getConversationByPeerAddress: (peerAddress: string) => XMTPConversation | null;
}

const XMTPContext = createContext<XMTPContextType | undefined>(undefined);

interface XMTPProviderProps {
  children: ReactNode;
}

// Debug utility to check recipient registration and log XMTP state
export async function debugXMTP(client: Client | null, recipientAddress: string) {
  if (!client) {
    console.error('[XMTP Debug] Client is not initialized');
    return;
  }
  try {
    const canMessage = await Client.canMessage([
      { identifier: recipientAddress, identifierKind: 'Ethereum' }
    ], 'production');
    console.log(`[XMTP Debug] Can message ${recipientAddress}?`, canMessage);
    const conversations = await client.conversations.list();
    console.log('[XMTP Debug] Conversations:', conversations);
    if (conversations.length > 0) {
      for (const conv of conversations) {
        const msgs = await conv.messages();
        console.log(`[XMTP Debug] Messages in conversation ${conv.id}:`, msgs.length);
      }
    }
  } catch (error) {
    console.error('[XMTP Debug] Error:', error);
  }
}

// Helper to clear local XMTP state (for dev/debug use only)
export function clearXMTPState() {
  try {
    // Clear XMTP IndexedDB
    indexedDB.deleteDatabase('xmtp-encrypted-store');
    console.log('[XMTP Debug] Cleared local XMTP state');
    // Reload the page to reinitialize
    window.location.reload();
  } catch (error) {
    console.error('[XMTP Debug] Error clearing XMTP state:', error);
  }
}

// Helper to debug conversation filtering issues
export function debugConversationFiltering(address: string) {
  try {
    const deletedKey = `xmtp-deleted-conversations-${address.toLowerCase()}`;
    const deletedIds = localStorage.getItem(deletedKey);
    const conversationsKey = `xmtp-conversations-${address}`;
    const conversations = localStorage.getItem(conversationsKey);
    
    console.log('[XMTP Debug] Conversation Filtering Debug:', {
      address,
      deletedKey,
      deletedIds: deletedIds ? JSON.parse(deletedIds) : [],
      conversationsCount: conversations ? JSON.parse(conversations).length : 0,
      localStorage: {
        deleted: deletedIds,
        conversations: conversations ? JSON.parse(conversations).map((c: any) => ({ id: c.id, peerAddress: c.peerAddress })) : []
      }
    });
    
    // Clear deleted conversations for debugging
    localStorage.removeItem(deletedKey);
    console.log('[XMTP Debug] Cleared deleted conversations list for debugging');
    
  } catch (error) {
    console.error('[XMTP Debug] Error debugging conversation filtering:', error);
  }
}

// Helper to debug conversation persistence issues
export function debugConversationPersistence(address: string) {
  try {
    const conversationsKey = `xmtp-conversations-${address}`;
    const deletedKey = `xmtp-deleted-conversations-${address.toLowerCase()}`;
    const recentlyCreatedKey = `xmtp-recently-created-${address.toLowerCase()}`;
    
    const conversations = localStorage.getItem(conversationsKey);
    const deletedIds = localStorage.getItem(deletedKey);
    const recentlyCreated = localStorage.getItem(recentlyCreatedKey);
    
    console.log('[XMTP Debug] Conversation Persistence Debug:', {
      address,
      conversationsCount: conversations ? JSON.parse(conversations).length : 0,
      deletedCount: deletedIds ? JSON.parse(deletedIds).length : 0,
      recentlyCreatedCount: recentlyCreated ? JSON.parse(recentlyCreated).conversationIds?.length || 0 : 0,
      localStorage: {
        conversations: conversations ? JSON.parse(conversations).map((c: any) => ({ id: c.id, peerAddress: c.peerAddress })) : [],
        deleted: deletedIds ? JSON.parse(deletedIds) : [],
        recentlyCreated: recentlyCreated ? JSON.parse(recentlyCreated) : null
      }
    });
    
  } catch (error) {
    console.error('[XMTP Debug] Error debugging conversation persistence:', error);
  }
}

// Make debug functions available globally
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).debugConversationFiltering = debugConversationFiltering;
  (window as any).debugConversationPersistence = debugConversationPersistence;
  (window as any).clearXMTPState = clearXMTPState;
}

// Helper to check for clock skew (can cause MLS validation errors)
export function checkClockSkew() {
  try {
    // Simple check - in production you might want to compare with a server time
    const now = Date.now();
    const timeString = new Date().toISOString();
    console.log(`[XMTP Debug] Current time: ${timeString} (${now})`);
    
    // Basic sanity check - if time is before 2024, something is wrong
    if (now < new Date('2024-01-01').getTime()) {
      console.warn('[XMTP Debug] ⚠️ System clock appears to be incorrect. This may cause XMTP validation errors.');
      return false;
    }
    return true;
  } catch (error) {
    console.error('[XMTP Debug] Error checking clock:', error);
    return false;
  }
}

// PRODUCTION: Disable verbose XMTP logging to reduce console spam
// Only enable in development if needed for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  if (typeof (Client as unknown as Record<string, unknown>).activatePersistentLibXMTPLogWriter === 'function') {
    try {
      // Commented out to reduce console noise
      // (Client as any).activatePersistentLibXMTPLogWriter?.();
    } catch {
      // Ignore if not supported
    }
  }
}

// Utility: Log MLS debug info for a conversation
export async function logMLSConversationDebug(convo: Dm<string> | Group<string>) {
  // getDebugInformation is available on official SDK but not in types
  if (typeof (convo as any).getDebugInformation === 'function') {
    const debug = await (convo as any).getDebugInformation();
    console.log('MLS debug:', debug);
    if (debug.maybeForked) {
      console.warn('⚠️ This conversation may be forked! Consider resyncing or rebuilding the client.');
    }
    return debug;
  }
  return null;
}

// Type guard for async iterator
function isAsyncIterator(obj: any): obj is AsyncIterableIterator<any> {
  return obj && typeof obj[Symbol.asyncIterator] === 'function' && typeof obj.return === 'function';
}

function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Utility to normalize identifiers for XMTP API calls
function normalizeIdentifier(identifier: string, kind: string): string {
  if (kind === 'Ethereum') {
    // Ethereum addresses should keep the '0x' prefix
    return identifier.startsWith('0x') ? identifier : `0x${identifier}`;
  }
  // For conversation IDs, inbox IDs, etc., strip '0x' if present
  return identifier.startsWith('0x') ? identifier.slice(2) : identifier;
}


// Utility: JSON replacer to serialize BigInt as string
function jsonBigIntReplacer(_key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
}

// Debounced localStorage save to reduce write operations
function useDebouncedSave(key: string, value: any, delay: number = 1000) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (value !== null && value !== undefined) {
        try {
          localStorage.setItem(key, JSON.stringify(value, jsonBigIntReplacer));
        } catch (error) {
          console.error(`Failed to save ${key} to localStorage:`, error);
        }
      }
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, value, delay]);
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Client state with useRef to ensure single Client.create() call
  const clientRef = useRef<Client | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Click "Messages" to enable XMTP');
  
  // Conversations and messages
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [convId: string]: DecodedMessage<string>[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Pagination state
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [messageCursors, setMessageCursors] = useState<{ [convId: string]: string | null }>({});

  // Message streaming subscriptions
  const conversationStreams = useRef<Map<string, unknown>>(new Map());
  
  // Global stream tracking to prevent duplicates
  const globalStreamRef = useRef<any>(null);
  const globalStreamActive = useRef<boolean>(false);

  // Message preview and unread state
  const [conversationPreviews, setConversationPreviews] = useState<{ [id: string]: string }>({});
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());

  // New states
  const [isSyncing, setIsSyncing] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Seamless UX states
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('offline');
  const [messageDeliveryStatus, setMessageDeliveryStatus] = useState<'connected' | 'syncing' | 'reconnecting' | 'offline'>('offline');

  // Maintain a set of permanently deleted conversation IDs
  const [deletedConversationIds, setDeletedConversationIds] = useState<Set<string>>(new Set());
  // Track whether deleted conversation IDs have been loaded from storage
  const [deletedIdsLoaded, setDeletedIdsLoaded] = useState<boolean>(false);
  // Track timestamp of last user-initiated deletion to prevent emergency fix
  const [lastUserDeletionTime, setLastUserDeletionTime] = useState<number>(0);
  // Track recently created conversation IDs to prevent them from being filtered out
  const [recentlyCreatedConversationIds, setRecentlyCreatedConversationIds] = useState<Set<string>>(new Set());
  
  // Memory management - limit stored messages per conversation
  const MAX_MESSAGES_PER_CONVERSATION = 100;
  const MAX_CONVERSATIONS = 50;
  
  // Safety wrapper for setConversations to prevent undefined with memory management
  const safeSetConversations = useCallback((updater: XMTPConversation[] | ((prev: XMTPConversation[]) => XMTPConversation[])) => {
    setConversations(prev => {
      const newValue = typeof updater === 'function' ? updater(prev || []) : updater;
      const limitedConversations = (newValue || []).slice(0, MAX_CONVERSATIONS); // Keep only first N conversations
      
      // TEMPORARY DEBUG: Track conversation state changes
      if (limitedConversations.length !== (prev || []).length) {
        console.log('[XMTP] 📊 Conversation state change:', {
          before: (prev || []).length,
          after: limitedConversations.length,
          conversationIds: limitedConversations.map(c => c.id),
          recentlyCreated: Array.from(recentlyCreatedConversationIds)
        });
      }
      
      return limitedConversations || [];
    });
  }, [MAX_CONVERSATIONS, recentlyCreatedConversationIds]);

  // Safety wrapper for setMessages to prevent undefined with memory management
  const safeSetMessages = useCallback((convId: string, updater: DecodedMessage<string>[] | ((prev: DecodedMessage<string>[]) => DecodedMessage<string>[])) => {
    setMessages(prev => {
      const prevMsgs = prev[convId] || [];
      const newValue = typeof updater === 'function' ? updater(prevMsgs) : updater;
      const limitedMessages = (newValue || []).slice(-MAX_MESSAGES_PER_CONVERSATION); // Keep only last N messages
      return { ...prev, [convId]: limitedMessages };
    });
  }, [MAX_MESSAGES_PER_CONVERSATION]);
  
  // Enhanced paginated conversation loading with previews
  // ==========================================
  // SEAMLESS UX: AUTOMATIC BACKGROUND SYNC SYSTEM
  // ==========================================
  
  // Debounce refs for sync operations
  const syncDebounceRef = useRef<NodeJS.Timeout>();
  const syncRestartDebounceRef = useRef<NodeJS.Timeout>();
  const lastSyncAttemptRef = useRef<number>(0);
  
  // Intelligent background sync manager - handles all sync operations transparently
  const backgroundSyncManager = useCallback(async () => {
    if (!client || !isInitialized) return;
    
    // Debounce rapid sync calls
    const now = Date.now();
    if (now - lastSyncAttemptRef.current < 2000) {
      console.log('[XMTP] 🔄 Sync debounced - too soon after last attempt');
      return;
    }
    lastSyncAttemptRef.current = now;
    
    const startTime = Date.now();
    setIsAutoSyncing(true);
    setMessageDeliveryStatus('syncing');
    
    try {
      // Automatic background sync started
      
      // Step 1: Enhanced V3 sync for conversation discovery
      // V3 Enhanced sync - ensuring conversation visibility
      
      // V3 Client-level sync first (critical for receiver discovery)
      if (hasMethod<{ sync: () => Promise<void> }>(client, 'sync')) {
        await (client as any).sync();
        console.log('[XMTP] ✅ Client database sync completed');
      }
      
      // Conversation-level sync
      if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(client, 'conversations') &&
          hasMethod<{ sync: () => Promise<void> }>(client.conversations, 'sync')) {
        await client.conversations.sync();
        console.log('[XMTP] ✅ Conversation sync completed');
      }
      
      // V3 specific: Force DM discovery
      if (hasMethod<{ listDms: () => Promise<unknown[]> }>(client.conversations, 'listDms')) {
        const dms = await (client.conversations as any).listDms();
        console.log(`[XMTP] 📱 V3 DM discovery: ${dms.length} DMs found`);
      }
      
      // Step 2: Load conversations seamlessly
      const convos = await client.conversations.list();
      const filteredConvos = convos.filter(c => !deletedConversationIds.has(c.id));
      safeSetConversations(filteredConvos as XMTPConversation[]);
      
      // Step 3: Update connection quality based on sync performance
      const syncDuration = Date.now() - startTime;
      if (syncDuration < 1000) {
        setConnectionQuality('excellent');
      } else if (syncDuration < 3000) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('poor');
      }
      
      setMessageDeliveryStatus('connected');
      setLastSyncTime(new Date());
      
      // Handle empty conversation state gracefully
      if (filteredConvos.length === 0 && convos.length > 0) {
        console.log(`[XMTP] 💭 All ${convos.length} conversations filtered out (deleted by user)`);
      } else if (filteredConvos.length === 0 && convos.length === 0) {
        console.log('[XMTP] 💭 No conversations found - empty state is normal');
      }
      
      console.log(`[XMTP] ✅ Background sync completed in ${syncDuration}ms`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Don't treat empty conversation state as an error
      if (conversations?.length === 0 && errorMessage.includes('no conversations')) {
        console.log('[XMTP] 💭 Empty conversation state - this is normal after deletion');
        setConnectionQuality('excellent');
        setMessageDeliveryStatus('connected');
        setLastSyncTime(new Date());
      } else {
        console.warn('[XMTP] ⚠️ Background sync failed, will retry:', error);
        setConnectionQuality('poor');
        setMessageDeliveryStatus('reconnecting');
        
        // Smart retry with exponential backoff - but only for real errors
        setTimeout(backgroundSyncManager, Math.min(5000, 1000 * Math.pow(2, 1)));
      }
    } finally {
      setIsAutoSyncing(false);
    }
  }, [client, isInitialized, deletedConversationIds, safeSetConversations]);

  // ==========================================
  // INTELLIGENT NETWORK-AWARE SYNC SYSTEM
  // ==========================================
  
  // Debounced sync system startup to prevent rapid restarts
  const debouncedSyncSystemStart = useCallback(() => {
    if (syncRestartDebounceRef.current) {
      clearTimeout(syncRestartDebounceRef.current);
    }
    
    syncRestartDebounceRef.current = setTimeout(() => {
      if (!client || !isInitialized) return;
      
      console.log('[XMTP] 🚀 Starting intelligent network-aware sync system');
      
      // Initial sync with debouncing
      if (syncDebounceRef.current) {
        clearTimeout(syncDebounceRef.current);
      }
      syncDebounceRef.current = setTimeout(backgroundSyncManager, 1000);
      
    }, 500); // 500ms debounce for sync system restarts
  }, [client, isInitialized, backgroundSyncManager]);
  
  // Adaptive sync timing based on connection quality and user activity
  useEffect(() => {
    if (!client || !isInitialized) return;
    
    // Use debounced startup instead of immediate
    debouncedSyncSystemStart();
    
    // Adaptive sync intervals based on connection quality
    const getSyncInterval = () => {
      switch (connectionQuality) {
        case 'excellent': return 15000; // 15 seconds for excellent connection
        case 'good': return 20000;      // 20 seconds for good connection
        case 'poor': return 30000;      // 30 seconds for poor connection
        case 'offline': return 60000;   // 60 seconds when offline (for recovery)
        default: return 15000;
      }
    };
    
    // Dynamic sync interval that adapts to network conditions
    let syncInterval: NodeJS.Timeout;
    
    const setupSyncInterval = () => {
      if (syncInterval) clearInterval(syncInterval);
      const interval = getSyncInterval();
      console.log(`[XMTP] 📡 Setting sync interval to ${interval/1000} seconds (${connectionQuality} connection)`);
      syncInterval = setInterval(() => {
        // Skip sync if no conversations exist to reduce unnecessary operations
        if (conversations?.length === 0) {
          console.log('[XMTP] 💭 Skipping background sync - no conversations to sync');
          return;
        }
        
        // Add debouncing to interval-based syncs
        if (syncDebounceRef.current) {
          clearTimeout(syncDebounceRef.current);
        }
        syncDebounceRef.current = setTimeout(backgroundSyncManager, 500);
      }, interval);
    };
    
    // Delayed setup to prevent immediate restart
    const setupTimeout = setTimeout(setupSyncInterval, 2000);
    
    // Reconfigure when connection quality changes with debouncing
    // Skip frequent reconfigurations when no conversations exist
    const intervalRef = setInterval(() => {
      if (conversations?.length === 0) {
        console.log('[XMTP] 💭 Skipping sync reconfiguration - no conversations exist');
        return;
      }
      
      const newInterval = getSyncInterval();
      const currentInterval = syncInterval && (syncInterval as any)._idleTimeout;
      if (currentInterval !== newInterval) {
        setupSyncInterval();
      }
    }, 10000); // Reduced frequency from 5s to 10s
    
    return () => {
      console.log('[XMTP] 🛑 Stopping intelligent sync system');
      if (syncInterval) clearInterval(syncInterval);
      if (setupTimeout) clearTimeout(setupTimeout);
      clearInterval(intervalRef);
      if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
      if (syncRestartDebounceRef.current) clearTimeout(syncRestartDebounceRef.current);
    };
  }, [client, isInitialized, debouncedSyncSystemStart, connectionQuality]);
  
  // Online/offline detection with automatic reconnection
  useEffect(() => {
    const handleOnline = () => {
      console.log('[XMTP] 🌐 Network came online - triggering immediate sync');
      setIsOnline(true);
      setMessageDeliveryStatus('syncing');
      setTimeout(backgroundSyncManager, 500); // Quick sync when coming back online
    };
    
    const handleOffline = () => {
      console.log('[XMTP] 📴 Network went offline');
      setIsOnline(false);
      setConnectionQuality('offline');
      setMessageDeliveryStatus('offline');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [backgroundSyncManager]);
  
  // Enhanced conversation discovery with retry logic for better receiver experience
  const loadConversationsWithRetry = useCallback(async (maxRetries: number = 3, delay: number = 2000): Promise<XMTPConversation[]> => {
    if (!client) {
      throw new Error('XMTP client not initialized');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[XMTP] 🔄 Conversation discovery attempt ${attempt}/${maxRetries}`);
        
        // Force comprehensive sync before each attempt
        if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(client, 'conversations') &&
            hasMethod<{ sync: () => Promise<void> }>(client.conversations, 'sync')) {
          try {
            await client.conversations.sync();
            console.log(`[XMTP] ✅ Sync completed on attempt ${attempt}`);
          } catch (syncError) {
            const syncErrorMessage = syncError instanceof Error ? syncError.message : String(syncError);
            // Enhanced sync success message detection including WASM patterns
            const isWasmSuccessMessage = 
              (syncErrorMessage.includes('wasm') && (syncErrorMessage.includes('succeeded') || syncErrorMessage.includes('completed'))) ||
              (syncErrorMessage.includes('WebAssembly') && syncErrorMessage.includes('success')) ||
              /wasm.*sync.*complete/i.test(syncErrorMessage) ||
              /wasm.*operation.*finished/i.test(syncErrorMessage) ||
              /bindings_wasm.*succeeded/i.test(syncErrorMessage);
              
            const isSyncSuccessMessage = 
              syncErrorMessage.includes('synced') ||
              syncErrorMessage.includes('success') ||
              syncErrorMessage.includes('completed') ||
              syncErrorMessage.includes('SyncGroup') ||
              syncErrorMessage.includes('ConversationSync') ||
              isWasmSuccessMessage;
              
            if (isSyncSuccessMessage) {
              console.log(`[XMTP] ✅ Sync status message on attempt ${attempt}:`, syncErrorMessage);
            } else {
              console.warn(`[XMTP] ⚠️ Sync failed on attempt ${attempt}:`, syncError);
            }
          }
        }

        // Add small delay to allow for network propagation
        if (attempt > 1) {
          console.log(`[XMTP] ⏱️ Waiting ${delay}ms for network propagation...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // Load conversations
        const convos = await client.conversations.list();
        console.log(`[XMTP] 📋 Discovered ${convos.length} conversations on attempt ${attempt}`);
        
        return convos as XMTPConversation[];
      } catch (error) {
        console.error(`[XMTP] ❌ Conversation discovery failed on attempt ${attempt}:`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Exponential backoff for retries
        const retryDelay = delay * Math.pow(2, attempt - 1);
        console.log(`[XMTP] ⏳ Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    return [];
  }, [client]);

  const loadConversations = useCallback(async () => {
    if (!client || !deletedIdsLoaded) {
      // Skipping loadConversations - waiting for client initialization
      return;
    }
    setIsLoading(true);
    setStatus('Loading conversations...');
    try {
      // Use enhanced conversation discovery with retry logic
      const convos = await loadConversationsWithRetry();
      // Filter out deleted conversations
      let filteredConvos = convos.filter(c => !deletedConversationIds.has(c.id));
      
      // Debug: Check if filtering is working correctly
      if (convos.length > 0 && filteredConvos.length === 0) {
        // All conversations filtered out (user deleted them)
        
        // REMOVED AGGRESSIVE EMERGENCY FIX: The emergency fix was incorrectly resetting user deletions
        // Users expect their deleted conversations to stay deleted permanently
        // Only show warning if there might be a real issue, but NEVER reset deleted IDs automatically
        const timeSinceLastDeletion = Date.now() - lastUserDeletionTime;
        const recentUserDeletion = timeSinceLastDeletion < 300000; // 5 minutes
        
        if (deletedConversationIds.size > convos.length * 0.8 && !recentUserDeletion) {
          // Many conversations marked as deleted
          // DO NOT reset deleted IDs - user wants them to stay deleted
        }
        
        // CRITICAL FIX: Always include recently created conversations
        const recentlyCreatedConvos = convos.filter(conv => 
          recentlyCreatedConversationIds.has(conv.id)
        );
        
        // Add recently created conversations back even if they were filtered out
        if (recentlyCreatedConvos.length > 0) {
          console.log('[XMTP] 🔄 Ensuring recently created conversations are included:', recentlyCreatedConvos.map(c => c.id));
          const existingIds = new Set(filteredConvos.map(c => c.id));
          const missingRecentlyCreated = recentlyCreatedConvos.filter(c => !existingIds.has(c.id));
          filteredConvos = [...filteredConvos, ...missingRecentlyCreated];
        }
        
        if (convos.length > 0 && filteredConvos.length === 0 && recentlyCreatedConvos.length === 0) {
          // Only show empty state if there are no recently created conversations
          const timeSinceLastDeletion = Date.now() - lastUserDeletionTime;
          const recentUserDeletion = timeSinceLastDeletion < 300000; // 5 minutes
          
          if (recentUserDeletion) {
            safeSetConversations([]);
            setConversationCursor(null);
            setStatus('No conversations');
            return;
          }
        }
      }
      
      console.log('[XMTP] 🔧 DEBUG: Setting conversations from loadConversations:', {
        totalFound: convos.length,
        afterFiltering: filteredConvos.length,
        filteredConversationIds: filteredConvos.map((c: any) => c.id),
        recentlyCreated: Array.from(recentlyCreatedConversationIds),
        deleted: deletedConversationIds.size,
        deletedIds: Array.from(deletedConversationIds),
        allConversationIds: convos.map((c: any) => c.id)
      });
      
      safeSetConversations(filteredConvos as XMTPConversation[]);
      setConversationCursor(null);
      setStatus(`Ready (${filteredConvos.length} conversations)`);
      // Loaded conversations from network
    } catch (error) {
      console.error('[XMTP] Failed to load conversations:', error);
      setError('Failed to load conversations');
      
      // If network loading fails, try to use cached conversations at least
      if (conversations.length === 0) {
        try {
          const cached = localStorage.getItem(`xmtp-conversations-${address}`);
          if (cached) {
            const cachedConvos = JSON.parse(cached);
            const filteredCachedConvos = cachedConvos.filter((c: any) => !deletedConversationIds.has(c.id));
            if (filteredCachedConvos.length > 0) {
              safeSetConversations(filteredCachedConvos);
              setStatus(`Ready (${filteredCachedConvos.length} conversations from cache)`);
              console.log('[XMTP] ♾️ Fallback to cached conversations after network failure');
            }
          }
        } catch (cacheError) {
          console.error('[XMTP] Failed to load cached conversations as fallback:', cacheError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [client, safeSetConversations, deletedConversationIds, deletedIdsLoaded, recentlyCreatedConversationIds, lastUserDeletionTime]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (client && !isInitializing) {
        loadConversations();
      }
    };
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [client, isInitializing, loadConversations]);

  // Load cached conversations on init (wallet-specific)
  useEffect(() => {
    if (!address) return;
    const cached = localStorage.getItem(`xmtp-conversations-${address}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          safeSetConversations(parsed);
          setIsSyncing(true);
        }
      } catch (error) {
        console.error('Failed to parse cached conversations:', error);
      }
    }
  }, [safeSetConversations, address]);

  // Debounced save for conversations
  useDebouncedSave(
    address ? `xmtp-conversations-${address}` : '', 
    conversations?.length ? conversations : null, 
    500
  );

  // Load cached messages for all conversations on init (wallet-specific)
  useEffect(() => {
    if (!conversations || !conversations.length || !address) return;
    let loadedAny = false;
    const allMessages: { [convId: string]: DecodedMessage<string>[] } = {};
    conversations.forEach((conv) => {
      const cached = localStorage.getItem(`xmtp-messages-${address}-${conv.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            allMessages[conv.id] = parsed;
            loadedAny = true;
            console.log(`[XMTP] Loaded cached messages for conversation ${conv.id}:`, parsed.length);
          }
        } catch (error) {
          console.error(`[XMTP] Failed to parse cached messages for conversation ${conv.id}:`, error);
        }
      }
    });
    if (loadedAny) {
      setMessages((prev) => ({ ...allMessages, ...prev }));
      setIsSyncing(true);
    }
  }, [conversations, address]);

  // Debounced save for messages (only save when messages are updated)
  useEffect(() => {
    if (!messages || !address) return;
    const saveMessages = () => {
      Object.entries(messages).forEach(([convId, msgs]) => {
        if (Array.isArray(msgs) && msgs.length > 0) {
          try {
            localStorage.setItem(`xmtp-messages-${address}-${convId}`, JSON.stringify(msgs, jsonBigIntReplacer));
          } catch (error) {
            console.error(`[XMTP] Failed to persist messages for conversation ${convId}:`, error);
          }
        }
      });
      setIsSyncing(false);
    };
    const timeoutId = setTimeout(saveMessages, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, address]);

  // Save/restore selectedConversation.id (wallet-specific)
  useEffect(() => {
    if (selectedConversation && address) {
      localStorage.setItem(`selected-convo-${address}`, selectedConversation.id);
    }
  }, [selectedConversation, address]);
  useEffect(() => {
    if (!address) return;
    const cached = localStorage.getItem(`selected-convo-${address}`);
    if (cached && conversations && conversations.length) {
      const match = conversations.find(c => c.id === cached);
      if (match) setSelectedConversation(match);
    }
  }, [conversations, address]);

  // ==========================================
  // SMART CACHING & OFFLINE-FIRST APPROACH
  // ==========================================
  
  // Load cached data on mount for instant UX
  useEffect(() => {
    if (!address) {
      setDeletedIdsLoaded(false);
      return;
    }
    
    // Loading cached data for instant UX
    
    // Load deleted conversation IDs with consistent key format
    const deleted = localStorage.getItem(`xmtp-deleted-conversations-${address.toLowerCase()}`);
    if (deleted) {
      try {
        const deletedIds = JSON.parse(deleted);
        setDeletedConversationIds(new Set(deletedIds));
        console.log(`[XMTP] ✅ Loaded ${deletedIds.length} deleted conversation IDs from cache for wallet:`, address.toLowerCase());
      } catch (error) {
        console.error('Failed to parse deleted conversation IDs:', error);
        setDeletedConversationIds(new Set());
      }
    } else {
      setDeletedConversationIds(new Set());
    }
    
    // Load recently created conversation IDs from localStorage
    const recentlyCreated = localStorage.getItem(`xmtp-recently-created-${address.toLowerCase()}`);
    if (recentlyCreated) {
      try {
        const recentlyCreatedData = JSON.parse(recentlyCreated);
        const now = Date.now();
        const validIds = [];
        const validTimestamps: { [key: string]: number } = {};
        
        // Filter out conversations older than 24 hours
        for (const id of recentlyCreatedData.conversationIds || []) {
          const timestamp = recentlyCreatedData.timestamps?.[id] || 0;
          if (now - timestamp < 86400000) { // 24 hours
            validIds.push(id);
            validTimestamps[id] = timestamp;
          }
        }
        
        setRecentlyCreatedConversationIds(new Set(validIds));
        
        // Update localStorage with cleaned data
        if (validIds.length > 0) {
          localStorage.setItem(`xmtp-recently-created-${address.toLowerCase()}`, JSON.stringify({
            conversationIds: validIds,
            timestamps: validTimestamps
          }));
          console.log(`[XMTP] ✅ Loaded ${validIds.length} recently created conversation IDs from cache for wallet:`, address.toLowerCase());
        } else {
          localStorage.removeItem(`xmtp-recently-created-${address.toLowerCase()}`);
          console.log(`[XMTP] 🧹 All recently created conversations expired, cleared cache for wallet:`, address.toLowerCase());
        }
      } catch (error) {
        console.error('Failed to parse recently created conversation IDs:', error);
        setRecentlyCreatedConversationIds(new Set());
      }
    } else {
      setRecentlyCreatedConversationIds(new Set());
    }
    
    // Load cached conversations for instant display - FIXED to properly filter deleted
    const cachedConversations = localStorage.getItem(`xmtp-conversations-${address}`);
    if (cachedConversations) {
      try {
        const convos = JSON.parse(cachedConversations);
        if (Array.isArray(convos) && convos.length > 0) {
          // CRITICAL FIX: Use the deletedIds set we just loaded instead of state
          const deletedIds = localStorage.getItem(`xmtp-deleted-conversations-${address.toLowerCase()}`);
          let deletedSet = new Set<string>();
          if (deletedIds) {
            try {
              const parsedDeletedIds = JSON.parse(deletedIds);
              deletedSet = new Set(parsedDeletedIds);
            } catch (parseError) {
              console.warn('Failed to parse deleted IDs for cache filtering:', parseError);
            }
          }
          
          // Filter out deleted conversations using the loaded deleted set
          const filteredCachedConvos = convos.filter(c => !deletedSet.has(c.id));
          
          if (filteredCachedConvos.length > 0) {
            safeSetConversations(filteredCachedConvos);
            console.log(`[XMTP] ✅ Loaded ${filteredCachedConvos.length} conversations from cache (${convos.length - filteredCachedConvos.length} deleted filtered out)`);
            setStatus(`Ready (${filteredCachedConvos.length} conversations cached)`);
          } else {
            console.log(`[XMTP] 📭 All ${convos.length} cached conversations were deleted`);
            setStatus('No conversations (all cached were deleted)');
          }
        }
      } catch (error) {
        console.warn('Failed to load cached conversations:', error);
      }
    }
    
    // Load cached messages for instant display
    const cachedMessages = localStorage.getItem(`xmtp-messages-${address}`);
    if (cachedMessages) {
      try {
        const msgs = JSON.parse(cachedMessages);
        if (typeof msgs === 'object' && msgs !== null) {
          setMessages(msgs);
          console.log(`[XMTP] ✅ Loaded cached messages for ${Object.keys(msgs).length} conversations`);
        }
      } catch (error) {
        console.warn('Failed to load cached messages:', error);
      }
    }
    
    setDeletedIdsLoaded(true);
  }, [address, safeSetConversations]);
  
  // Smart caching - automatically save conversations and messages to localStorage
  useDebouncedSave(
    address ? `xmtp-conversations-${address}` : '',
    conversations && conversations.length > 0 ? conversations : null,
    1000
  );
  
  useDebouncedSave(
    address ? `xmtp-messages-${address}` : '',
    messages && Object.keys(messages).length > 0 ? messages : null,
    1000
  );

  // Debounced save for deleted conversation IDs with consistent key format
  useDebouncedSave(
    address ? `xmtp-deleted-conversations-${address.toLowerCase()}` : '',
    deletedConversationIds.size > 0 ? [...deletedConversationIds] : null,
    500
  );

  // Load conversations when client is ready and deleted IDs are loaded
  useEffect(() => {
    if (client && deletedIdsLoaded && !isInitializing) {
      // Client ready, loading conversations
      loadConversations();
    }
  }, [client, deletedIdsLoaded, isInitializing, loadConversations]);

  // Filter out deleted conversations only when deletedConversationIds changes
  // (removed circular dependency on conversations to prevent infinite loop)
  useEffect(() => {
    if (client && conversations.length > 0 && deletedConversationIds.size > 0) {
      const filteredConversations = conversations.filter(c => !deletedConversationIds.has(c.id));
      if (filteredConversations.length !== conversations.length) {
        console.log(`[DEBUG] Filtering out ${conversations.length - filteredConversations.length} deleted conversations`);
        safeSetConversations(filteredConversations);
      }
    }
  }, [client, deletedConversationIds, safeSetConversations]); // Removed 'conversations' dependency

  // Add debug log after setting conversations (disabled to reduce spam)
  // useEffect(() => {
  //   console.log('[DEBUG] Conversations in state after update:', conversations);
  // }, [conversations]);

  // Reduced polling frequency for better performance
  React.useEffect(() => {
    if (!client) return;
    const interval = setInterval(() => {
      // Only poll if not currently loading to prevent overlapping requests
      if (!isLoading) {
        loadConversations();
      }
    }, 30000); // Reduced from 10s to 30s
    return () => clearInterval(interval);
  }, [client, loadConversations, isLoading]);

  // Load more conversations (next page)
  const loadMoreConversations = async () => {
    await loadConversations();
  };

  // Paginated message loading per conversation
  async function loadMessages(conversationId: string, append = false, conversationObj?: XMTPConversation) {
    // Use provided conversation object or find in conversations array
    const conversation = conversationObj || conversations?.find(c => c.id === conversationId);
    if (!conversation) {
      console.warn('[XMTP] ❌ Conversation not found for loading messages:', conversationId, 'Available conversations:', conversations?.length || 0);
      return;
    }
    
    console.log('[XMTP] 📥 Loading messages for conversation:', {
      conversationId,
      append,
      existingMessagesCount: messages[conversationId]?.length || 0,
      conversationFound: !!conversation
    });
    
    setIsLoading(true);
    try {
      const cursor = messageCursors[conversationId] || null;
      if (typeof (conversation as any).messages === 'function') {
        const page = await (conversation as any).messages({ pageSize: 20, cursor: append ? cursor : null });
        console.log('[XMTP] 📥 Loaded messages from conversation:', {
          messageCount: page.messages?.length || 0,
          hasCursor: !!page.cursor,
          append
        });
        safeSetMessages(conversationId, (prev: DecodedMessage<string>[]) => {
          const pageMsgs = Array.isArray(page.messages)
            ? page.messages.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => typeof m === 'object' && m !== null)
            : [];
          const prevMsgs = Array.isArray(prev)
            ? prev.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => typeof m === 'object' && m !== null)
            : [];
          // Concatenate and filter again to guarantee only DecodedMessage<string>[]
          const result = append ? [...pageMsgs, ...prevMsgs] : pageMsgs;
          return result.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => typeof m === 'object' && m !== null);
        });
        setMessageCursors(cursors => ({ ...cursors, [conversationId]: page.cursor || null }));
      } else {
        // Fallback: load all
        const msgs = await conversation.messages();
        console.log('[XMTP] 📥 Loaded all messages from conversation (fallback):', {
          messageCount: msgs?.length || 0
        });
        safeSetMessages(conversationId, msgs);
        setMessageCursors(cursors => ({ ...cursors, [conversationId]: null }));
      }
    } catch (err) {
      console.error('[XMTP] ❌ Failed to load messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }

  // Load more messages (older) for a conversation
  const loadMoreMessages = async (conversationId: string) => {
    await loadMessages(conversationId, true);
  };

  const initializeClient = async () => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }

    // Prevent multiple initializations with better checks
    if (clientRef.current || isInitializing || isInitialized) {
      console.log('🔄 XMTP client already exists, initialized, or initializing - skipping duplicate initialization');
      if (clientRef.current && isInitialized) {
        console.log('✅ XMTP client is already ready for use');
      }
      return;
    }
    
    console.log('🚀 Starting XMTP initialization (first time or after reset)...');

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP...');

      // Dev-friendly state clearing via query param
      if (import.meta.env.DEV && window.location.search.includes('clearXMTP')) {
        indexedDB.deleteDatabase('xmtp-encrypted-store');
        console.log('[DEV] XMTP IndexedDB cleared via query param');
      }

      // NEW: Check for force refresh parameter
      if (import.meta.env.DEV && window.location.search.includes('forceSignature')) {
        console.log('[DEV] Force signature mode detected - clearing XMTP identity...');
        try {
          const { clearXMTPIdentity } = await import('../utils/xmtpSigner');
          await clearXMTPIdentity();
          console.log('[DEV] XMTP identity cleared for fresh signature');
        } catch (error) {
          console.warn('[DEV] Failed to clear XMTP identity:', error);
        }
      }

      console.log('🚀 Starting XMTP V3 initialization...');
      
      // Log wallet client details for debugging
      console.log('🔍 Wallet client details:', {
        address: walletClient.account?.address,
        chainId: walletClient.chain?.id,
        chainName: walletClient.chain?.name,
        transport: walletClient.transport?.type
      });
      
      // Check if wallet is on the correct network (Base)
      const baseChainId = 8453; // Base mainnet
      console.log('🔍 Current chain ID:', walletClient.chain?.id, 'Expected:', baseChainId);
      
      if (walletClient.chain?.id !== baseChainId) {
        console.log('⚠️  Wallet is not on Base chain. Current chain:', walletClient.chain?.id);
        setError('Please switch your wallet to Base network to use XMTP messaging.');
        return;
      }
      
      console.log('✅ Wallet is on Base chain, proceeding with XMTP initialization...');
      
      // Ensure wallet is ready
      if (!walletClient.account?.address) {
        setError('Wallet not fully connected. Please reconnect your wallet.');
        return;
      }
      
      console.log('✅ Wallet is ready and connected to Base');
      
      // Create XMTP-compatible signer using the existing utility
      console.log('🔧 Creating XMTP-compatible signer...');
      const signer = createAutoSigner(walletClient);
      
      console.log('🔍 Creating XMTP-compatible signer for address:', walletClient.account.address);
      console.log('✅ XMTP signer created successfully');
      
      // Enhanced client configuration for production
      const createPromise = Client.create(signer, {
        env: 'production',
        codecs: [],
        // Note: dbEncryptionKey is not used for encryption in browser environments
        loggingLevel: import.meta.env.DEV ? 'debug' : 'warn',
        performanceLogging: import.meta.env.DEV,
        structuredLogging: true,
        // historySyncUrl can be overridden if needed
        // historySyncUrl: 'https://prod.protocol.xmtp.network/history/v2',
      });
      
      console.log('✅ Client.create() promise created, waiting for signature...');
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('XMTP client creation timed out after 120 seconds.')), 120000)
      );
      
      console.log('🏁 Starting Promise.race between Client.create() and timeout...');
      
      const xmtpClient = await Promise.race([createPromise, timeoutPromise]) as Client;
      
      console.log('🎉 XMTP V3 client created successfully!');
      console.log('✅ Client created, inbox is ready!');
      console.log('📧 Client details:', {
        inboxId: xmtpClient.inboxId,
        accountAddress: (xmtpClient as any).accountAddress || 'unknown',
        isRegistered: xmtpClient.isRegistered,
        env: 'production',
        chainId: await walletClient.getChainId?.() || 'unknown'
      });

      // CRITICAL: Enhanced connectivity debugging for message delivery
      console.log('🔍 XMTP Network Connectivity Check:');
      try {
        // Test if we can query the network
        const testRecipient = '0x742d35C6d8E7A0b4F5e1A4B9Ea2c1C3D4E5F6789'; // dummy address
        const canMessageTest = await Client.canMessage([
          { identifier: testRecipient, identifierKind: 'Ethereum' }
        ], 'production');
        console.log('✅ XMTP network connectivity test passed:', canMessageTest);
      } catch (networkError) {
        console.error('❌ XMTP network connectivity test failed:', networkError);
        console.warn('⚠️  This might affect message delivery between users');
      }
      
      // CRITICAL: Ensure client is properly connected to XMTP network
      console.log('🔍 XMTP Client Network Validation:', {
        canMessage: typeof xmtpClient.canMessage === 'function',
        conversations: typeof xmtpClient.conversations?.list === 'function',
        environment: 'production',
        timestamp: new Date().toISOString()
      });
      
      clientRef.current = xmtpClient;
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');
      
      // Lightweight initialization - defer sync to background
      setLastSyncTime(new Date());
      console.log('✅ XMTP context initialized successfully');
      
      // Perform sync in background without blocking
      setTimeout(async () => {
        try {
          console.log('[XMTP] Starting background sync...');
          const syncStartTime = Date.now();
          
          if (hasMethod<{ waitForDeviceSync: () => Promise<void> }>(xmtpClient, 'waitForDeviceSync')) {
            await xmtpClient.waitForDeviceSync();
            console.log('✅ Device sync completed');
          }
          
          // Use syncAll for comprehensive sync (conversations, messages, preferences)
          if (hasMethod<{ conversations: { syncAll: (options?: { consentState?: string }) => Promise<void> } }>(xmtpClient, 'conversations') &&
              hasMethod<{ syncAll: (options?: { consentState?: string }) => Promise<void> }>(xmtpClient.conversations, 'syncAll')) {
            try {
              await xmtpClient.conversations.syncAll({ consentState: 'allowed' });
            } catch {
              await xmtpClient.conversations.syncAll();
            }
            console.log('[XMTP] ✅ Comprehensive sync (conversations, messages, preferences) completed');
          } else if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(xmtpClient, 'conversations') &&
              hasMethod<{ sync: () => Promise<void> }>(xmtpClient.conversations, 'sync')) {
            await xmtpClient.conversations.sync();
            console.log('[XMTP] ✅ Conversation sync completed');
          }
          
          const syncDuration = Date.now() - syncStartTime;
          setLastSyncTime(new Date());
          console.log(`[XMTP] ✅ Background sync completed in ${syncDuration}ms`);
        } catch (error) {
          console.warn('[XMTP] Background sync failed (non-critical):', error);
        }
      }, 100);
      
      // NEW: Validate group membership for the current user
      try {
        console.log('🔍 Validating user group membership...');
        // Use the correct XMTP client API for groups
        if (typeof (xmtpClient as any).groups?.list === 'function') {
          const groups = await (xmtpClient as any).groups.list();
          
          for (const group of groups) {
            const validation = await validateGroupMembership(xmtpClient, group);
            console.log(`📋 Group ${group.groupId} validation:`, validation);
          }
        } else {
          console.log('📋 Groups API not available in this XMTP client version');
        }
      } catch (error) {
        console.warn('⚠️ Group membership validation failed (non-critical):', error);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ XMTP initialization failed:', err);
      setError(errorMessage);
      setStatus('Initialization failed');
      clientRef.current = null;
    } finally {
      setIsInitializing(false);
    }
  };


  // Conversation selection with improved stream management
  const selectConversation = async (conversation: XMTPConversation) => {
    if (!client) {
      setError('XMTP not initialized');
      setIsLoading(false);
      return;
    }
    
    // Prevent multiple simultaneous selections
    if (isLoading) {
      console.log('[XMTP] 🔄 Conversation selection already in progress, skipping');
      return;
    }
    
    try {
      console.log('[XMTP] 🔄 Selecting conversation:', {
        id: conversation.id,
        type: 'members' in conversation ? 'group' : 'dm',
        hasMembers: 'members' in conversation
      });
      
      setIsLoading(true);
      setStatus('Loading messages...');
      console.log('[XMTP] ✅ Set loading state to true, starting message load...');
      
      // Close previous streams first with proper cleanup
      if (conversationStreams.current.size > 0) {
        console.log('[XMTP] 🧹 Cleaning up previous streams before selection');
        const streamsToClose = Array.from(conversationStreams.current.entries());
        conversationStreams.current.clear();
        
        // Close streams synchronously to ensure cleanup before new setup
        for (const [streamId, stream] of streamsToClose) {
          try {
            if (isAsyncIterator(stream) && typeof stream.return === 'function') {
              await stream.return();
              console.log(`[XMTP] ✅ Closed stream: ${streamId}`);
            }
          } catch (error) {
            console.warn(`[XMTP] ⚠️ Error closing stream ${streamId}:`, error);
          }
        }
        
        // Add small delay to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Now set the selected conversation
      setSelectedConversation(conversation);

      // Load initial messages
      console.log('[XMTP] 🔄 Starting loadMessages for conversation:', conversation.id);
      await loadMessages(conversation.id, false, conversation);
      console.log('[XMTP] ✅ Completed loadMessages for conversation:', conversation.id);
      
      // Set up new message streaming only for the selected conversation
      console.log('[XMTP] 🔄 Setting up message streaming for conversation:', conversation.id);
      
      const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
        if (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes('Stream') && !errorMessage.includes('not found')) {
            console.error('Error in message stream:', err);
          }
          return;
        }
        if (message) {
          safeSetMessages(conversation.id, (prev: DecodedMessage<string>[]) => {
            // Deduplicate by message ID
            const newMessages = prev.filter((m): m is DecodedMessage<string> => 
              typeof m === 'object' && m !== null && m.id !== message.id
            );
            return [...newMessages, message];
          });
          
          // Update unread conversations only if this isn't the currently selected conversation
          setUnreadConversations(prev => {
            if (selectedConversation && conversation.id === selectedConversation.id) return prev;
            const next = new Set(prev);
            next.add(conversation.id);
            return next;
          });
        }
      };

      // Only create one stream for the selected conversation
      if (hasMethod<{ streamMessages: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'streamMessages')) {
        const stream = await conversation.streamMessages(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
        console.log('[XMTP] ✅ Started streamMessages for conversation:', conversation.id);
      } else if (hasMethod<{ stream: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'stream')) {
        const stream = await conversation.stream(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
        console.log('[XMTP] ✅ Started stream for conversation:', conversation.id);
      } else {
        console.log('[XMTP] ⚠️ No streaming method available for conversation:', (conversation as any).id);
      }
      
      // Clear unread status for this conversation
      setUnreadConversations(prev => {
        const next = new Set(prev);
        next.delete(conversation.id);
        return next;
      });

      setStatus('Ready');
      setIsLoading(false);
      console.log('[XMTP] ✅ Conversation selection completed, loading state cleared');
    } catch (err) {
      console.error('[XMTP] ❌ Failed to select conversation:', err);
      setError('Failed to load conversation');
      setIsLoading(false);
      setSelectedConversation(null); // Clear selection on error
      console.log('[XMTP] ✅ Loading state cleared after error');
    }
  };

  const sendMessage = async (message: string, targetConversation?: XMTPConversation, onSuccess?: () => void) => {
    if (!client) {
      setError('XMTP not initialized');
      return;
    }
    const conversation = targetConversation || selectedConversation;
    if (!conversation) {
      setError('No conversation selected');
      return;
    }
    
    console.log('[XMTP] 📤 SENDING MESSAGE - Detailed Analysis:', {
      messageLength: message.length,
      conversationId: conversation.id,
      conversationType: 'peerAddress' in conversation ? 'DM' : 'Group',
      peerAddress: 'peerAddress' in conversation ? conversation.peerAddress : undefined,
      clientConnected: !!client,
      environment: 'production',
      clientInboxId: client.inboxId,
      senderAddress: address,
      messagingAllowed: !!conversation.send,
      timestamp: new Date().toISOString()
    });

    // CRITICAL: Pre-send validation for message delivery
    if ('peerAddress' in conversation && conversation.peerAddress) {
      console.log('[XMTP] 🔍 Pre-send recipient validation:', {
        recipient: conversation.peerAddress,
        checking: 'canMessage status'
      });
      
      try {
        const canMessageCheck = await Client.canMessage([
          { identifier: conversation.peerAddress as string, identifierKind: 'Ethereum' as const }
        ], 'production' as const);
        console.log('[XMTP] ✅ Recipient can receive messages:', canMessageCheck);
        
        if (!canMessageCheck || (Array.isArray(canMessageCheck) && !canMessageCheck[0])) {
          console.error('[XMTP] ❌ CRITICAL: Recipient cannot receive messages!');
          setError('Recipient is not available to receive messages on XMTP');
          return;
        }
      } catch (canMessageError) {
        console.error('[XMTP] ❌ Failed to verify recipient capability:', canMessageError);
        console.warn('[XMTP] ⚠️  Proceeding with send attempt despite verification failure');
      }
    }
    // Create optimistic message as a plain object (not DecodedMessage instance)
    const optimisticMsg = {
      id: `pending-${Date.now()}`,
      content: message,
      sentAtNs: BigInt(Date.now() * 1e6),
      contentType: { authorityId: '', typeId: '', versionMajor: 1, versionMinor: 0, sameAs: () => false },
      conversationId: conversation.id,
      status: 'pending',
    } as any;
    safeSetMessages(conversation.id, prev => [...prev, optimisticMsg]);
    try {
      setStatus('Preparing to send...');
      const sentMsg = await conversation.send(message);
      
      console.log('[XMTP] Message sent successfully');
      console.log('[XMTP] Sent message details:', {
        messageId: typeof sentMsg === 'object' && sentMsg ? (sentMsg as any).id : 'unknown',
        conversationId: conversation.id,
        timestamp: new Date().toISOString()
      });
      
      // Mark optimistic message as sent but keep it until stream delivers the real one
      safeSetMessages(conversation.id, prev => {
        return prev.map(m => 
          m.id === optimisticMsg.id 
            ? { ...m, status: 'sent' } as any
            : m
        );
      });
      
      // Set timeout to remove optimistic message if stream doesn't deliver in 10 seconds
      setTimeout(() => {
        safeSetMessages(conversation.id, prev => {
          const hasRealMessage = prev.some(m => 
            m.id !== optimisticMsg.id && 
            m.content === message && 
            Math.abs(Number(m.sentAtNs) - Number(optimisticMsg.sentAtNs)) < 30000000000 // 30 seconds in ns
          );
          
          if (hasRealMessage) {
            console.log('[XMTP] Real message delivered via stream, removing optimistic message');
            return prev.filter(m => m.id !== optimisticMsg.id);
          } else {
            console.log('[XMTP] Stream delivery timeout, keeping optimistic message');
            return prev;
          }
        });
      }, 10000);
      
      setStatus('Message sent');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('[XMTP] Failed to send message:', error);
      
      // Check if this is actually a sync message disguised as an error
      const errorMessage = error instanceof Error ? error.message : String(error);
      // const errorStack = error instanceof Error ? error.stack : '';
      
      // Enhanced sync message detection patterns including WASM
      const isWasmSuccessMessage = 
        (errorMessage.includes('wasm') && (errorMessage.includes('succeeded') || errorMessage.includes('completed'))) ||
        (errorMessage.includes('WebAssembly') && errorMessage.includes('success')) ||
        /wasm.*sync.*complete/i.test(errorMessage) ||
        /wasm.*operation.*finished/i.test(errorMessage) ||
        /bindings_wasm.*succeeded/i.test(errorMessage) ||
        // Common WASM patterns that appear in XMTP console errors
        (errorMessage.includes('synced') && errorMessage.includes('messages') && errorMessage.includes('succeeded'));
        
      const isSyncMessage = 
        (errorMessage.includes('synced') && errorMessage.includes('succeeded')) ||
        (errorMessage.includes('sync') && errorMessage.includes('success')) ||
        (errorMessage.includes('message') && errorMessage.includes('delivered')) ||
        (errorMessage.includes('published') && errorMessage.includes('network')) ||
        (errorMessage.includes('conversation') && errorMessage.includes('updated')) ||
        // Pattern for XMTP V3 sync notifications that look like errors
        errorMessage.includes('SyncGroup') ||
        errorMessage.includes('ConversationSync') ||
        // Common XMTP success patterns that throw as "errors"
        /message.*sent.*successfully/i.test(errorMessage) ||
        /sync.*completed/i.test(errorMessage) ||
        /delivery.*confirmed/i.test(errorMessage) ||
        // WASM success patterns
        isWasmSuccessMessage;
      
      if (isSyncMessage) {
        console.log('[XMTP] 🔄 Received sync message as error, treating as success:', errorMessage);
        // Mark optimistic message as sent since this is actually a sync status, not a failure
        safeSetMessages(conversation.id, prev => {
          return prev.map(m => 
            m.id === optimisticMsg.id 
              ? { ...m, status: 'sent' } as any
              : m
          );
        });
        setStatus('Message sent');
        if (onSuccess) onSuccess();
      } else {
        // This is a real failure
        console.error('[XMTP] ❌ Actual send failure:', error);
        safeSetMessages(conversation.id, prev => 
          prev.map(m => m.id === optimisticMsg.id ? { ...m, status: 'failed' } as any : m)
        );
        setError('Failed to send message. Please try again.');
        throw error; // Re-throw for DMChat to handle
      }
    }
  };

  const createConversation = async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) {
      setError('XMTP not initialized');
      return null;
    }
    if (!isValidEthAddress(recipientAddress)) {
      setError('Invalid Ethereum address. Please enter a valid 0x... address.');
      return null;
    }

    // Normalize recipient address for canMessage and conversation creation
    const normalizedRecipient = normalizeIdentifier(recipientAddress, 'Ethereum');

    try {
      setStatus('Creating conversation...');
      // Check if recipient is registered on XMTP
      console.log(`[XMTP] Checking if ${normalizedRecipient} is registered on XMTP...`);
      const canMessageResult = await Client.canMessage([
        { identifier: normalizedRecipient, identifierKind: 'Ethereum' }
      ], 'production');
      const canMessage = Array.isArray(canMessageResult) ? canMessageResult[0] : !!canMessageResult;
      console.log(`[XMTP] Can message recipient (${normalizedRecipient})? ${canMessage}`);
      if (!canMessage) {
        setError('Recipient is not registered on XMTP. They need to initialize XMTP first.');
        return null;
      }
      
      // Try to get the inboxId for the recipient first (V3 pattern)
      let conversation;
      try {
        // First try to find existing conversation by address
        let existingConversations;
        // Load conversations without consent filtering for simplicity
        existingConversations = await client.conversations.list();
        
        console.log(`[XMTP] 🔍 Looking for existing conversation with ${normalizedRecipient}:`, {
          totalConversations: existingConversations.length,
          conversationTypes: existingConversations.map(c => ({
            id: c.id,
            type: 'peerAddress' in c ? 'DM' : 'Group',
            peer: 'peerAddress' in c ? c.peerAddress : 'N/A'
          }))
        });
        
        const existing = existingConversations.find(conv => {
          // Check if this conversation involves the recipient
          // Handle both DM and Group types
          if ('peerAddress' in conv && conv.peerAddress && typeof conv.peerAddress === 'string') {
            const match = conv.peerAddress.toLowerCase() === normalizedRecipient.toLowerCase();
            if (match) {
              console.log(`[XMTP] ✅ Found existing conversation:`, {
                conversationId: conv.id,
                peerAddress: conv.peerAddress
              });
            }
            return match;
          }
          return false;
        });
        
        if (existing) {
          console.log(`[XMTP] Found existing conversation with: ${normalizedRecipient}`);
          await selectConversation(existing as XMTPConversation);
          setStatus('Conversation selected');
          return existing as XMTPConversation;
        }
        
        // OFFICIAL XMTP PATTERN: Use newDm() with inboxId (from quickstart guide)
        console.log(`[XMTP] 🔍 OFFICIAL PATTERN: Creating DM conversation for address: ${normalizedRecipient}`);
        
        // Step 1: Get recipient's inboxId from canMessage result
        let recipientInboxId: string | undefined;
        try {
          // The canMessage result should contain the inboxId
          const canMessageResult = await Client.canMessage([
            { identifier: normalizedRecipient, identifierKind: 'Ethereum' }
          ], 'production');
          
          console.log('[XMTP] 📋 canMessage detailed result:', canMessageResult);
          
          // Extract inboxId from canMessage result 
          if (Array.isArray(canMessageResult) && canMessageResult[0]) {
            // Try to get inboxId from the result object
            const resultObj = canMessageResult[0];
            if (typeof resultObj === 'object' && 'inboxId' in resultObj) {
              recipientInboxId = (resultObj as any).inboxId;
              console.log(`[XMTP] ✅ Extracted inboxId from canMessage: ${recipientInboxId}`);
            }
          }
          
          // Fallback: try static method to get inboxId
          if (!recipientInboxId) {
            console.log('[XMTP] 🔄 Attempting to resolve inboxId using Client static methods...');
            // Try various possible static methods
            if (hasMethod<{ getInboxIdForAddress: (address: string) => Promise<string> }>(Client, 'getInboxIdForAddress')) {
              recipientInboxId = await (Client as any).getInboxIdForAddress(normalizedRecipient);
            } else if (hasMethod<{ inboxIdFromAddress: (address: string) => Promise<string> }>(Client, 'inboxIdFromAddress')) {
              recipientInboxId = await (Client as any).inboxIdFromAddress(normalizedRecipient);
            }
          }
          
        } catch (inboxIdError) {
          console.warn('[XMTP] ⚠️ Failed to resolve inboxId:', inboxIdError);
        }
        
        // Step 2: Create DM using official newDm() method
        if (hasMethod<{ newDm: (inboxId: string) => Promise<unknown> }>(client.conversations, 'newDm')) {
          if (recipientInboxId) {
            console.log(`[XMTP] 🚀 Creating DM with inboxId: ${recipientInboxId}`);
            conversation = await (client.conversations as any).newDm(recipientInboxId);
          } else {
            // Try with address as fallback (some V3 versions might accept it)
            console.log(`[XMTP] 🔄 Fallback: Creating DM with address: ${normalizedRecipient}`);
            conversation = await (client.conversations as any).newDm(normalizedRecipient);
          }
          
          console.log(`[XMTP] ✅ OFFICIAL: Created DM conversation using newDm():`, {
            recipientAddress: normalizedRecipient,
            recipientInboxId: recipientInboxId || 'unknown',
            conversationId: conversation?.id,
            senderInboxId: client.inboxId,
            method: 'newDm (official)',
            success: !!conversation?.id
          });
        } else if (hasMethod<{ findOrCreateDm: (recipientInboxIdOrAddress: string) => Promise<unknown> }>(client.conversations, 'findOrCreateDm')) {
          // Fallback to findOrCreateDm if newDm is not available
          const targetId = recipientInboxId || normalizedRecipient;
          conversation = await (client.conversations as any).findOrCreateDm(targetId);
          console.log(`[XMTP] ✅ FALLBACK: Created DM using findOrCreateDm with: ${targetId}`);
        } else if (hasMethod<{ newDmWithIdentifier: (opts: { identifier: string, identifierKind: string }) => Promise<unknown> }>(client.conversations, 'newDmWithIdentifier')) {
          conversation = await (client.conversations as any).newDmWithIdentifier({
            identifier: normalizedRecipient,
            identifierKind: 'Ethereum',
          });
          console.log(`[XMTP] Created new DM conversation using newDmWithIdentifier with: ${normalizedRecipient}`);
        } else if (hasMethod<{ newDm: (addr: string) => Promise<unknown> }>(client.conversations, 'newDm')) {
          conversation = await (client.conversations as any).newDm(normalizedRecipient);
          console.log(`[XMTP] Created new DM conversation using newDm with: ${normalizedRecipient}`);
        } else if (hasMethod<{ newConversation: (addr: string) => Promise<unknown> }>(client.conversations, 'newConversation')) {
          conversation = await (client.conversations as any).newConversation(normalizedRecipient);
          console.log(`[XMTP] Created new DM conversation using newConversation with: ${normalizedRecipient}`);
        } else {
          setError('No valid method found to create DM conversation');
          return null;
        }
      } catch (creationError) {
        console.error('[XMTP] Failed to create conversation:', creationError);
        setError('Failed to create conversation. The recipient may not be reachable on XMTP V3.');
        return null;
      }
      
      // Add conversation to state and ensure it's immediately available
      const newConversation = conversation as XMTPConversation;
      
      // CRITICAL FIX: Track this as recently created with persistent storage
      const creationTimestamp = Date.now();
      setRecentlyCreatedConversationIds(prev => {
        const newSet = new Set(prev);
        newSet.add(newConversation.id);
        console.log('[XMTP] 🔄 Added to recently created:', newConversation.id);
        
        // Save to localStorage with timestamp for persistence
        if (address) {
          const recentlyCreatedData = {
            conversationIds: Array.from(newSet),
            timestamps: {
              ...JSON.parse(localStorage.getItem(`xmtp-recently-created-${address.toLowerCase()}`) || '{}').timestamps || {},
              [newConversation.id]: creationTimestamp
            }
          };
          localStorage.setItem(`xmtp-recently-created-${address.toLowerCase()}`, JSON.stringify(recentlyCreatedData));
          console.log('[XMTP] 💾 Saved recently created to localStorage:', newConversation.id);
        }
        
        return newSet;
      });
      
      // Clear from recently created after 24 hours (much longer protection)
      setTimeout(() => {
        setRecentlyCreatedConversationIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(newConversation.id);
          
          // Also remove from localStorage
          if (address) {
            const stored = JSON.parse(localStorage.getItem(`xmtp-recently-created-${address.toLowerCase()}`) || '{}');
            const updatedIds = (stored.conversationIds || []).filter((id: string) => id !== newConversation.id);
            const updatedTimestamps = { ...stored.timestamps };
            delete updatedTimestamps[newConversation.id];
            
            if (updatedIds.length > 0) {
              localStorage.setItem(`xmtp-recently-created-${address.toLowerCase()}`, JSON.stringify({
                conversationIds: updatedIds,
                timestamps: updatedTimestamps
              }));
            } else {
              localStorage.removeItem(`xmtp-recently-created-${address.toLowerCase()}`);
            }
          }
          
          console.log('[XMTP] 🔄 Removed from recently created after 24 hours:', newConversation.id);
          return newSet;
        });
      }, 86400000); // 24 hours = 86400000ms
      
      console.log('[XMTP] 🔧 DEBUG: About to add new conversation to state:', {
        conversationId: newConversation.id,
        currentCount: conversations.length,
        newConversation: {
          id: newConversation.id,
          peerAddress: 'peerAddress' in newConversation ? newConversation.peerAddress : 'N/A'
        }
      });
      
      safeSetConversations(prev => {
        // Check if conversation already exists to avoid duplicates
        const existing = prev?.find(c => c.id === newConversation.id);
        if (existing) {
          console.log('[XMTP] ⚠️ Conversation already exists in state, ensuring it\'s visible');
          // If it exists but might be filtered out, make sure it's in the visible list
          const isVisible = prev.some(c => c.id === newConversation.id);
          if (isVisible) {
            return prev;
          } else {
            // Re-add the conversation to ensure visibility
            const updated = [...(prev || []), newConversation];
            console.log('[XMTP] ✅ Re-added existing conversation to ensure visibility:', newConversation.id);
            return updated;
          }
        }
        
        const updated = [...(prev || []), newConversation];
        console.log('[XMTP] ✅ Added new conversation to state:', {
          previousCount: prev?.length || 0,
          newCount: updated.length,
          newConversationId: newConversation.id
        });
        
        // Immediately save to cache to ensure persistence
        if (address) {
          try {
            localStorage.setItem(`xmtp-conversations-${address}`, JSON.stringify(updated, jsonBigIntReplacer));
            console.log('[XMTP] 💾 Immediately saved updated conversations to cache');
          } catch (error) {
            console.error('[XMTP] Failed to immediately save conversations:', error);
          }
        }
        
        return updated;
      });
      
      // OFFICIAL XMTP PATTERN: Publish messages to network for receiver visibility
      console.log('[XMTP] 🔄 OFFICIAL: Publishing conversation to network for receiver visibility...');
      
      try {
        // Step 1: Publish messages to network (critical for receiver visibility)
        if (hasMethod<{ publishMessages: () => Promise<void> }>(newConversation, 'publishMessages')) {
          await (newConversation as any).publishMessages();
          console.log('[XMTP] ✅ OFFICIAL: Published conversation messages to network');
        } else if (hasMethod<{ publish: () => Promise<void> }>(newConversation, 'publish')) {
          await (newConversation as any).publish();
          console.log('[XMTP] ✅ OFFICIAL: Published conversation to network');
        }
        
        // Step 2: Force immediate conversation sync
        if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(client, 'conversations') &&
            hasMethod<{ sync: () => Promise<void> }>(client.conversations, 'sync')) {
          await client.conversations.sync();
          console.log('[XMTP] ✅ Conversation sync completed');
        }
        
        // Step 3: Client database sync
        if (hasMethod<{ sync: () => Promise<void> }>(client, 'sync')) {
          await (client as any).sync();
          console.log('[XMTP] ✅ Client database sync completed');
        }
        
        // Step 4: Trigger background sync for immediate discovery
        await backgroundSyncManager();
        console.log('[XMTP] ✅ Background sync completed for receiver visibility');
        
      } catch (syncError) {
        const syncErrorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        // Enhanced sync success message detection including WASM patterns
        const isWasmSuccessMessage = 
          (syncErrorMessage.includes('wasm') && (syncErrorMessage.includes('succeeded') || syncErrorMessage.includes('completed'))) ||
          (syncErrorMessage.includes('WebAssembly') && syncErrorMessage.includes('success')) ||
          /wasm.*sync.*complete/i.test(syncErrorMessage) ||
          /wasm.*operation.*finished/i.test(syncErrorMessage) ||
          /bindings_wasm.*succeeded/i.test(syncErrorMessage);
          
        const isSyncSuccessMessage = 
          syncErrorMessage.includes('synced') ||
          syncErrorMessage.includes('success') ||
          syncErrorMessage.includes('completed') ||
          syncErrorMessage.includes('published') ||
          syncErrorMessage.includes('SyncGroup') ||
          syncErrorMessage.includes('ConversationSync') ||
          isWasmSuccessMessage;
          
        if (isSyncSuccessMessage) {
          console.log('[XMTP] ✅ Network publishing/sync status message:', syncErrorMessage);
        } else {
          console.warn('[XMTP] ⚠️ Network publishing/sync failed:', syncError);
        }
        // Still trigger background sync as fallback
        setTimeout(backgroundSyncManager, 100);
      }
      
      // Select the conversation immediately using the conversation object
      console.log('[XMTP] 🎯 Immediately selecting newly created conversation');
      setIsLoading(true); // CRITICAL FIX: Ensure loading state is set before selection
      try {
        await selectConversation(newConversation);
        console.log('[XMTP] ✅ Successfully selected newly created conversation');
      } catch (selectionError) {
        console.error('[XMTP] ❌ Failed to select newly created conversation:', selectionError);
        setIsLoading(false); // Clear loading state on selection failure
        setError('Failed to select the new conversation');
      }
      
      // CRITICAL: Force immediate UI refresh to show the conversation
      setTimeout(() => {
        console.log('[XMTP] 🔄 Forcing conversation list refresh after creation');
        safeSetConversations(prev => {
          // Ensure our conversation is still in the list
          const hasNewConvo = prev?.find(c => c.id === newConversation.id);
          if (!hasNewConvo) {
            console.log('[XMTP] ⚠️ New conversation missing from list, re-adding');
            return [...(prev || []), newConversation];
          }
          return prev;
        });
      }, 100);
      
      setStatus('Conversation created');
      return newConversation;
    } catch (err: any) {
      console.error('[XMTP] Error creating conversation:', err);
      setError('Failed to create conversation. Please check the address and try again.');
      return null;
    }
  };

  // REMOVED: forceXMTPResync function - replaced with automatic background sync system for seamless UX
  // Manual sync is no longer needed as the app now features continuous automatic synchronization
  // that runs transparently in the background every 10 seconds

  // Global message streaming for all conversations (production pattern)
  useEffect(() => {
    if (!client || globalStreamActive.current) return;
    
    let cancelled = false;
    let streamCleanupTimeout: NodeJS.Timeout;
    globalStreamActive.current = true;

    const setupGlobalStreaming = async () => {
      try {
        // Prevent duplicate streams with proper cleanup
        if (globalStreamRef.current) {
          console.log('[XMTP] ⚠️ Global stream already exists, cleaning up first');
          try {
            if (typeof globalStreamRef.current.return === 'function') {
              await globalStreamRef.current.return();
            }
          } catch (cleanupError) {
            console.warn('[XMTP] Error cleaning up existing global stream:', cleanupError);
          }
          globalStreamRef.current = null;
          // Add delay before setting up new stream
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (cancelled) return;
        
        console.log('[XMTP] 🚀 Setting up global message stream...');
        
        // Stream all messages from all conversations
        globalStreamRef.current = await client.conversations.streamAllMessages();
        
        // Process messages in async iterator pattern
        (async () => {
          try {
            for await (const message of globalStreamRef.current) {
              if (cancelled) break;
              
              if (message && message.conversationId) {
                // Message delivered via global stream
                
                safeSetMessages(message.conversationId, (prev: DecodedMessage<string>[]) => {
                  // Deduplicate by message ID but with better logging
                  const duplicate = prev.some((m: DecodedMessage<string>) => m.id === message.id);
                  if (duplicate) {
                    // Duplicate message detected, skipping
                    return prev;
                  }
                  
                  // Adding new message to conversation
                  
                  const result = [...prev, message];
                  return result.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => 
                    typeof m === 'object' && m !== null && !!m.id
                  );
                });
                
                // Update unread conversations if not currently selected
                if (!selectedConversation || message.conversationId !== selectedConversation.id) {
                  setUnreadConversations(prev => {
                    const next = new Set(prev);
                    next.add(message.conversationId);
                    return next;
                  });
                }
              }
            }
          } catch (streamError) {
            if (!cancelled) {
              const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
              if (!errorMessage.includes('Stream') && !errorMessage.includes('not found')) {
                console.error('[XMTP] Global message stream error:', streamError);
              }
            }
          }
        })();
        
        // Global message streaming started
      } catch (error) {
        if (!cancelled) {
          console.error('[XMTP] Failed to start global message stream:', error);
        }
      }
    };

    setupGlobalStreaming();

    return () => {
      cancelled = true;
      globalStreamActive.current = false;
      
      // Clear any pending cleanup
      if (streamCleanupTimeout) {
        clearTimeout(streamCleanupTimeout);
      }
      
      if (globalStreamRef.current) {
        // Async cleanup with timeout to prevent hanging
        streamCleanupTimeout = setTimeout(() => {
          try {
            if (globalStreamRef.current && typeof globalStreamRef.current.return === 'function') {
              globalStreamRef.current.return();
            }
          } catch (error) {
            console.warn('[XMTP] Error closing global stream:', error);
          } finally {
            globalStreamRef.current = null;
          }
        }, 100);
      }
    };
  }, [client, safeSetMessages, selectedConversation]);

  // Individual conversation streaming for selected conversation  
  useEffect(() => {
    if (!client || !selectedConversation) return;
    
    let cancelled = false;
    let activeStream: any = null;

    const setupStream = async () => {
      // Check if already streaming this conversation
      if (conversationStreams.current.has(selectedConversation.id)) {
        console.log('[XMTP] 🔄 Conversation already streaming:', selectedConversation.id);
        return;
      }
      
      try {
        const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
          if (cancelled) return;
          if (err) {
            console.error('Error in message stream:', err);
            return;
          }
          if (message) {
            safeSetMessages(selectedConversation.id, (prev: DecodedMessage<string>[]) => {
              // Deduplicate by message ID
              if (prev.some((m: DecodedMessage<string>) => m.id === message.id)) return prev;
              // Only return DecodedMessage<string> objects
              const result = [...prev, message];
              return result.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => typeof m === 'object' && m !== null);
            });
          }
        };
        
        if (hasMethod<{ streamMessages: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(selectedConversation, 'streamMessages')) {
          activeStream = await selectedConversation.streamMessages(messageCallback);
          conversationStreams.current.set(selectedConversation.id, activeStream);
        } else if (hasMethod<{ stream: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(selectedConversation, 'stream')) {
          activeStream = await selectedConversation.stream(messageCallback);
          conversationStreams.current.set(selectedConversation.id, activeStream);
        }
      } catch (err) {
        console.error('Failed to start message stream for conversation', selectedConversation.id, err);
      }
    };

    setupStream();

    // Cleanup on unmount or conversation change
    return () => {
      cancelled = true;
      
      if (activeStream) {
        try {
          if (isAsyncIterator(activeStream) && typeof activeStream.return === 'function') {
            (activeStream as AsyncIterableIterator<unknown>).return?.();
          }
        } catch (error) {
          console.warn('[XMTP] Error closing conversation stream:', error);
        }
      }
      
      if (selectedConversation) {
        conversationStreams.current.delete(selectedConversation.id);
      }
    };
  }, [client, selectedConversation, safeSetMessages]);

  // Reset state when address changes (only on actual address change, not deletion)
  const prevAddressRef = useRef<string | undefined>();
  useEffect(() => {
    if (address && prevAddressRef.current !== address) {
      console.log('[XMTP] 🔄 Address changed from', prevAddressRef.current, 'to', address, '- resetting XMTP state');
      
      setClient(null);
      setIsInitialized(false);
      safeSetConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setError(null);
      setLastSyncTime(null);
      setDeletedConversationIds(new Set());
      setConversationPreviews({});
      setUnreadConversations(new Set());
      // Cleanup streams
      conversationStreams.current.forEach((stream) => {
        try {
          if (stream && isAsyncIterator(stream) && typeof stream.return === 'function') {
            (stream as AsyncIterableIterator<unknown>).return?.();
          }
        } catch (error) {
          console.warn('[XMTP] Error closing conversation stream:', error);
        }
      });
      conversationStreams.current.clear();
      
      // Cleanup global stream
      if (globalStreamRef.current) {
        try {
          if (typeof globalStreamRef.current.return === 'function') {
            globalStreamRef.current.return();
          }
        } catch (error) {
          console.warn('[XMTP] Error closing global stream:', error);
        }
        globalStreamRef.current = null;
      }
      globalStreamActive.current = false;
      
      clientRef.current = null;
      
      // Update previous address for next comparison
      prevAddressRef.current = address;
    } else if (!address && prevAddressRef.current) {
      console.log('[XMTP] 🔌 Wallet disconnected - keeping XMTP state intact');
      prevAddressRef.current = undefined;
    }
  }, [address, safeSetConversations]);

  // Enhanced delete single conversation
  const deleteConversation = useCallback((conversationId: string) => {
    // Remove from UI state
    safeSetConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // Clear messages - ensure we maintain DecodedMessage<string>[] type
    setMessages(prev => {
      const newMsgs: { [convId: string]: DecodedMessage<string>[] } = { ...prev };
      delete newMsgs[conversationId];
      return newMsgs;
    });

    // Clear from localStorage (wallet-specific)
    if (address) {
      localStorage.removeItem(`xmtp-messages-${address}-${conversationId}`);
    }
    
    // Add to deleted set to prevent reappearing and save to localStorage
    setDeletedConversationIds(prev => {
      const newSet = new Set([...prev, conversationId]);
      
      // CRITICAL: Save to localStorage for persistence across wallet switches
      if (address) {
        const storageKey = `xmtp-deleted-conversations-${address.toLowerCase()}`;
        localStorage.setItem(storageKey, JSON.stringify([...newSet]));
        console.log('[DEBUG] Saved deleted conversation to localStorage for wallet:', address.toLowerCase());
      }
      
      return newSet;
    });
    
    // CRITICAL: Remove from recently created if it exists there
    setRecentlyCreatedConversationIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(conversationId);
      return newSet;
    });
    
    // Track user-initiated deletion to prevent emergency fix
    setLastUserDeletionTime(Date.now());
    
    // Clear selected conversation if it was deleted
    setSelectedConversation(prev => prev?.id === conversationId ? null : prev);
    
    // Clear conversation previews
    setConversationPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[conversationId];
      return newPreviews;
    });
  }, [address, safeSetConversations]);

  // Enhanced delete multiple conversations
  const deleteConversations = useCallback((conversationIds: string[]) => {
    // Remove from UI state
    safeSetConversations(prev => prev.filter(c => !conversationIds.includes(c.id)));
    
    // Clear messages - ensure we maintain DecodedMessage<string>[] type
    setMessages(prev => {
      const newMsgs: { [convId: string]: DecodedMessage<string>[] } = { ...prev };
      conversationIds.forEach(id => { delete newMsgs[id]; });
      return newMsgs;
    });
    
    // Clear from localStorage (wallet-specific)
    if (address) {
      conversationIds.forEach(id => localStorage.removeItem(`xmtp-messages-${address}-${id}`));
    }
    
    // Add all to deleted set and save to localStorage
    setDeletedConversationIds(prev => {
      const newSet = new Set([...prev, ...conversationIds]);
      
      // CRITICAL: Save to localStorage for persistence across wallet switches
      if (address) {
        const storageKey = `xmtp-deleted-conversations-${address.toLowerCase()}`;
        localStorage.setItem(storageKey, JSON.stringify([...newSet]));
        console.log('[DEBUG] Saved deleted conversations to localStorage for wallet:', address.toLowerCase());
      }
      
      return newSet;
    });
    
    // CRITICAL: Remove from recently created if any exist there
    setRecentlyCreatedConversationIds(prev => {
      const newSet = new Set(prev);
      conversationIds.forEach(id => newSet.delete(id));
      return newSet;
    });
    
    // Track user-initiated deletion to prevent emergency fix
    setLastUserDeletionTime(Date.now());
    
    // Clear selected conversation if it was in deleted set
    setSelectedConversation(prev => (prev && conversationIds.includes(prev.id) ? null : prev));
    
    // If all conversations were deleted, log this as normal behavior
    const remainingConversations = conversations?.filter(c => !conversationIds.includes(c.id)) || [];
    if (remainingConversations.length === 0 && conversationIds.length > 0) {
      console.log(`[XMTP] 🧹 All conversations deleted by user - empty state is expected`);
    }
    
    // Clear conversation previews
    setConversationPreviews(prev => {
      const newPreviews = { ...prev };
      conversationIds.forEach(id => { delete newPreviews[id]; });
      return newPreviews;
    });
  }, [address, safeSetConversations]);

  // Reconnect function
  const reconnect = useCallback(async () => {
    if (!isOnline) {
      setError('No internet connection. Please check your network.');
      return;
    }
    
    try {
      setError(null);
      if (client) {
        await loadConversations();
        if (selectedConversation) {
          await loadMessages(selectedConversation.id);
        }
      } else {
        await initializeClient();
      }
    } catch (error) {
      console.error('Reconnection failed:', error);
      setError('Failed to reconnect. Please try again.');
    }
  }, [isOnline, client, selectedConversation, loadConversations, loadMessages, initializeClient]);

  // Conversation helper methods (following XMTP V3 spec)
  const getConversationById = useCallback((conversationId: string): XMTPConversation | null => {
    return conversations?.find(c => c.id === conversationId) || null;
  }, [conversations]);

  const getConversationByPeerAddress = useCallback((peerAddress: string): XMTPConversation | null => {
    const normalizedAddress = peerAddress.toLowerCase();
    return conversations?.find(c => {
      if ('peerAddress' in c && c.peerAddress && typeof c.peerAddress === 'string') {
        return c.peerAddress.toLowerCase() === normalizedAddress;
      }
      return false;
    }) || null;
  }, [conversations]);

  // REMOVED: forceConversationDiscovery function - replaced with automatic background sync system for seamless UX
  // Manual conversation discovery is no longer needed as the app now features intelligent background
  // sync that automatically discovers new conversations without user intervention

  const contextValue: XMTPContextType = {
    client: clientRef.current,
    isInitialized,
    isInitializing,
    error,
    isOnline,
    reconnect,
    status,
    conversations: conversations || [],
    selectedConversation,
    messages: messages || {},
    sendMessage,
    createConversation,
    selectConversation,
    initializeClient,
    isLoading: isInitializing,
    lastSyncTime,
    // Seamless UX features
    isAutoSyncing,
    connectionQuality,
    messageDeliveryStatus,
    // Pagination
    loadMoreConversations,
    conversationCursor,
    loadMoreMessages,
    messageCursors,
    loadMessages,
    conversationPreviews,
    unreadConversations,
    isSyncing,
    deleteConversation,
    deleteConversations,
    // Helper methods
    getConversationById,
    getConversationByPeerAddress,
  };

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
};

export const useXMTP = (): XMTPContextType => {
  const context = useContext(XMTPContext);
  if (!context) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};

export { XMTPContext }; 