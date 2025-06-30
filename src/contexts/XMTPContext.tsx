import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';
import { validateGroupMembership } from '../utils/xmtpGroupValidation';

// Utility: Convert hex string to Uint8Array (browser-safe, no Buffer)
function hexToBytes(hex: string): Uint8Array {
  if (hex.startsWith('0x')) hex = hex.slice(2);
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

// Type guard for optional SDK methods
function hasMethod<T>(obj: unknown, method: string): obj is T {
  return typeof obj === 'object' && obj !== null && method in obj && typeof (obj as any)[method] === 'function';
}

export type XMTPConversation = Dm<string> | Group<string>;

export interface XMTPContextType {
  // Client state
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  
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
  
  // Enhanced features
  forceXMTPResync: () => Promise<void>;
  lastSyncTime: Date | null;
  
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

// Activate persistent logging for deep diagnostics (works in all environments)
if (typeof window !== 'undefined' && typeof (Client as any).activatePersistentLibXMTPLogWriter === 'function') {
  try {
    (Client as any).activatePersistentLibXMTPLogWriter();
    // You can also pass a custom log writer or options if needed
  } catch (e) {
    // Ignore if not supported
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

// Utility to strip '0x' prefix for group member addresses
function strip0x(address: string): string {
  return address.startsWith('0x') ? address.slice(2) : address;
}

// Utility: JSON replacer to serialize BigInt as string
function jsonBigIntReplacer(key: string, value: any) {
  return typeof value === 'bigint' ? value.toString() : value;
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

  // Message preview and unread state
  const [conversationPreviews, setConversationPreviews] = useState<{ [id: string]: string }>({});
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());

  // New states
  const [isSyncing, setIsSyncing] = useState(true);

  // Maintain a set of permanently deleted conversation IDs
  const [deletedConversationIds, setDeletedConversationIds] = useState<Set<string>>(new Set());

  // Safety wrapper for setConversations to prevent undefined
  const safeSetConversations = useCallback((updater: XMTPConversation[] | ((prev: XMTPConversation[]) => XMTPConversation[])) => {
    setConversations(prev => {
      const newValue = typeof updater === 'function' ? updater(prev || []) : updater;
      console.log('🔄 Setting conversations:', { count: newValue?.length || 0, isArray: Array.isArray(newValue) });
      return newValue || [];
    });
  }, []);

  // Safety wrapper for setMessages to prevent undefined
  const safeSetMessages = useCallback((convId: string, updater: DecodedMessage<string>[] | ((prev: DecodedMessage<string>[]) => DecodedMessage<string>[])) => {
    setMessages(prev => {
      const prevMsgs = prev[convId] || [];
      const newValue = typeof updater === 'function' ? updater(prevMsgs) : updater;
      return { ...prev, [convId]: newValue || [] };
    });
  }, []);

  // Load cached conversations on init
  useEffect(() => {
    const cached = localStorage.getItem('xmtp-conversations');
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
  }, [safeSetConversations]);

  // Save conversations to cache
  useEffect(() => {
    if (!conversations || !conversations.length) return;
    localStorage.setItem('xmtp-conversations', JSON.stringify(conversations));
    setIsSyncing(false);
  }, [conversations]);

  // Load cached messages for all conversations on init
  useEffect(() => {
    if (!conversations || !conversations.length) return;
    let loadedAny = false;
    const allMessages: { [convId: string]: DecodedMessage<string>[] } = {};
    conversations.forEach((conv) => {
      const cached = localStorage.getItem(`xmtp-messages-${conv.id}`);
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
  }, [conversations]);

  // Persist messages for all conversations whenever messages state changes
  useEffect(() => {
    if (!messages) return;
    Object.entries(messages).forEach(([convId, msgs]) => {
      if (Array.isArray(msgs) && msgs.length > 0) {
        try {
          // Use custom replacer to handle BigInt serialization
          localStorage.setItem(`xmtp-messages-${convId}`, JSON.stringify(msgs, jsonBigIntReplacer));
          console.log(`[XMTP] Persisted ${msgs.length} messages for conversation ${convId}`);
        } catch (error) {
          console.error(`[XMTP] Failed to persist messages for conversation ${convId}:`, error);
        }
      }
    });
    setIsSyncing(false);
  }, [messages]);

  // Save/restore selectedConversation.id
  useEffect(() => {
    if (selectedConversation) {
      localStorage.setItem('selected-convo', selectedConversation.id);
    }
  }, [selectedConversation]);
  useEffect(() => {
    const cached = localStorage.getItem('selected-convo');
    if (cached && conversations && conversations.length) {
      const match = conversations.find(c => c.id === cached);
      if (match) setSelectedConversation(match);
    }
  }, [conversations]);

  // Load deleted conversation IDs from localStorage on mount
  useEffect(() => {
    const deleted = localStorage.getItem('xmtp-deleted-conversations');
    if (deleted) {
      setDeletedConversationIds(new Set(JSON.parse(deleted)));
    }
  }, []);

  // Save deleted conversation IDs to localStorage whenever they change
  useEffect(() => {
    if (deletedConversationIds.size > 0) {
      localStorage.setItem('xmtp-deleted-conversations', JSON.stringify([...deletedConversationIds]));
    }
  }, [deletedConversationIds]);

  // Filter out deleted conversations during sync
  useEffect(() => {
    if (client && conversations.length > 0) {
      safeSetConversations(prev => prev.filter(c => !deletedConversationIds.has(c.id)));
    }
  }, [client, conversations, deletedConversationIds]);

  // Helper to get preview text for a message
  function getPreviewText(msg: any): string {
    if (!msg) return '[No messages yet]';
    if (msg.contentType?.typeId === 'image') return '[Image]';
    if (msg.contentType?.typeId === 'attachment') return '[Attachment]';
    if (typeof msg.content === 'string') return msg.content.slice(0, 70);
    return '[Unsupported]';
  }

  // Enhanced paginated conversation loading with previews
  const loadConversations = useCallback(async () => {
    if (!client) return;
    setIsLoading(true);
    setStatus('Loading conversations...');
    try {
      const convos = await client.conversations.list();
      safeSetConversations(convos as XMTPConversation[]);
      setConversationCursor(null);
      setStatus(`Ready (${convos.length} conversations)`);
      console.log('[DEBUG] Loaded conversations from network:', convos);
    } catch (err) {
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [client, safeSetConversations]);

  // Add debug log after setting conversations
  useEffect(() => {
    console.log('[DEBUG] Conversations in state after update:', conversations);
  }, [conversations]);

  // Poll conversations every 10 seconds for auto-refresh
  React.useEffect(() => {
    if (!client) return;
    const interval = setInterval(() => {
      loadConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [client, loadConversations]);

  // Load more conversations (next page)
  const loadMoreConversations = async () => {
    await loadConversations();
  };

  // Paginated message loading per conversation
  async function loadMessages(conversationId: string, append = false) {
    const conversation = conversations?.find(c => c.id === conversationId);
    if (!conversation) {
      console.warn('[XMTP] ❌ Conversation not found for loading messages:', conversationId);
      return;
    }
    
    console.log('[XMTP] 📥 Loading messages for conversation:', {
      conversationId,
      append,
      existingMessagesCount: messages[conversationId]?.length || 0
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

    // Prevent multiple initializations
    if (clientRef.current || isInitializing) {
      console.log('🔄 XMTP client already exists or initializing, skipping...');
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP...');

      // Dev-friendly state clearing via query param
      if (import.meta.env.DEV && window.location.search.includes('clearXMTP')) {
        await indexedDB.deleteDatabase('xmtp-encrypted-store');
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
      
      // --- Official Inbox App: historySyncUrl, loggingLevel, dbEncryptionKey, dbPath ---
      // TODO: If you want to use a custom dbEncryptionKey/dbPath, add them here and persist across sessions
      const historySyncUrl = 'https://prod.protocol.xmtp.network/history/v2'; // Official default, can be customized
      const createPromise = Client.create(signer, {
        env: 'production',
        codecs: [],
        historySyncUrl,
        loggingLevel: 'debug',
        // dbEncryptionKey: '...', // Uncomment and persist if you want encrypted DB
        // dbPath: '...', // Uncomment and persist if you want custom DB path
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
        env: 'production'
      });
      
      // --- Official Inbox App: Always await conversations.list() before ready ---
      setStatus('Syncing conversations...');
      await xmtpClient.conversations.list();
      setStatus('Conversations synced.');
      
      clientRef.current = xmtpClient;
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');

      // Comprehensive sync strategy
      console.log('[XMTP] Starting comprehensive sync...');
      const syncStartTime = Date.now();
      
      console.log('⏳ Waiting for device sync to complete...');
      if (hasMethod<{ waitForDeviceSync: () => Promise<void> }>(xmtpClient, 'waitForDeviceSync')) {
        await xmtpClient.waitForDeviceSync();
        console.log('✅ Device sync completed');
      }
      
      if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(xmtpClient, 'conversations') &&
          hasMethod<{ sync: () => Promise<void> }>(xmtpClient.conversations, 'sync')) {
        await xmtpClient.conversations.sync();
        console.log('[XMTP] ✅ Conversation sync completed');
      }
      
      if (hasMethod<{ messages: { sync: () => Promise<void> } }>(xmtpClient, 'messages') &&
          hasMethod<{ sync: () => Promise<void> }>(xmtpClient.messages, 'sync')) {
        await xmtpClient.messages.sync();
        console.log('[XMTP] ✅ Message sync completed');
      }
      
      const syncDuration = Date.now() - syncStartTime;
      setLastSyncTime(new Date());
      console.log(`[XMTP] ✅ Comprehensive sync completed in ${syncDuration}ms`);
      console.log('✅ XMTP context initialized successfully');
      
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

  // Mark conversation as read
  async function markConversationAsRead(conversation: any) {
    if (typeof conversation.markAsRead === 'function') {
      try { await conversation.markAsRead(); } catch {}
    }
  }

  // Update selectConversation to mark as read and clear unread
  const selectConversation = async (conversation: XMTPConversation) => {
    if (!client) {
      setError('XMTP not initialized');
      return;
    }
    try {
      console.log('[XMTP] 🔄 Selecting conversation:', {
        id: conversation.id,
        type: 'members' in conversation ? 'group' : 'dm',
        hasMembers: 'members' in conversation
      });
      
      setSelectedConversation(conversation);
      setIsLoading(true);
      setStatus('Loading messages...');

      // Load initial messages first
      await loadMessages(conversation.id, false);
      
      // Close previous stream if exists
      if (conversationStreams.current.size > 0) {
        conversationStreams.current.forEach((stream, id) => {
          if (isAsyncIterator(stream) && typeof stream.return === 'function') stream.return?.();
        });
        conversationStreams.current.clear();
      }

      // Start new stream for selected conversation
      const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
        if (err) {
          console.error('Error in message stream:', err);
          return;
        }
        if (message) {
          safeSetMessages(conversation.id, (prev: DecodedMessage<string>[]) => {
            // Deduplicate by message ID and ensure we only have DecodedMessage<string> objects
            const newMessages = prev.filter((m): m is DecodedMessage<string> => 
              typeof m === 'object' && m !== null && m.id !== message.id
            );
            return [...newMessages, message];
          });
          setUnreadConversations(prev => {
            if (selectedConversation && conversation.id === selectedConversation.id) return prev;
            const next = new Set(prev);
            next.add(conversation.id);
            return next;
          });
        }
      };

      // Set up message streaming
      if (hasMethod<{ streamMessages: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'streamMessages')) {
        const stream = await conversation.streamMessages(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
      } else if (hasMethod<{ stream: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'stream')) {
        const stream = await conversation.stream(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
      }

      setStatus('Ready');
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to select conversation:', err);
      setError('Failed to load conversation');
      setIsLoading(false);
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
      // On successful send, replace optimistic message with sentMsg
      safeSetMessages(conversation.id, prev => prev.map(m => m.id === optimisticMsg.id ? sentMsg : m));
      setStatus('Message sent');
      if (onSuccess) onSuccess();
    } catch (err) {
      // On failure, remove the optimistic message and add a failed one as a plain object
      safeSetMessages(conversation.id, prev => [
        ...prev.filter(m => typeof m === 'object' && m !== null && m.id !== optimisticMsg.id),
        { ...optimisticMsg, status: 'failed' } as DecodedMessage<string>
      ]);
      setError('Failed to send message. Please try again.');
    }
  };

  const createConversation = async (recipientAddress: string, retrying = false): Promise<XMTPConversation | null> => {
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
      // DM creation only
      let conversation;
      if (hasMethod<{ newConversation: (addr: string) => Promise<unknown> }>(client.conversations, 'newConversation')) {
        conversation = await (client.conversations as any).newConversation(normalizedRecipient);
      } else if (hasMethod<{ newDm: (addr: string) => Promise<unknown> }>(client.conversations, 'newDm')) {
        conversation = await (client.conversations as any).newDm(normalizedRecipient);
      } else if (hasMethod<{ newDmWithIdentifier: (opts: { identifier: string, identifierKind: string }) => Promise<unknown> }>(client.conversations, 'newDmWithIdentifier')) {
        conversation = await (client.conversations as any).newDmWithIdentifier({
          identifier: normalizedRecipient,
          identifierKind: 'Ethereum',
        });
      } else {
        setError('No valid method found to create DM conversation');
        return null;
      }
      console.log(`[XMTP] Created new DM conversation with: ${normalizedRecipient}`);
      safeSetConversations(prev => [...(prev || []), conversation as XMTPConversation]);
      await selectConversation(conversation as XMTPConversation);
      setStatus('Conversation created');
      return conversation as XMTPConversation;
    } catch (err: any) {
      console.error('[XMTP] Error creating conversation:', err);
      setError('Failed to create conversation. Please check the address and try again.');
      return null;
    }
  };

  const forceXMTPResync = async () => {
    if (!clientRef.current) {
      console.warn('[XMTP] No client to resync');
      return;
    }
    
    try {
      setStatus('Forcing XMTP resync...');
      console.log('[XMTP] Starting forced resync...');
      
      // Check clock first
      checkClockSkew();
      
      const syncStartTime = Date.now();
      
      // Force device sync if available
      if (hasMethod<{ waitForDeviceSync: () => Promise<void> }>(clientRef.current, 'waitForDeviceSync')) {
        await clientRef.current.waitForDeviceSync();
        console.log('[XMTP] ✅ Device sync completed');
      }
      
      // Force conversation sync if available
      if (hasMethod<{ conversations: { sync: () => Promise<void> } }>(clientRef.current, 'conversations') &&
          hasMethod<{ sync: () => Promise<void> }>(clientRef.current.conversations, 'sync')) {
        await clientRef.current.conversations.sync();
        console.log('[XMTP] ✅ Conversation sync completed');
      }
      
      // Force message sync if available
      if (hasMethod<{ messages: { sync: () => Promise<void> } }>(clientRef.current, 'messages') &&
          hasMethod<{ sync: () => Promise<void> }>(clientRef.current.messages, 'sync')) {
        await clientRef.current.messages.sync();
        console.log('[XMTP] ✅ Message sync completed');
      }
      
      // Reload conversations
      await loadConversations();
      
      const syncDuration = Date.now() - syncStartTime;
      setLastSyncTime(new Date());
      setStatus('XMTP resync completed');
      console.log(`[XMTP] ✅ Forced resync completed successfully in ${syncDuration}ms`);
    } catch (error) {
      console.error('[XMTP] Error during forced resync:', error);
      setError('Failed to resync XMTP');
      setStatus('Resync failed');
    }
  };

  // Always stream messages for all conversations in the list
  useEffect(() => {
    if (!client || !conversations || !conversations.length) return;
    // Track active streams by conversation ID
    const activeStreams = new Map<string, any>();
    let cancelled = false;

    conversations.forEach(async (conv) => {
      if (conversationStreams.current.has(conv.id)) return; // Already streaming
      try {
        const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
          if (err) {
            console.error('Error in message stream:', err);
            return;
          }
          if (message) {
            safeSetMessages(conv.id, (prev: DecodedMessage<string>[]) => {
              // Deduplicate by message ID
              if (prev.some((m: DecodedMessage<string>) => m.id === message.id)) return prev;
              // Only return DecodedMessage<string> objects
              const result = [...prev, message];
              return result.filter((m: DecodedMessage<string>): m is DecodedMessage<string> => typeof m === 'object' && m !== null);
            });
          }
        };
        if (hasMethod<{ streamMessages: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conv, 'streamMessages')) {
          const stream = await conv.streamMessages(messageCallback);
          conversationStreams.current.set(conv.id, stream);
          activeStreams.set(conv.id, stream);
        } else if (hasMethod<{ stream: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conv, 'stream')) {
          const stream = await conv.stream(messageCallback);
          conversationStreams.current.set(conv.id, stream);
          activeStreams.set(conv.id, stream);
        }
      } catch (err) {
        console.error('Failed to start message stream for conversation', conv.id, err);
      }
    });

    // Cleanup streams for conversations that are no longer present
    conversationStreams.current.forEach((stream, id) => {
      if (!conversations.find(c => c.id === id)) {
        if (stream && isAsyncIterator(stream) && typeof stream.return === 'function') {
          (stream as AsyncIterableIterator<unknown>).return?.();
        }
        conversationStreams.current.delete(id);
      }
    });

    // Cleanup all on unmount
    return () => {
      if (cancelled) return;
      cancelled = true;
      activeStreams.forEach((stream, id) => {
        if (stream && isAsyncIterator(stream) && typeof stream.return === 'function') {
          (stream as AsyncIterableIterator<unknown>).return?.();
        }
        conversationStreams.current.delete(id);
      });
    };
  }, [client, conversations, safeSetMessages]);

  // Reset state when address changes
  useEffect(() => {
    if (address) {
      setClient(null);
      setIsInitialized(false);
      safeSetConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setError(null);
      setLastSyncTime(null);
      // Cleanup streams
      conversationStreams.current.forEach((stream) => {
        if (stream && isAsyncIterator(stream) && typeof stream.return === 'function') {
          (stream as AsyncIterableIterator<unknown>).return?.();
        }
      });
      conversationStreams.current.clear();
      clientRef.current = null;
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

    // Clear from localStorage
    localStorage.removeItem(`xmtp-messages-${conversationId}`);
    
    // Add to deleted set to prevent reappearing
    setDeletedConversationIds(prev => new Set([...prev, conversationId]));
    
    // Clear selected conversation if it was deleted
    setSelectedConversation(prev => prev?.id === conversationId ? null : prev);
    
    // Clear conversation previews
    setConversationPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[conversationId];
      return newPreviews;
    });
  }, []);

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
    
    // Clear from localStorage
    conversationIds.forEach(id => localStorage.removeItem(`xmtp-messages-${id}`));
    
    // Add all to deleted set
    setDeletedConversationIds(prev => new Set([...prev, ...conversationIds]));
    
    // Clear selected conversation if it was in deleted set
    setSelectedConversation(prev => (prev && conversationIds.includes(prev.id) ? null : prev));
    
    // Clear conversation previews
    setConversationPreviews(prev => {
      const newPreviews = { ...prev };
      conversationIds.forEach(id => { delete newPreviews[id]; });
      return newPreviews;
    });
  }, []);

  const contextValue: XMTPContextType = {
    client: clientRef.current,
    isInitialized,
    isInitializing,
    error,
    status,
    conversations: conversations || [],
    selectedConversation,
    messages: messages || {},
    sendMessage,
    createConversation,
    selectConversation,
    initializeClient,
    forceXMTPResync,
    isLoading: isInitializing,
    lastSyncTime,
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