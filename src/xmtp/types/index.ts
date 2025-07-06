import { Client, type Signer, type Dm, type Group, type DecodedMessage, ConsentState, type Identifier } from '@xmtp/browser-sdk';
import type { WalletClient } from 'viem';

// XMTP Context Types - V3 3.0.3 Compatible
export interface XMTPContextValue {
  client: Client | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  initialize: (walletClient: WalletClient) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  clearXMTPData: () => Promise<void>;
}

// Message Types - using official XMTP V3 3.0.3 types
export interface Message {
  id: string;
  content: string;
  senderAddress: string; // Uses senderInboxId from XMTP V3
  sentAt: Date;
}

// Conversation Types - using official XMTP V3 3.0.3 patterns
export interface Conversation {
  id: string; // XMTP V3 uses 'id' not 'topic'
  peerAddress?: string;
  isGroup: boolean;
  conversation?: Dm<unknown> | Group<unknown>; // Store the actual XMTP conversation object with proper typing
}

// XMTP Configuration - V3 3.0.3 Compatible
export interface XMTPConfig {
  env: 'production' | 'dev' | 'local';
  appVersion?: string;
}

// Note: Identifier is imported from @xmtp/browser-sdk, no need to redefine
// This ensures 100% compliance with V3 3.0.3 official types

// Re-export official XMTP types for V3 3.0.3 compliance
export type { Signer, Dm, Group, DecodedMessage, Client, Identifier };
export { ConsentState }; 