// XMTP Browser SDK Types - Mirror of official SDK
import type {
  ConsentState,
  DeliveryStatus,
  PermissionLevel,
  MessageKind,
  IdentifierKind,
} from '@xmtp/browser-sdk';

// Re-export WASM types
export type {
  ConsentState,
  DeliveryStatus,
  PermissionLevel,
  MessageKind,
  IdentifierKind,
} from '@xmtp/browser-sdk';

// Client Types
export interface ClientOptions {
  env: 'dev' | 'production' | 'local';
  historySyncUrl?: string;
  codecs?: ContentTypeCodec[];
  enableV3?: boolean;
  dbPath?: string;
}

export interface CreateClientOptions extends ClientOptions {
  apiUrl?: string;
  registryUrl?: string;
  loggingLevel?: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

// Signer Interface - Compatible with XMTP V3 Browser SDK
export interface Signer {
  getIdentifier(): Identifier | Promise<Identifier>;
  signMessage(message: string): Promise<Uint8Array>;
  getChainId?(): Promise<bigint>;
  getBlockNumber?(): Promise<bigint>;
  type: 'EOA' | 'SCW';
}

// Identifier Interface - V3 SDK requirement
export interface Identifier {
  identifier: string;
  identifierKind: IdentifierKind;
}

// Content Types
export interface ContentTypeCodec<T = unknown> {
  contentType: ContentTypeId;
  encode(content: T): Uint8Array;
  decode(bytes: Uint8Array): T;
  fallback?(content: T): string | undefined;
}

export interface ContentTypeId {
  authorityId: string;
  typeId: string;
  versionMajor: number;
  versionMinor: number;
}

// Message Types
export interface DecodedMessage<T = unknown> {
  id: string;
  conversationId: string;
  senderInboxId: string;
  sentAt: Date;
  contentType: ContentTypeId;
  content: T;
  fallback?: string;
  deliveryStatus: DeliveryStatus;
  kind: MessageKind;
}

export interface SendOptions {
  contentType?: ContentTypeId;
  contentFallback?: string;
}

// Conversation Types
export interface ConversationMetadata {
  name?: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMember {
  inboxId: string;
  accountAddresses: string[];
  permissionLevel: PermissionLevel;
  joinedAt?: Date;
}

// Streaming Types
export interface StreamOptions {
  includeGroups?: boolean;
  includeDms?: boolean;
  consentStates?: ConsentState[];
}

export type StreamCallback<T> = (value: T) => void | Promise<void>;

export interface AsyncStream<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
  stop(): void;
}

// Pagination Types
export interface ListOptions {
  limit?: number;
  order?: 'asc' | 'desc';
  startTime?: Date;
  endTime?: Date;
}

export interface MessageListOptions extends ListOptions {
  deliveryStatus?: DeliveryStatus;
}

// Consent Types
export interface ConsentEntry {
  identifier: string;
  identifierKind: IdentifierKind;
  permissionType: ConsentState;
}

export interface ConsentListOptions {
  identifier?: string;
  identifierKind?: IdentifierKind;
}

// Network Types
export interface NetworkStatus {
  isConnected: boolean;
  lastSeen?: Date;
  retryCount: number;
}

// Error Types
export interface XMTPError extends Error {
  code: string;
  details?: unknown;
}

// Installation Types
export interface InstallationInfo {
  id: string;
  createdAt: Date;
  isActive: boolean;
}

// Subscription Types
export interface SubscriptionManager {
  subscribe<T>(stream: AsyncStream<T>, callback: StreamCallback<T>): () => void;
  unsubscribeAll(): void;
}

// Database Types
export interface DatabaseOptions {
  path?: string;
  encryptionKey?: Uint8Array;
}

// Utility Types
export type Awaitable<T> = T | Promise<T>;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;