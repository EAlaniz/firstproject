import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Client, Conversation, DecodedMessage, SortDirection } from '@xmtp/browser-sdk';
import { useAccount, useWalletClient } from 'wagmi';
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

// Helper functions for persistence
const getStorageKey = (address: string) => `xmtp_${address.toLowerCase()}`;
const saveXMTPState = (address: string, state: any) => {
  try {
    localStorage.setItem(getStorageKey(address), JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save XMTP state to localStorage:', error);
  }
};
const loadXMTPState = (address: string) => {
  try {
    const stored = localStorage.getItem(getStorageKey(address));
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load XMTP state from localStorage:', error);
    return null;
  }
};

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
      // Create XMTP client with V3 API
      try {
        const xmtpClient = await Client.create(signer, { 
          env: xmtpEnv, 
          appVersion: '10k-move-earn-connect/1.0.0' 
        });
        
        console.log('XMTP V3 client created successfully');
        return xmtpClient;
      } catch (error) {
        console.error('Failed to create XMTP V3 client:', error);
        
        // Handle signature rejection specifically
        if (error && typeof error === 'object' && 'code' in error && error.code === 4001) {
          throw new Error('Signature request was rejected. Please try again to enable messaging.');
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' && error.message.includes('User denied')) {
          throw new Error('Signature request was denied. Please try again to enable messaging.');
        } else {
          throw new Error('Failed to initialize XMTP V3. Please try again with Coinbase Wallet.');
        }
      }
    };

    try {
      setIsInitializing(true);
      setError(null);
      console.log('Initializing XMTP V3 client for address:', address);
      console.log('Using XMTP environment:', xmtpEnv);

      // Check if user is registered on XMTP V3
      const canMessage = await Client.canMessage(address, { env: xmtpEnv });
      console.log('Can message check result:', canMessage);
      
      if (!canMessage) {
        console.log('User not registered on XMTP V3, attempting to register...');
        setError('Registering wallet on XMTP V3... This may take a moment.');
        
        // Attempt to register the user on XMTP V3
        try {
          const xmtpClient = await handleXMTPRegistration(signer);
          
          setClient(xmtpClient);
          setIsRegistered(true);
          initializedAddressRef.current = address;
          
          // Save state to localStorage
          saveXMTPState(address, { isRegistered: true, timestamp: Date.now() });
          
          console.log('XMTP V3 client initialized and user registered successfully');
          setError(null);
          
          // Load conversations after successful initialization
          await loadConversations();
          return;
        } catch (registrationErr) {
          console.error('Error registering on XMTP V3:', registrationErr);
          
          // Handle signature rejection specifically
          if (registrationErr && typeof registrationErr === 'object' && 'code' in registrationErr && registrationErr.code === 4001) {
            setError('Signature request was rejected. Please try again to enable messaging.');
          } else if (registrationErr && typeof registrationErr === 'object' && 'message' in registrationErr && typeof registrationErr.message === 'string' && registrationErr.message.includes('User denied')) {
            setError('Signature request was denied. Please try again to enable messaging.');
          } else {
            const errorMessage = registrationErr instanceof Error 
              ? registrationErr.message 
              : 'Failed to register on XMTP V3. Please try again with Coinbase Wallet.';
            setError(errorMessage);
          }
          setIsRegistered(false);
          return;
        }
      }

      // User is already registered, create XMTP V3 client
      console.log('User already registered, creating XMTP V3 client...');
      const xmtpClient = await handleXMTPRegistration(signer);
      
      setClient(xmtpClient);
      setIsRegistered(true);
      initializedAddressRef.current = address;
      
      // Save state to localStorage
      saveXMTPState(address, { isRegistered: true, timestamp: Date.now() });
      
      console.log('XMTP V3 client initialized successfully for existing user');
      
      // Load conversations after successful initialization
      await loadConversations();
      
    } catch (error) {
      console.error('Failed to initialize XMTP V3 client:', error);
      setError('Failed to initialize XMTP V3 client. Please try again.');
      setIsRegistered(false);
      initializedAddressRef.current = null;
      // Remove persisted state
      if (address) localStorage.removeItem(getStorageKey(address));
    } finally {
      setIsInitializing(false);
      initializationLockRef.current = false;
    }
  }, [address, loadConversations, xmtpEnv]);

  // ... (rest of the file remains unchanged)

} 