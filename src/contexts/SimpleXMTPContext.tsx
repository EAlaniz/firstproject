import React, { createContext, useEffect, useState, useCallback, useMemo, useContext } from 'react';
import type { WalletClient } from 'viem';
import { Client, Conversations } from '../xmtp';
import { createAutoSigner, validateSigner } from '../xmtp';
import type { ClientOptions, DecodedMessage, ConversationMetadata, Signer } from '../xmtp';

// Use only official XMTP V3 types and patterns
interface XMTPContextValue {
  client: Client | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  conversations: Conversations | null;
  isLoadingConversations: boolean;
  messages: DecodedMessage[];
  isLoadingMessages: boolean;
  initialize: (walletClient: WalletClient, options?: ClientOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (conversationId: string, content: unknown) => Promise<string>;
  newConversation: (peerAddress: string, context?: { conversationId?: string; metadata?: ConversationMetadata }) => Promise<unknown>;
  canMessage: (peerAddress: string) => Promise<boolean>;
  clearError: () => void;
  loadMessages: (conversationId: string) => Promise<void>;
}

const XMTPContext = createContext<XMTPContextValue | null>(null);

export { XMTPContext };

interface XMTPProviderProps {
  children: React.ReactNode;
  defaultOptions?: ClientOptions;
}

export const SimpleXMTPProvider: React.FC<XMTPProviderProps> = ({ children, defaultOptions = { env: 'production' } }) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversations, setConversations] = useState<Conversations | null>(null);
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Initialize XMTP client using official V3 pattern
  const initialize = useCallback(async (walletClient: WalletClient, options?: ClientOptions) => {
    if (isInitialized || isConnecting) return;
    setIsConnecting(true);
    setError(null);
    try {
      const signer = createAutoSigner(walletClient);
      const isValid = await validateSigner(signer);
      if (!isValid) throw new Error('Invalid signer');
      const xmtpClient = await Client.create(signer as Signer, { ...defaultOptions, ...options });
      setClient(xmtpClient);
      setIsInitialized(true);
      setConversations(xmtpClient.conversations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize XMTP'));
      setIsInitialized(false);
    } finally {
      setIsConnecting(false);
    }
  }, [isInitialized, isConnecting, defaultOptions]);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (!client) return;
    try {
      await client.cleanup();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect XMTP'));
    } finally {
      setClient(null);
      setIsInitialized(false);
      setConversations(null);
      setMessages([]);
      setError(null);
    }
  }, [client]);

  // Send message (official pattern)
  const sendMessage = useCallback(async (conversationId: string, content: unknown): Promise<string> => {
    if (!conversations) throw new Error('Conversations not initialized');
    // Find the conversation by id
    const convs = await conversations.listConversations();
    const conversation = convs.find((c: { id?: string; topic?: string }) => c.id === conversationId || c.topic === conversationId);
    if (!conversation) throw new Error('Conversation not found');
    const messageId = await conversation.send(content);
    return messageId;
  }, [conversations]);

  // New conversation (official pattern)
  const newConversation = useCallback(async (peerAddress: string, context?: { conversationId?: string; metadata?: ConversationMetadata }) => {
    if (!conversations) throw new Error('Conversations not initialized');
    return await conversations.newConversation(peerAddress, context);
  }, [conversations]);

  // Can message (official pattern)
  const canMessage = useCallback(async (peerAddress: string) => {
    if (!conversations) return false;
    return await conversations.canMessage(peerAddress);
  }, [conversations]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Load messages for a conversation (official pattern)
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversations) return;
    setIsLoadingMessages(true);
    try {
      const convs = await conversations.listConversations();
      const conversation = convs.find((c: { id?: string; topic?: string }) => c.id === conversationId || c.topic === conversationId);
      if (!conversation) throw new Error('Conversation not found');
      const msgs = await conversation.messages();
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load messages'));
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversations]);

  // Memoize context value
  const contextValue = useMemo<XMTPContextValue>(() => ({
    client,
    isInitialized,
    isConnecting,
    error,
    conversations,
    isLoadingConversations: false,
    messages,
    isLoadingMessages,
    initialize,
    disconnect,
    sendMessage,
    newConversation,
    canMessage,
    clearError,
    loadMessages,
  }), [client, isInitialized, isConnecting, error, conversations, isLoadingMessages, initialize, disconnect, sendMessage, newConversation, canMessage, clearError, loadMessages]);

  useEffect(() => {
    return () => {
      if (client) disconnect();
    };
  }, [client, disconnect]);

  return (
    <XMTPContext.Provider value={contextValue}>
      {children}
    </XMTPContext.Provider>
  );
};

export const useXMTP = (): XMTPContextValue => {
  const context = useContext(XMTPContext);
  if (!context) throw new Error('useXMTP must be used within a SimpleXMTPProvider');
  return context;
};

export const useSimpleXMTP = useXMTP;
export const useXMTPClient = (): Client | null => useXMTP().client;
export const useXMTPInitialized = (): boolean => useXMTP().isInitialized;
export const useXMTPConversations = (): Conversations | null => useXMTP().conversations;
export const useXMTPMessages = (): DecodedMessage[] => useXMTP().messages;
export const useXMTPSendMessage = () => useXMTP().sendMessage;
export const useXMTPNewConversation = () => useXMTP().newConversation;
export const useXMTPCanMessage = () => useXMTP().canMessage;
export const useXMTPError = () => useXMTP().error;

// Hooks moved to separate file to fix Fast Refresh warnings