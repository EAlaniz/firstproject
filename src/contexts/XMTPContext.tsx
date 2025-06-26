import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, Conversation, DecodedMessage, Dm, Group, StreamCallback } from '@xmtp/browser-sdk';
import { initXMTP, getClient, isXMTPInitialized, getXMTPStatus } from '../xmtpClient';
import { createAutoSigner, validateSigner, getSignerInfo } from '../utils/xmtpSigner';
import { base } from 'wagmi/chains';

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
  const { address, isConnected } = useAccount();
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

  // Load conversations when client is ready
  useEffect(() => {
    if (client && isInitialized) {
      loadConversations();
    }
  }, [client, isInitialized]);

  const initializeClient = async () => {
    if (!walletClient || !address) {
      setError('Wallet not connected');
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP...');

      console.log('🚀 Starting XMTP initialization...');
      
      // Log wallet client details for debugging
      console.log('🔍 Wallet client details:', {
        address: walletClient.account?.address,
        chainId: walletClient.chain?.id,
        chainName: walletClient.chain?.name,
        transport: walletClient.transport?.type
      });
      
      // Check if wallet is on the correct network (Base)
      const baseChainId = 8453; // Base mainnet (number, not bigint)
      console.log('🔍 Current chain ID:', walletClient.chain?.id, 'Expected:', baseChainId);
      
      if (walletClient.chain?.id !== baseChainId) {
        console.log('⚠️  Wallet is not on Base chain. Current chain:', walletClient.chain?.id);
        setError('Please switch your wallet to Base network to use XMTP messaging. You can do this in your Coinbase Wallet settings.');
        return;
      }
      
      console.log('✅ Wallet is on Base chain, proceeding with XMTP initialization...');
      
      // Additional check: ensure the wallet is actually connected to Base
      console.log('🔍 Double-checking wallet connection to Base...');
      console.log('🔍 Wallet transport type:', walletClient.transport?.type);
      console.log('🔍 Wallet account:', walletClient.account);
      
      // Ensure wallet is ready
      if (!walletClient.account?.address) {
        setError('Wallet not fully connected. Please reconnect your wallet.');
        return;
      }
      
      console.log('✅ Wallet is ready and connected to Base');
      
      // ✅ FIXED: Use proper signer creation with validation
      console.log('🔧 Creating XMTP-compatible signer...');
      const signer = createAutoSigner(walletClient);
      const isValid = await validateSigner(signer);
      
      if (!isValid) {
        throw new Error('Invalid signer created');
      }

      await getSignerInfo(signer);
      
      // ✅ FIXED: Force signature prompt to wake up Coinbase Wallet before XMTP
      console.log('⏳ Requesting manual signature to wake Coinbase Wallet...');
      try {
        // Manual wakeup signature for Coinbase using window.ethereum
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
      
      // Create client with timeout wrapper
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
      
      console.log('🎉 XMTP client created successfully!');
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

  const loadConversations = async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      setStatus('Loading conversations...');
      
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
  };

  const selectConversation = async (conversation: XMTPConversation) => {
    if (!client) return;

    try {
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Load messages for the selected conversation
      const msgs = await conversation.messages();
      setMessages(msgs);
      
      console.log(`📨 Loaded ${msgs.length} messages for conversation`);
      
      // Subscribe to new messages with proper callback signature
      const messageCallback: StreamCallback<DecodedMessage<string>> = (err, message) => {
        if (err) {
          console.error('Error in message stream:', err);
          return;
        }
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      };
      
      conversation.stream(messageCallback);
      
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
      
      await conversation.send(message);
      
      // Reload messages to show the sent message
      const msgs = await conversation.messages();
      setMessages(msgs);
      
      setStatus('Message sent');
      
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
  if (context === undefined) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};

// Export the context for direct access if needed
export { XMTPContext }; 