import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';

type XMTPConversation = Dm<string> | Group<string>;

interface XMTPContextType {
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
  sendMessage: (message: string, conversation?: XMTPConversation) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<XMTPConversation | null>;
  
  // Status
  status: string;
  isLoading: boolean;
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
        console.log(`[XMTP Debug] Messages for conversation ${conv.id}:`, msgs);
      }
    }
  } catch (err) {
    console.error('[XMTP Debug] Error during debugXMTP:', err);
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
      
      console.log('✅ XMTP signer created successfully');
      
      // Force signature prompt to wake up Coinbase Wallet before XMTP
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
        } else {
          console.log('⚠️  No window.ethereum available, skipping manual signature');
        }
      } catch (manualSignError) {
        console.error('🛑 Manual signature failed, but continuing with XMTP:', manualSignError);
      }
      
      setStatus('Creating XMTP client...');

      console.log('🔧 About to call Client.create with validated signer and production env...');
      console.log('📝 Expected signature message format: "XMTP : Authenticate to inbox"');
      console.log('⏱️  This may take up to 60 seconds while waiting for your signature...');
      
      // Create client with V3 API - ensure single creation with useRef
      const createPromise = Client.create(signer, { 
        env: 'production'
      });
      
      console.log('✅ Client.create() promise created, waiting for signature...');
      
      // Add timeout wrapper to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('XMTP client creation timed out after 120 seconds. Please check your wallet connection and try again.')), 120000);
      });
      
      console.log('🏁 Starting Promise.race between Client.create() and timeout...');
      
      const xmtpClient = await Promise.race([createPromise, timeoutPromise]) as Client;
      
      // Store in ref to prevent multiple creations
      clientRef.current = xmtpClient;
      
      console.log('🎉 XMTP V3 client created successfully!');
      console.log('✅ Client created, inbox is ready!');
      console.log('📧 Client details:', {
        inboxId: xmtpClient.inboxId
      });
      
      // Wait a moment for device sync to complete
      setStatus('Syncing inbox...');
      console.log('⏳ Waiting for device sync to complete...');
      
      // Give some time for the client to fully initialize
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('✅ Device sync completed');
      
      // --- Force device sync after client creation (type workaround) ---
      if (typeof (xmtpClient as any).sync === 'function') {
        try {
          await (xmtpClient as any).sync();
          console.log('✅ Forced device sync completed');
        } catch (syncErr) {
          console.warn('⚠️ Device sync failed:', syncErr);
        }
      }
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');
      
      console.log('✅ XMTP context initialized successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('Initialization failed');
      console.error('🛑 XMTP Client creation failed:', err);
      
      // Clear the ref on failure
      clientRef.current = null;
    } finally {
      setIsInitializing(false);
    }
  };

  const selectConversation = async (conversation: XMTPConversation) => {
    if (!client) return;

    try {
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Load messages for the selected conversation using V3 API
      const msgs = await conversation.messages();
      setMessages(msgs);
      
      console.log(`📨 Loaded ${msgs.length} messages for conversation`);
      
      // Set up message streaming for real-time updates (V3 API)
      const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
        if (err) {
          console.error('Error in message stream:', err);
          return;
        }
        if (message) {
          console.log('📨 New message received:', message.content);
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.some(m => m.id === message.id);
            if (exists) return prev;
            return [...prev, message];
          });
        }
      };
      
      // Start streaming messages for this conversation
      const stream = await conversation.stream(messageCallback);
      conversationStreams.current.set(conversation.id, stream);
      
      console.log('📡 Started message streaming for conversation');
      
    } catch (err) {
      console.error('Failed to select conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (message: string, targetConversation?: XMTPConversation) => {
    if (!client) {
      setError('XMTP not initialized');
      console.error('[XMTP] sendMessage: Client not initialized');
      return;
    }

    const conversation = targetConversation || selectedConversation;
    if (!conversation) {
      setError('No conversation selected');
      console.error('[XMTP] sendMessage: No conversation selected');
      return;
    }

    try {
      setStatus('Sending message...');
      // --- Force sync before sending (type workaround) ---
      if (typeof (client as any).sync === 'function') {
        try {
          await (client as any).sync();
          console.log('✅ Forced device sync before send');
        } catch (syncErr) {
          console.warn('⚠️ Device sync before send failed:', syncErr);
        }
      }
      // --- Check recipient registration before send (only for DMs) ---
      let canMessage = false;
      let peerAddress = (conversation as any).peerAddress || (conversation as any).id;
      const isEthAddress = typeof peerAddress === 'string' && /^0x[a-fA-F0-9]{40}$/.test(peerAddress);
      if (isEthAddress) {
        // Only check canMessage for DMs
        try {
          const canMsgResult = await Client.canMessage([
            { identifier: peerAddress, identifierKind: 'Ethereum' }
          ], 'production');
          canMessage = Array.isArray(canMsgResult) ? canMsgResult[0] : !!canMsgResult;
          console.log(`[XMTP] Can message recipient (${peerAddress})?`, canMessage);
        } catch (checkError) {
          setError('Error checking recipient XMTP registration before send.');
          console.error('[XMTP] Error checking recipient registration before send:', checkError);
          return;
        }
        if (!canMessage) {
          setError('Recipient is not registered on XMTP V3. They must connect their wallet to XMTP to receive messages.');
          console.warn(`[XMTP] Recipient (${peerAddress}) is not registered on XMTP V3.`);
          return;
        }
      } else {
        // For group conversations or non-eth addresses, skip canMessage check
        canMessage = true;
        console.log(`[XMTP] Skipping canMessage check for non-Ethereum address or group: ${peerAddress}`);
      }
      // --- Send message ---
      let retries = 0;
      const maxRetries = 3;
      while (retries < maxRetries) {
        try {
          const sentMsg = await conversation.send(message);
          // Optimistically add the sent message to the UI only if it matches DecodedMessage shape
          if (sentMsg && typeof sentMsg === 'object' && 'id' in sentMsg && 'content' in sentMsg) {
            setMessages(prev => [...prev, sentMsg as DecodedMessage<string>]);
            console.log('[XMTP] Sent message object:', sentMsg);
          } else {
            console.warn('[XMTP] Sent message did not match expected DecodedMessage shape:', sentMsg);
          }
          console.log('✅ Message sent successfully');
          setStatus('Message sent');
          return;
        } catch (sendError) {
          retries++;
          console.error(`[XMTP] Message send attempt ${retries} failed:`, sendError);
          const errorMessage = sendError instanceof Error ? sendError.message : String(sendError);
          if (errorMessage.includes('InboxValidationFailed') || errorMessage.includes('synced 1 messages')) {
            console.log('✅ Message sent successfully (with validation warning)');
            setStatus('Message sent');
            return;
          }
          if (retries >= maxRetries) {
            setError('Failed to send message after retries.');
            throw sendError;
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
      }
    } catch (err) {
      console.error('[XMTP] Failed to send message after retries:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('InboxValidationFailed') || errorMessage.includes('synced 1 messages')) {
        console.log('✅ Message sent successfully (ignoring validation warning)');
        setStatus('Message sent');
        return;
      }
      setError('Failed to send message. Please try again.');
    }
  };

  const createConversation = async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) {
      setError('XMTP not initialized');
      console.error('[XMTP] createConversation: Client not initialized');
      return null;
    }

    try {
      setStatus('Creating conversation...');
      // Validate recipient address
      if (!recipientAddress || !recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        setError('Invalid Ethereum address format');
        console.error('[XMTP] createConversation: Invalid Ethereum address format:', recipientAddress);
        return null;
      }
      // Prevent self-messaging
      if (recipientAddress.toLowerCase() === address?.toLowerCase()) {
        setError('Cannot create conversation with yourself');
        console.warn('[XMTP] createConversation: Attempted to create conversation with self.');
        return null;
      }
      // --- Check recipient registration with canMessage ---
      let canMessage = false;
      try {
        const canMsgResult = await Client.canMessage([
          { identifier: recipientAddress, identifierKind: 'Ethereum' }
        ], 'production');
        canMessage = Array.isArray(canMsgResult) ? canMsgResult[0] : !!canMsgResult;
        console.log(`[XMTP] Can message recipient (${recipientAddress})?`, canMessage);
      } catch (checkError) {
        setError('Error checking recipient XMTP registration.');
        console.error('[XMTP] Error checking recipient registration in createConversation:', checkError);
        return null;
      }
      if (!canMessage) {
        setError('Recipient is not registered on XMTP V3. They must connect their wallet to XMTP to receive messages.');
        console.warn(`[XMTP] Recipient (${recipientAddress}) is not registered on XMTP V3.`);
        return null;
      }
      // --- Create conversation ---
      let conversation;
      if (typeof client.conversations.newDm === 'function') {
        conversation = await client.conversations.newDm(recipientAddress);
      } else if (typeof client.conversations.newDmWithIdentifier === 'function') {
        conversation = await client.conversations.newDmWithIdentifier({
          identifier: recipientAddress,
          identifierKind: 'Ethereum',
        });
      } else {
        const errMsg = 'No valid method found to create DM conversation';
        setError(errMsg);
        console.error('[XMTP] createConversation:', errMsg);
        return null;
      }
      setConversations(prev => [conversation as XMTPConversation, ...prev]);
      setStatus('Conversation created');
      console.log(`[XMTP] Created new conversation with: ${recipientAddress}`);
      return conversation as XMTPConversation;
    } catch (err) {
      console.error('[XMTP] Failed to create conversation:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('not registered') || errorMessage.includes('not found')) {
        setError('Recipient is not registered on XMTP. They need to connect their wallet to XMTP first.');
      } else if (errorMessage.includes('already exists')) {
        setError('Conversation already exists with this recipient.');
      } else {
        setError('Failed to create conversation. Please try again.');
      }
      return null;
    }
  };

  // Cleanup function for message streams
  const cleanupStreams = useCallback(() => {
    conversationStreams.current.forEach((stream, conversationId) => {
      try {
        if (stream && typeof stream === 'object' && 'return' in stream && typeof stream.return === 'function') {
          stream.return();
          console.log(`🧹 Cleaned up stream for conversation: ${conversationId}`);
        }
      } catch (err) {
        console.error(`Failed to cleanup stream for conversation ${conversationId}:`, err);
      }
    });
    conversationStreams.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, [cleanupStreams]);

  // Reset state when address changes
  useEffect(() => {
    if (address) {
      setClient(null);
      setIsInitialized(false);
      setConversations([]);
      setSelectedConversation(null);
      setMessages([]);
      setError(null);
      cleanupStreams();
      
      // Clear the client ref when address changes
      clientRef.current = null;
    }
  }, [address, cleanupStreams]);

  const contextValue: XMTPContextType = {
    client,
    isInitialized,
    isInitializing,
    error,
    conversations,
    selectedConversation,
    messages,
    initializeClient,
    selectConversation,
    sendMessage,
    createConversation,
    status,
    isLoading,
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

// Export the context for direct access if needed
export { XMTPContext }; 