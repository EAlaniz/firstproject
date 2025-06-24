import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client, Conversation, DecodedMessage, SortDirection } from '@xmtp/xmtp-js';
import { useAccount, useWalletClient } from 'wagmi';
import { Signer, isAddress } from 'ethers';
import { checkXMTPCompatibility, getWalletGuidance } from '../utils/walletCompatibility';

interface XMTPContextType {
  client: Client | null;
  conversations: Conversation[];
  messages: DecodedMessage[];
  isLoading: boolean;
  error: string | null;
  isRegistered: boolean;
  isInitializing: boolean;
  walletCompatibility: ReturnType<typeof checkXMTPCompatibility>;
  walletGuidance: ReturnType<typeof getWalletGuidance>;
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
  
  const initializedAddressRef = useRef<string | null>(null);
  const xmtpEnv = import.meta.env.VITE_XMTP_ENV || 'production';

  // Check wallet compatibility
  const walletCompatibility = checkXMTPCompatibility();
  const walletGuidance = getWalletGuidance();

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

    // Check wallet compatibility before proceeding
    if (!walletCompatibility.isXMTPCompatible) {
      setError(walletCompatibility.userMessage);
      return;
    }

    if (initializedAddressRef.current === address) {
      console.log('Already initialized for this address');
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      console.log('Initializing XMTP client for address:', address);
      console.log('Using XMTP environment:', xmtpEnv);
      console.log('Wallet compatibility:', walletCompatibility);

      const canMessage = await Client.canMessage(address, { env: xmtpEnv });
      console.log('Can message check result:', canMessage);
      
      if (!canMessage) {
        console.log('User not registered on XMTP, attempting to register...');
        try {
          const xmtpClient = await Client.create(signer, { 
            env: xmtpEnv, 
            appVersion: '10k-move-earn-connect/1.0.0' 
          });
          setClient(xmtpClient);
          setIsRegistered(true);
          initializedAddressRef.current = address;
          setError(null);
          await loadConversations();
          return;
        } catch (registrationErr: any) {
          console.error('Error registering on XMTP:', registrationErr);
          if (registrationErr.code === 4001 || 
              registrationErr.message?.includes('user rejected') || 
              registrationErr.message?.includes('ACTION_REJECTED')) {
            setError('XMTP setup was cancelled. Please try again and approve the signature request.');
          } else {
            setError(`Failed to register on XMTP: ${registrationErr.message || 'Unknown error'}`);
          }
          setIsRegistered(false);
          return;
        }
      }

      console.log('User already registered, creating XMTP client...');
      const xmtpClient = await Client.create(signer, { 
        env: xmtpEnv, 
        appVersion: '10k-move-earn-connect/1.0.0' 
      });
      setClient(xmtpClient);
      setIsRegistered(true);
      initializedAddressRef.current = address;
      await loadConversations();
    } catch (err: any) {
      console.error('Error initializing XMTP client:', err);
      if (err.code === 4001 || 
          err.message?.includes('user rejected') || 
          err.message?.includes('ACTION_REJECTED')) {
        setError('XMTP setup was cancelled. Please try again and approve the signature request.');
      } else {
        setError(`Failed to initialize XMTP: ${err.message || 'Unknown error'}`);
      }
      setIsRegistered(false);
    } finally {
      setIsInitializing(false);
    }
  }, [address, loadConversations, xmtpEnv, walletCompatibility]);

  const loadMessages = useCallback(async (conversation: Conversation) => {
    if (!conversation) return;
    try {
      const msgs = await conversation.messages({
        direction: SortDirection.SORT_DIRECTION_DESCENDING,
        limit: 50
      });
      setMessages(msgs.reverse());
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
      await loadMessages(conversation);
    } catch (err) {
      setError('Failed to send message');
    }
  }, [client, loadMessages]);

  const createConversation = useCallback(async (address: string): Promise<Conversation | null> => {
    if (!client) return null;
    if (!isAddress(address)) {
      setError('Invalid Ethereum address. Please enter a valid address.');
      return null;
    }
    let canMessage = false;
    try {
      canMessage = await Client.canMessage(address, { env: xmtpEnv });
    } catch (err) {
      setError('Error checking recipient XMTP registration.');
      return null;
    }
    if (!canMessage) {
      setError('Recipient is not registered on XMTP. They must connect their wallet to XMTP to receive messages.');
      return null;
    }
    try {
      const conversation = await client.conversations.newConversation(address);
      await loadConversations();
      return conversation;
    } catch (err) {
      setError('Failed to create conversation.');
      return null;
    }
  }, [client, loadConversations, xmtpEnv]);

  const createGroupChat = useCallback(async (name: string, addresses: string[]): Promise<Conversation | null> => {
    if (!client) return null;
    setError('Group chats not yet supported');
    return null;
  }, [client]);

  const subscribeToMessages = useCallback((conversation: Conversation) => {
    if (!conversation) return;
    
    const existingUnsubscribe = messageSubscriptions.get(conversation.peerAddress);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    try {
      const messageStream = conversation.streamMessages();
      const unsubscribe = () => {
        try {
          messageStream.return?.();
        } catch (err) {
          console.error('Error unsubscribing from messages:', err);
        }
      };

      setMessageSubscriptions(prev => new Map(prev.set(conversation.peerAddress, unsubscribe)));

      // Handle incoming messages
      const handleMessage = async () => {
        await loadMessages(conversation);
      };

      // Set up polling for messages (XMTP doesn't have real-time events in this version)
      const pollInterval = setInterval(handleMessage, 3000);
      
      // Update unsubscribe to also clear the interval
      const fullUnsubscribe = () => {
        clearInterval(pollInterval);
        unsubscribe();
      };
      
      setMessageSubscriptions(prev => new Map(prev.set(conversation.peerAddress, fullUnsubscribe)));
      
    } catch (err) {
      console.error('Error setting up message subscription:', err);
    }
  }, [loadMessages, messageSubscriptions]);

  const unsubscribeFromMessages = useCallback((conversation: Conversation) => {
    if (!conversation) return;
    const unsubscribe = messageSubscriptions.get(conversation.peerAddress);
    if (unsubscribe) {
      unsubscribe();
      setMessageSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversation.peerAddress);
        return newMap;
      });
    }
  }, [messageSubscriptions]);

  useEffect(() => {
    return () => {
      messageSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, [messageSubscriptions]);

  useEffect(() => {
    if (address !== initializedAddressRef.current) {
      setClient(null);
      setConversations([]);
      setMessages([]);
      setIsRegistered(false);
      setIsInitializing(false);
      setError(null);
      initializedAddressRef.current = null;
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
    walletCompatibility,
    walletGuidance,
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
