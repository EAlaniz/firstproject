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
    // Simplified for testing
    console.log('Loading conversations...');
  }, [client]);

  const initializeClient = useCallback(async (signer: Signer) => {
    console.log('XMTP initializeClient called');
    // Simplified for testing - just set a flag
    setIsInitializing(true);
    setTimeout(() => {
      setIsInitializing(false);
      setIsRegistered(true);
      console.log('XMTP initialized (mock)');
    }, 1000);
  }, []);

  const loadMessages = async (conversation: Conversation) => {
    console.log('Loading messages...');
  };

  const sendMessage = async (conversation: Conversation, content: string) => {
    console.log('Sending message:', content);
  };

  const createConversation = async (address: string): Promise<Conversation | null> => {
    console.log('Creating conversation with:', address);
    return null;
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
