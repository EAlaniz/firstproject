import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { useAccount } from 'wagmi';
import { Signer } from 'ethers';

interface XMTPContextType {
  client: Client | null;
  conversations: Conversation[];
  messages: DecodedMessage[];
  isLoading: boolean;
  error: string | null;
  initializeClient: (signer: Signer) => Promise<void>;
  sendMessage: (conversation: Conversation, content: string) => Promise<void>;
  createConversation: (address: string) => Promise<Conversation | null>;
  createGroupChat: (name: string, addresses: string[]) => Promise<Conversation | null>;
  loadConversations: () => Promise<void>;
  loadMessages: (conversation: Conversation) => Promise<void>;
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
  const [error, setError] = useState<string | null>(null);

  const initializeClient = async (signer: Signer) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is already registered on XMTP
      const isRegistered = await Client.canMessage(signer);
      
      if (!isRegistered) {
        // User needs to register for XMTP
        console.log('User not registered on XMTP, prompting registration...');
        // You can show a modal here to prompt user registration
        return;
      }

      // Initialize XMTP client
      const xmtpClient = await Client.create(signer, { env: 'production' });
      setClient(xmtpClient);

      // Load conversations
      await loadConversations();
    } catch (err) {
      console.error('Error initializing XMTP client:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize XMTP');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    if (!client) return;

    try {
      const convos = await client.conversations.list();
      setConversations(convos);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations');
    }
  };

  const loadMessages = async (conversation: Conversation) => {
    try {
      const msgs = await conversation.messages();
      setMessages(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Failed to load messages');
    }
  };

  const sendMessage = async (conversation: Conversation, content: string) => {
    if (!client) return;

    try {
      await conversation.send(content);
      // Reload messages to show the new message
      await loadMessages(conversation);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const createConversation = async (address: string): Promise<Conversation | null> => {
    if (!client) return null;

    try {
      const conversation = await client.conversations.newConversation(address);
      await loadConversations(); // Refresh conversations list
      return conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
      return null;
    }
  };

  const createGroupChat = async (name: string, addresses: string[]): Promise<Conversation | null> => {
    if (!client) return null;

    try {
      // Note: Group chats in XMTP are still in development
      // This is a placeholder for when group functionality is available
      console.log('Group chat creation not yet implemented in XMTP');
      return null;
    } catch (err) {
      console.error('Error creating group chat:', err);
      setError('Failed to create group chat');
      return null;
    }
  };

  // Initialize client when wallet connects
  useEffect(() => {
    if (address && !client) {
      // You'll need to get the signer from your wallet connection
      // This depends on your wallet setup (wagmi, etc.)
    }
  }, [address, client]);

  const value: XMTPContextType = {
    client,
    conversations,
    messages,
    isLoading,
    error,
    initializeClient,
    sendMessage,
    createConversation,
    createGroupChat,
    loadConversations,
    loadMessages,
  };

  return (
    <XMTPContext.Provider value={value}>
      {children}
    </XMTPContext.Provider>
  );
}; 