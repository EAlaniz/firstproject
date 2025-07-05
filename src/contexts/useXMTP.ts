import { useContext } from 'react';
import { XMTPContext } from './SimpleXMTPContext';
import type { Client, Conversations, DecodedMessage } from '../xmtp';

export const useXMTP = () => {
  const context = useContext(XMTPContext);
  if (!context) throw new Error('useXMTP must be used within a SimpleXMTPProvider');
  return context;
};

export const useXMTPClient = (): Client | null => useXMTP().client;
export const useXMTPInitialized = (): boolean => useXMTP().isInitialized;
export const useXMTPConversations = (): Conversations | null => useXMTP().conversations;
export const useXMTPMessages = (): DecodedMessage[] => useXMTP().messages;
export const useXMTPSendMessage = () => useXMTP().sendMessage;
export const useXMTPNewConversation = () => useXMTP().newConversation;
export const useXMTPCanMessage = () => useXMTP().canMessage;
export const useXMTPError = () => useXMTP().error; 