import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { createAutoSigner, validateSigner, getSignerInfo } from '../utils/xmtpSigner';

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

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  // Client state
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
      
      // Create XMTP-compatible signer
      console.log('🔧 Creating XMTP-compatible signer...');
      const signer = createAutoSigner(walletClient);
      const isValid = await validateSigner(signer);
      
      if (!isValid) {
        throw new Error('Invalid signer created');
      }

      await getSignerInfo(signer);
      
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
      
      // Create client with V3 API and proper configuration for cross-device sync
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
      
      console.log('🎉 XMTP V3 client created successfully!');
      console.log('✅ Client created, inbox is ready!');
      console.log('📧 Client details:', {
        inboxId: xmtpClient.inboxId
      });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');
      
      console.log('✅ XMTP context initialized successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setStatus('Initialization failed');
      console.error('🛑 XMTP Client creation failed:', err);
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
      return;
    }

    const conversation = targetConversation || selectedConversation;
    if (!conversation) {
      setError('No conversation selected');
      return;
    }

    try {
      setStatus('Sending message...');
      
      // Send message using V3 API
      await conversation.send(message);
      
      console.log('✅ Message sent successfully');
      setStatus('Message sent');
      
      // Note: Message will be added to the list via the stream callback
      // No need to manually reload messages
      
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    }
  };

  const createConversation = async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) {
      setError('XMTP not initialized');
      return null;
    }

    try {
      setStatus('Creating conversation...');
      
      // Use V3 API to create conversation - try different methods based on available API
      let conversation;
      if (typeof client.conversations.newDm === 'function') {
        conversation = await client.conversations.newDm(recipientAddress);
      } else if (typeof client.conversations.newDmWithIdentifier === 'function') {
        conversation = await client.conversations.newDmWithIdentifier({
          identifier: recipientAddress,
          identifierKind: 'Ethereum',
        });
      } else {
        throw new Error('No valid method found to create DM conversation');
      }
      
      console.log('✅ Created new conversation with:', recipientAddress);
      
      // Add to conversations list
      setConversations(prev => [conversation as XMTPConversation, ...prev]);
      setStatus('Conversation created');
      
      return conversation as XMTPConversation;
      
    } catch (err) {
      console.error('Failed to create conversation:', err);
      setError('Failed to create conversation');
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