// XMTP V3 Browser SDK - Simplified Interface
// Mirror of official @xmtp/browser-sdk with enhanced error handling and utilities

// Core exports - V3 SDK compatible
export { Client } from './Client';
export { Conversations } from './Conversations';
export { Contacts } from './Contacts';

// Content types
export { 
  ContentTypes,
  TextCodec,
  ReactionCodec,
  ReplyCodec,
  ReadReceiptCodec,
  AttachmentCodec,
  RemoteAttachmentCodec,
  CodecRegistry,
  defaultCodecs,
  contentTypeEquals,
  contentTypeToString,
  parseContentType,
} from './content-types';

// Content type interfaces
export type {
  TextContent,
  ReactionContent,
  ReplyContent,
  ReadReceiptContent,
  AttachmentContent,
  RemoteAttachmentContent,
} from './content-types';

// Error handling
export {
  XMTPBaseError,
  ClientNotInitializedError,
  ClientAlreadyInitializedError,
  SignerUnavailableError,
  InstallationLimitError,
  MessageSendError,
  MessageNotFoundError,
  UnsupportedContentTypeError,
  MessageEncodeError,
  MessageDecodeError,
  ValidationError,
  NetworkError,
  DatabaseError,
  ErrorFactory,
  ErrorHandler,
} from './errors';

// Utilities
export {
  createAutoSigner,
  validateSigner,
  getSignerInfo,
  clearXMTPIdentity,
  clearXMTPIdentityWithClient,
} from '../utils/xmtpSigner';

// Types - V3 SDK compatible
export type {
  // Core types
  Signer,
  Identifier,
  ClientOptions,
  CreateClientOptions,
  
  // Content types
  ContentTypeCodec,
  ContentTypeId,
  
  // Message types
  DecodedMessage,
  SendOptions,
  
  // Conversation types
  ConversationMetadata,
  GroupMember,
  
  // Streaming types
  StreamOptions,
  StreamCallback,
  AsyncStream,
  
  // Pagination types
  ListOptions,
  MessageListOptions,
  
  // Consent types
  ConsentEntry,
  ConsentListOptions,
  
  // Network types
  NetworkStatus,
  
  // Error types
  XMTPError,
  
  // Installation types
  InstallationInfo,
  
  // Subscription types
  SubscriptionManager,
  
  // Database types
  DatabaseOptions,
  
  // Utility types
  Awaitable,
  Optional,
  RequiredFields,
} from './types';

// Re-export official SDK types for compatibility
export type {
  ConsentState,
  ConversationType,
  DeliveryStatus,
  PermissionLevel,
  Installation,
  InboxState,
  MessageKind,
  IdentifierKind,
} from '@xmtp/browser-sdk';

// Import for default export
import { Client } from './Client';
import { Conversations } from './Conversations';
import { Contacts } from './Contacts';
import { ContentTypes } from './content-types';
import {
  createAutoSigner,
  validateSigner,
  getSignerInfo,
  clearXMTPIdentity,
  clearXMTPIdentityWithClient,
} from '../utils/xmtpSigner';

// Default export for convenience
const XMTP = {
  Client,
  Conversations,
  Contacts,
  ContentTypes,
  createAutoSigner,
  validateSigner,
  getSignerInfo,
  clearXMTPIdentity,
  clearXMTPIdentityWithClient,
};

export default XMTP;