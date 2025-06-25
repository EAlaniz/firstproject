import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client, Conversation, DecodedMessage, SortDirection } from '@xmtp/xmtp-js';
import { useAccount } from 'wagmi';
import { Signer, isAddress } from 'ethers';
import { ENV_CONFIG } from '../constants';

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
  // Use ref to prevent multiple simultaneous initializations
  const initializationLockRef = useRef<boolean>(false);

  const xmtpEnv = ENV_CONFIG.XMTP_ENV;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      const convos = await client.conversations.list();
      setConversations(convos);
      console.log('Loaded conversations:', convos.length);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const initializeClient = useCallback(async (signer: Signer) => {
    if (!address) {
      setError('No wallet address available');
      return;
    }

    // Prevent multiple simultaneous initializations
    if (initializationLockRef.current) {
      console.log('XMTP initialization already in progress, skipping...');
      return;
    }

    // Prevent multiple initializations for the same address
    if (initializedAddressRef.current === address) {
      console.log('Already initialized for this address');
      return;
    }

    // Set the lock
    initializationLockRef.current = true;

    const handleXMTPRegistration = async (signer: Signer) => {
      // Create XMTP client with V3-style optimizations
      try {
        const xmtpClient = await Client.create(signer, { 
          env: xmtpEnv, 
          appVersion: '10k-move-earn-connect/1.0.0' 
        });
        
        console.log('XMTP client created successfully with optimizations');
        return xmtpClient;
      } catch (error) {
        console.error('Failed to create XMTP client:', error);
        
        // Handle signature rejection specifically
        if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
          throw new Error('Signature request was rejected. Please try again to enable messaging.');
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('User denied')) {
          throw new Error('Signature request was denied. Please try again to enable messaging.');
        } else {
          throw new Error('Failed to initialize XMTP. Please try again with Coinbase Wallet.');
        }
      }
    };

    try {
      setIsInitializing(true);
      setError(null);
      console.log('Initializing XMTP client for address:', address);
      console.log('Using XMTP environment:', xmtpEnv);

      // Check if user is registered on XMTP
      const canMessage = await Client.canMessage(address, { env: xmtpEnv });
      console.log('Can message check result:', canMessage);
      
      if (!canMessage) {
        console.log('User not registered on XMTP, attempting to register...');
        setError('Registering wallet on XMTP... This may take a moment.');
        
        // Attempt to register the user on XMTP
        try {
          const xmtpClient = await handleXMTPRegistration(signer);
          
          setClient(xmtpClient);
          setIsRegistered(true);
          initializedAddressRef.current = address;
          
          console.log('XMTP client initialized and user registered successfully');
          setError(null);
          
          // Load conversations after successful initialization
          await loadConversations();
          return;
        } catch (registrationErr) {
          console.error('Error registering on XMTP:', registrationErr);
          
          // Handle signature rejection specifically
          if (registrationErr && typeof registrationErr === 'object' && 'code' in registrationErr && registrationErr.code === 4001) {
            setError('Signature request was rejected. Please try again to enable messaging.');
          } else if (registrationErr && typeof registrationErr === 'object' && 'message' in registrationErr && typeof registrationErr.message === 'string' && registrationErr.message.includes('User denied')) {
            setError('Signature request was denied. Please try again to enable messaging.');
          } else {
            const errorMessage = registrationErr instanceof Error 
              ? registrationErr.message 
              : 'Failed to register on XMTP. Please try again with Coinbase Wallet.';
            setError(errorMessage);
          }
          setIsRegistered(false);
          return;
        }
      }

      // User is already registered, create XMTP client
      console.log('User already registered, creating XMTP client...');
      const xmtpClient = await handleXMTPRegistration(signer);
      
      setClient(xmtpClient);
      setIsRegistered(true);
      initializedAddressRef.current = address;
      
      console.log('XMTP client initialized successfully for existing user');
      
      // Load conversations after successful initialization
      await loadConversations();
      
    } catch (err) {
      console.error('Error initializing XMTP client:', err);
      
      // Handle signature rejection specifically
      if (err && typeof err === 'object' && 'code' in err && err.code === 4001) {
        setError('Signature request was rejected. Please try again to enable messaging.');
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message.includes('User denied')) {
        setError('Signature request was denied. Please try again to enable messaging.');
      } else {
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Failed to initialize XMTP. Please try again.';
        setError(errorMessage);
      }
      setIsRegistered(false);
    } finally {
      setIsInitializing(false);
      // Release the initialization lock
      initializationLockRef.current = false;
    }
  }, [address, loadConversations, xmtpEnv]);

  const loadMessages = useCallback(async (conversation: Conversation) => {
    if (!conversation) return;
    
    try {
      const msgs = await conversation.messages({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
        limit: 50
      });
      setMessages(msgs.reverse()); // Show oldest first
      console.log('Loaded messages:', msgs.length);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  }, []);

  const sendMessage = useCallback(async (conversation: Conversation, content: string) => {
    if (!client || !conversation) return;

    try {
      await conversation.send(content);
      console.log('Message sent successfully');
      
      // Reload messages to show the new message
      await loadMessages(conversation);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  }, [client, loadMessages]);

  const createConversation = useCallback(async (address: string): Promise<Conversation | null> => {
    if (!client) return null;

    // Validate Ethereum address
    if (!isAddress(address)) {
      setError('Invalid Ethereum address. Please enter a valid address.');
      return null;
    }

    // Prevent self-messaging
    if (address.toLowerCase() === client.address?.toLowerCase()) {
      setError('You cannot send messages to yourself.');
      return null;
    }

    // Check if recipient is registered on XMTP
    let canMessage = false;
    try {
      canMessage = await Client.canMessage(address, { env: xmtpEnv });
    } catch {
      setError('Error checking recipient XMTP registration.');
      return null;
    }
    if (!canMessage) {
      setError('Recipient is not registered on XMTP. They must connect their wallet to XMTP to receive messages.');
      return null;
    }

    try {
      const conversation = await client.conversations.newConversation(address);
      console.log('Created new conversation with:', address);
      // Refresh conversations list
      await loadConversations();
      return conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation.');
      return null;
    }
  }, [client, loadConversations, xmtpEnv]);

  const createGroupChat = useCallback(async (): Promise<Conversation | null> => {
    if (!client) return null;

    try {
      // Note: Group chats in XMTP are still in development
      // This is a placeholder for when group functionality is available
      console.log('Group chat creation not yet implemented in XMTP');
      setError('Group chats not yet supported');
      return null;
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError('Failed to create group chat');
      return null;
    }
  }, [client]);

  const subscribeToMessages = useCallback((conversation: Conversation) => {
    if (!conversation) return;
    
    const conversationId = conversation.peerAddress;
    
    // Unsubscribe from previous subscription if exists
    const existingUnsubscribe = messageSubscriptions.get(conversationId);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    // V3-style optimized polling with better performance
    const pollInterval = setInterval(async () => {
      try {
        const newMessages = await conversation.messages({
          direction: SortDirection.SORT_DIRECTION_DESCENDING,
          limit: 10
        });
        
        // Only update if we have new messages
        if (newMessages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
            return [...prev, ...uniqueNewMessages];
          });
        }
      } catch (err) {
        console.error('Error polling messages:', err);
      }
    }, 2000); // V3 optimization: Reduced to 2 seconds for better responsiveness

    const unsubscribe = () => {
      clearInterval(pollInterval);
    };

    setMessageSubscriptions(prev => new Map(prev.set(conversationId, unsubscribe)));
    console.log('Subscribed to messages for conversation:', conversationId);
  }, [messageSubscriptions]);

  const unsubscribeFromMessages = useCallback((conversation: Conversation) => {
    if (!conversation) return;
    
    const conversationId = conversation.peerAddress;
    const unsubscribe = messageSubscriptions.get(conversationId);
    
    if (unsubscribe) {
      unsubscribe();
      setMessageSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
      console.log('Unsubscribed from messages for conversation:', conversationId);
    }
  }, [messageSubscriptions]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      messageSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [messageSubscriptions]);

  // Reset state when address changes
  useEffect(() => {
    if (address !== initializedAddressRef.current) {
      setClient(null);
      setConversations([]);
      setMessages([]);
      setIsRegistered(false);
      setError(null);
      initializedAddressRef.current = null;
      // Reset initialization lock
      initializationLockRef.current = false;
      
      // Cleanup all subscriptions
      messageSubscriptions.forEach(unsubscribe => unsubscribe());
      setMessageSubscriptions(new Map());
    }
  }, [address, messageSubscriptions]);

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
