import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { Client, DecodedMessage, Dm, Group } from '@xmtp/browser-sdk';
import { createAutoSigner } from '../utils/xmtpSigner';

export type XMTPConversation = Dm<string> | Group<string>;

export interface XMTPContextType {
  // Core XMTP state
  client: Client | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Conversations and messages
  conversations: XMTPConversation[];
  selectedConversation: XMTPConversation | null;
  messages: { [convId: string]: DecodedMessage<string>[] };
  
  // Core actions
  initializeClient: () => Promise<void>;
  selectConversation: (conversation: XMTPConversation) => void;
  sendMessage: (message: string, conversation?: XMTPConversation) => Promise<void>;
  createConversation: (recipientAddress: string) => Promise<XMTPConversation | null>;
  
  // Simple state
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
  
  // Core state
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready');
  const [isLoading, setIsLoading] = useState(false);
  
  // Conversations and messages
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<XMTPConversation | null>(null);
  const [messages, setMessages] = useState<{ [convId: string]: DecodedMessage<string>[] }>({});
  
  // Stream management
  const globalStreamRef = useRef<any>(null);
  const streamActiveRef = useRef<boolean>(false);

  // WORKING PATTERN: Simple client initialization
  const initializeClient = useCallback(async () => {
    if (!walletClient || !address || isInitializing || isInitialized) {
      return;
    }

    try {
      setIsInitializing(true);
      setError(null);
      setStatus('Initializing XMTP...');

      console.log('[XMTP] 🚀 Starting simple XMTP initialization...');
      
      const signer = createAutoSigner(walletClient);
      const xmtpClient = await Client.create(signer, { env: 'production' });
      
      setClient(xmtpClient);
      setIsInitialized(true);
      setStatus('XMTP ready');
      
      console.log('[XMTP] ✅ XMTP initialized successfully');
      
      // Start simple background sync
      setTimeout(() => loadConversations(), 1000);
      
    } catch (err) {
      console.error('[XMTP] ❌ Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
      setStatus('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address, isInitializing, isInitialized]);

  // WORKING PATTERN: Simple conversation loading
  const loadConversations = useCallback(async () => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      console.log('[XMTP] 🔄 Loading conversations...');
      
      // Simple sync and load
      await client.conversations.sync();
      const convos = await client.conversations.list();
      
      console.log(`[XMTP] ✅ Found ${convos.length} conversations`);
      
      // Log each conversation for debugging
      convos.forEach(conv => {
        console.log('[XMTP] 📋 Conversation:', {
          id: conv.id,
          peerAddress: 'peerAddress' in conv ? conv.peerAddress : 'Group',
          isInbound: 'peerAddress' in conv ? conv.peerAddress !== address : false
        });
      });
      
      setConversations(convos as XMTPConversation[]);
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

  // WORKING PATTERN: Simple conversation selection
  const selectConversation = useCallback(async (conversation: XMTPConversation) => {
    if (!client) return;
    
    try {
      setIsLoading(true);
      setSelectedConversation(conversation);
      
      // Load messages for this conversation
      const msgs = await conversation.messages();
      setMessages(prev => ({ ...prev, [conversation.id]: msgs }));
      
      console.log(`[XMTP] ✅ Selected conversation with ${msgs.length} messages`);
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to select conversation:', error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // WORKING PATTERN: Simple message sending
  const sendMessage = useCallback(async (message: string, targetConversation?: XMTPConversation) => {
    const conversation = targetConversation || selectedConversation;
    if (!conversation || !client) return;
    
    try {
      console.log('[XMTP] 📤 Sending message...');
      
      const sentMessage = await conversation.send(message);
      
      // Add to local messages
      setMessages(prev => ({
        ...prev,
        [conversation.id]: [...(prev[conversation.id] || []), sentMessage]
      }));
      
      console.log('[XMTP] ✅ Message sent successfully');
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to send message:', error);
      setError('Failed to send message');
    }
  }, [selectedConversation, client]);

  // WORKING PATTERN: Simple conversation creation
  const createConversation = useCallback(async (recipientAddress: string): Promise<XMTPConversation | null> => {
    if (!client) return null;
    
    try {
      console.log(`[XMTP] 🔄 Creating conversation with ${recipientAddress}...`);
      
      // Check if recipient can message
      const canMessage = await Client.canMessage([
        { identifier: recipientAddress, identifierKind: 'Ethereum' }
      ], 'production');
      
      if (!canMessage || (Array.isArray(canMessage) && !canMessage[0])) {
        setError('Recipient is not registered on XMTP');
        return null;
      }
      
      // Create new conversation
      const conversation = await client.conversations.newDm(recipientAddress);
      
      // Add to conversations list
      setConversations(prev => [...prev, conversation as XMTPConversation]);
      
      console.log('[XMTP] ✅ Conversation created successfully');
      
      return conversation as XMTPConversation;
      
    } catch (error) {
      console.error('[XMTP] ❌ Failed to create conversation:', error);
      setError('Failed to create conversation');
      return null;
    }
  }, [client]);

  // WORKING PATTERN: Simple global message streaming
  useEffect(() => {
    if (!client || streamActiveRef.current) return;
    
    streamActiveRef.current = true;
    
    const setupStream = async () => {
      try {
        console.log('[XMTP] 🔄 Setting up message stream...');
        
        globalStreamRef.current = await client.conversations.streamAllMessages();
        
        // Process incoming messages
        (async () => {
          try {
            for await (const message of globalStreamRef.current) {
              console.log('[XMTP] 📨 New message received:', message);
              
              // Add to messages
              setMessages(prev => ({
                ...prev,
                [message.conversationId]: [
                  ...(prev[message.conversationId] || []),
                  message
                ]
              }));
            }
          } catch (streamError) {
            console.warn('[XMTP] Stream error:', streamError);
          }
        })();
        
        console.log('[XMTP] ✅ Message stream active');
        
      } catch (error) {
        console.error('[XMTP] ❌ Failed to setup stream:', error);
      }
    };
    
    setupStream();
    
    return () => {
      streamActiveRef.current = false;
      if (globalStreamRef.current) {
        try {
          globalStreamRef.current.return?.();
        } catch (error) {
          console.warn('[XMTP] Error closing stream:', error);
        }
      }
    };
  }, [client]);

  // WORKING PATTERN: Simple periodic sync for inbound conversations
  useEffect(() => {
    if (!client) return;
    
    const syncInterval = setInterval(() => {
      console.log('[XMTP] 🔄 Periodic sync...');
      loadConversations();
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(syncInterval);
  }, [client, loadConversations]);

  // Reset state when wallet changes
  useEffect(() => {
    if (address) {
      setConversations([]);
      setSelectedConversation(null);
      setMessages({});
      setIsInitialized(false);
      setClient(null);
    }
  }, [address]);

  const value: XMTPContextType = {
    // Core state
    client,
    isInitialized,
    isInitializing,
    error,
    status,
    isLoading,
    
    // Data
    conversations,
    selectedConversation,
    messages,
    
    // Actions
    initializeClient,
    selectConversation,
    sendMessage,
    createConversation,
  };

  return (
    <XMTPContext.Provider value={value}>
      {children}
    </XMTPContext.Provider>
  );
};

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (context === undefined) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};