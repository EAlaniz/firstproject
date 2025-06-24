import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client, Conversation, DecodedMessage, SortDirection } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { Signer } from 'ethers';

interface XMTPContextType {
  client: Client | null;
  conversations: Conversation[];
  messages: DecodedMessage[];
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
  isInitializing: boolean;
  initializeClient: (signer: Signer) => Promise<void>;
  sendMessage: (conversation: Conversation, content: string) => Promise<void>;
  createConversation: (address: string) => Promise<Conversation | null>;
  createGroupChat: (name: string, addresses: string[]) => Promise<Conversation | null>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversation: Conversation) => Promise<void>;
  subscribeToMessages: (conversation: Conversation) => void;
  unsubscribeFromMessages: (conversation: Conversation) => void;
  clearError: () => void;
}

const XMTPContext = createContext<XMTPContextType | undefined>(undefined);

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (!context) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};

interface XMTPProviderProps {
  children: React.ReactNode;
}

export const XMTPProvider: React.FC<XMTPProviderProps> = ({ children }) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [client, setClient] = useState<Client | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [messageSubscriptions, setMessageSubscriptions] = useState<Map<string, () => void>>(new Map());
  
  // Use ref to track if we've already initialized for this address
  const initializedAddressRef = useRef<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!client) return;

    try {
      setIsLoading(true);
      const convos = await client.conversations.list();
      setConversations(convos);
      console.log(`Loaded ${convos.length} conversations`);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const initializeClient = useCallback(async (signer: Signer) => {
    console.log('XMTP initializeClient called');
    
    // Prevent multiple initializations
    if (isInitializing) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    try {
      setIsInitializing(true);
      setError(null);

      console.log('Checking XMTP registration status...');
      
      // Check if user is already registered on XMTP
      if (address) {
        const canMessage = await Client.canMessage(address);
        setIsRegistered(canMessage);
        
        if (!canMessage) {
          console.log('User not registered on XMTP, creating account...');
          try {
            // Create XMTP client which will automatically register the user
            const xmtpClient = await Client.create(signer, { 
              env: 'dev',
              appVersion: '10k-app/1.0.0'
            });
            setClient(xmtpClient);
            setIsRegistered(true);
            console.log('XMTP account created successfully!');
          } catch (registrationError) {
            console.error('Error creating XMTP account:', registrationError);
            setError('Failed to create XMTP account. Please try again.');
            return;
          }
        } else {
          console.log('User already registered on XMTP, initializing...');
          const xmtpClient = await Client.create(signer, { 
            env: 'dev',
            appVersion: '10k-app/1.0.0'
          });
          setClient(xmtpClient);
          console.log('XMTP client initialized successfully!');
        }
      }
    } catch (err) {
      console.error('Error initializing XMTP client:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
    } finally {
      setIsInitializing(false);
    }
  }, [address, isInitializing]);

  const loadMessages = async (conversation: Conversation) => {
    try {
      const msgs = await conversation.messages({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
        limit: 50
      });
      setMessages(msgs.reverse()); // Show oldest first
      console.log(`Loaded ${msgs.length} messages for conversation`);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async (conversation: Conversation, content: string) => {
    if (!client) return;

    try {
      const sentMessage = await conversation.send(content);
      console.log('Message sent successfully:', sentMessage);
      
      // Add the new message to the current messages
      setMessages(prev => [...prev, sentMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const createConversation = async (address: string): Promise<Conversation | null> => {
    if (!client) return null;

    try {
      const conversation = await client.conversations.newConversation(address);
      console.log('Created new conversation with:', address);
      
      // Add to conversations list
      setConversations(prev => [...prev, conversation]);
      
      return conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  };

  const createGroupChat = async (name: string, addresses: string[]): Promise<Conversation | null> => {
    console.log('Creating group chat:', name);
    return null;
  };

  const subscribeToMessages = useCallback((conversation: Conversation) => {
    console.log('Subscribing to messages...');
  }, []);

  const unsubscribeFromMessages = useCallback((conversation: Conversation) => {
    console.log('Unsubscribing from messages...');
  }, []);

  // Simple initialization when wallet connects
  useEffect(() => {
    if (address && walletClient && !client && !isInitializing) {
      console.log('Wallet connected, initializing XMTP...');
      initializeClient(walletClient as any).catch(error => {
        console.error('Failed to initialize XMTP:', error);
      });
    }
  }, [address, walletClient, client, isInitializing, initializeClient]);

  const value: XMTPContextType = {
    client,
    conversations,
    messages,
    isLoading,
    error,
    isRegistered,
    isInitializing,
    initializeClient,
    sendMessage,
    createConversation,
    createGroupChat,
    loadConversations,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    clearError,
  };

  return (
    <XMTPContext.Provider value={value}>
      {children}
    </XMTPContext.Provider>
  );
};
