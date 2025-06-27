import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';

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
  messages: DecodedMessage<string>[];
  
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
  const [messages, setMessages] = useState<DecodedMessage<string>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Message streaming subscriptions
  const conversationStreams = useRef<Map<string, unknown>>(new Map());

  // Define loadConversations before useEffect to avoid TDZ
  const loadConversations = useCallback(async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      setStatus('Loading conversations...');
      
      // Use V3 API to list conversations
      const convos = await client.conversations.list();
      setConversations(convos as XMTPConversation[]);
      
      console.log(`📋 Loaded ${convos.length} conversations`);
      setStatus(`Ready (${convos.length} conversations)`);
      
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // Load conversations when client is ready
  useEffect(() => {
    if (client && isInitialized) {
      loadConversations();
    }
  }, [client, isInitialized, loadConversations]);

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
      
      // Manual signature to wake Coinbase Wallet
      console.log('⏳ Requesting manual signature to wake Coinbase Wallet...');
      try {
        if (window.ethereum) {
          await window.ethereum.request({
            method: 'personal_sign',
            params: [
              'XMTP : Authenticate to inbox',
              walletClient.account.address,
            ],
          });
          console.log('✅ Manual signature success, now starting XMTP client...');
        }
      } catch (signErr) {
        console.warn('⚠️ Manual signature failed, continuing anyway:', signErr);
      }
      
      // Create XMTP client with timeout
      console.log('🔧 About to call Client.create with validated signer and production env...');
      console.log('📝 Expected signature message format: "XMTP : Authenticate to inbox"');
      console.log('⏱️  This may take up to 60 seconds while waiting for your signature...');
      
      const createPromise = Client.create(signer, {
        env: 'production',
        codecs: [],
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

  const selectConversation = async (conversation: XMTPConversation) => {
    if (!client) {
      setError('XMTP not initialized');
      return;
    }

    try {
      setSelectedConversation(conversation);
      setMessages([]);
      setStatus('Loading messages...');

      // Load messages for the selected conversation
      const conversationMessages = await conversation.messages();
      setMessages(conversationMessages as DecodedMessage<string>[]);
      console.log(`📨 Loaded ${conversationMessages.length} messages for conversation`);

      // Start streaming messages for this conversation
      console.log('📡 Started message streaming for conversation');
      const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
        if (err) {
          console.error('Error in message stream:', err);
          return;
        }
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      };

      // Store the stream reference for cleanup
      if (hasMethod<{ streamMessages: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'streamMessages')) {
        const stream = await conversation.streamMessages(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
      } else if (hasMethod<{ stream: (cb: StreamCallback<DecodedMessage<string>>) => Promise<unknown> }>(conversation, 'stream')) {
        const stream = await conversation.stream(messageCallback);
        conversationStreams.current.set(conversation.id, stream);
      }

      setStatus('Ready');
    } catch (err) {
      console.error('Failed to select conversation:', err);
      setError('Failed to load conversation');
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
    
    try {
      setStatus('Sending message...');
      
      // Check recipient registration for DMs only
      let canMessage = false;
      let peerAddress = (conversation as any).peerAddress || (conversation as any).id;
      
      if (peerAddress && peerAddress.startsWith('0x') && peerAddress.length === 42) {
        try {
          const canMessageResult = await Client.canMessage([
            { identifier: peerAddress, identifierKind: 'Ethereum' }
          ], 'production');
          canMessage = Array.isArray(canMessageResult) ? canMessageResult[0] : !!canMessageResult;
          console.log(`[XMTP] Can message recipient (${peerAddress})? ${canMessage}`);
        } catch (checkErr) {
          console.warn('[XMTP] Error checking recipient registration before send:', checkErr);
        }
      } else {
        console.log(`[XMTP] Skipping canMessage check for non-Ethereum address or group: ${peerAddress}`);
      }
      
      let retries = 0;
      const maxRetries = 3;
      
      while (retries < maxRetries) {
        try {
          const sentMsg = await conversation.send(message);
          
          // Optimistically add the sent message to the UI
          if (sentMsg && typeof sentMsg === 'object' && 'id' in sentMsg && 'content' in sentMsg) {
            setMessages(prev => [...prev, sentMsg as DecodedMessage<string>]);
          }
          
          setStatus('Message sent');
          console.log('[XMTP] ✅ Message sent successfully');
          
          // Call success callback if provided
          if (onSuccess) {
            onSuccess();
          }
          
          return;
        } catch (sendError) {
          retries++;
          const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
          console.error(`[XMTP] Message send attempt ${retries} failed:`, sendError);
          
          // Smart retry logic with resync for InboxValidationFailed
          if (errorMessage.includes('InboxValidationFailed') && retries === maxRetries) {
            console.log('[XMTP] InboxValidationFailed detected, forcing resync and retrying...');
            await forceXMTPResync();
            retries = 0;
            continue;
          }
          
          if (retries >= maxRetries) {
            setError('Failed to send message after retries.');
            throw sendError;
          }
          
          // Exponential backoff
          const delay = 1000 * Math.pow(2, retries - 1);
          console.log(`[XMTP] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (err) {
      console.error('[XMTP] Final send error:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const createConversation = async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) {
      setError('XMTP not initialized');
      return null;
    }

    try {
      setStatus('Creating conversation...');
      
      // Check if recipient is registered on XMTP
      console.log(`[XMTP] Checking if ${recipientAddress} is registered on XMTP...`);
      const canMessageResult = await Client.canMessage([
        { identifier: recipientAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      const canMessage = Array.isArray(canMessageResult) ? canMessageResult[0] : !!canMessageResult;
      console.log(`[XMTP] Can message recipient (${recipientAddress})? ${canMessage}`);
      
      if (!canMessage) {
        setError('Recipient is not registered on XMTP. They need to initialize XMTP first.');
        return null;
      }

      // Create new conversation using type-safe method detection
      let conversation;
      if (hasMethod<{ newConversation: (addr: string) => Promise<unknown> }>(client.conversations, 'newConversation')) {
        conversation = await client.conversations.newConversation(recipientAddress);
      } else if (hasMethod<{ newDm: (addr: string) => Promise<unknown> }>(client.conversations, 'newDm')) {
        conversation = await client.conversations.newDm(recipientAddress);
      } else if (hasMethod<{ newDmWithIdentifier: (opts: { identifier: string, identifierKind: string }) => Promise<unknown> }>(client.conversations, 'newDmWithIdentifier')) {
        conversation = await (client.conversations as any).newDmWithIdentifier({
          identifier: recipientAddress,
          identifierKind: 'Ethereum',
        });
      } else {
        setError('No valid method found to create DM conversation');
        return null;
      }
      
      console.log(`[XMTP] Created new conversation with: ${recipientAddress}`);
      
      // Add to conversations list
      setConversations(prev => [...prev, conversation as XMTPConversation]);
      
      // Select the new conversation
      await selectConversation(conversation as XMTPConversation);
      
      setStatus('Conversation created');
      return conversation as XMTPConversation;
    } catch (err) {
      console.error('[XMTP] Error creating conversation:', err);
      setError('Failed to create conversation');
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

  // Cleanup streams on unmount
  useEffect(() => {
    return () => {
      conversationStreams.current.forEach((stream) => {
        if (stream && typeof (stream as any).return === 'function') {
          (stream as any).return();
        }
      });
      conversationStreams.current.clear();
    };
  }, []);

  // Reset state when address changes
  useEffect(() => {
    if (address) {
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setError(null);
      setLastSyncTime(null);
      // Cleanup streams
      conversationStreams.current.forEach((stream) => {
        if (stream && typeof (stream as any).return === 'function') {
          (stream as any).return();
        }
      });
      conversationStreams.current.clear();
      clientRef.current = null;
    }
  }, [address]);

  const contextValue: XMTPContextType = {
    client: clientRef.current,
    isInitialized,
    isInitializing,
    error,
    status,
    conversations,
    selectedConversation,
    messages,
    sendMessage,
    createConversation,
    selectConversation,
    initializeClient,
    forceXMTPResync,
    isLoading: isInitializing,
    lastSyncTime,
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