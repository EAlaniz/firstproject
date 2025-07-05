// XMTP Browser SDK - Complete Implementation Mirror
// Main exports matching official XMTP Browser SDK structure

// Re-export WASM types from official SDK
export {
  ConsentState,
  ConversationType,
  DeliveryStatus,
  GroupPermissionLevel,
  Installation,
  InboxState,
  MessageKind,
} from '@xmtp/browser-sdk';

// Core Classes
export { Client } from './Client';
export { Conversations } from './Conversations';
export { Conversation } from './Conversation';
export { Dm } from './Dm';
export { Group } from './Group';
export { Contacts } from './Contacts';

// Types
export type {
  Signer,
  ClientOptions,
  CreateClientOptions,
  ContentTypeCodec,
  ContentTypeId,
  DecodedMessage,
  SendOptions,
  ConversationMetadata,
  GroupMember,
  AsyncStream,
  StreamCallback,
  StreamOptions,
  MessageListOptions,
  ListOptions,
  ConsentEntry,
  ConsentListOptions,
  InstallationInfo,
  NetworkStatus,
  XMTPError,
  Awaitable,
  Optional,
  RequiredFields,
} from './types';

// Content Types
export {
  ContentTypes,
  TextContent,
  ReactionContent,
  ReplyContent,
  ReadReceiptContent,
  AttachmentContent,
  RemoteAttachmentContent,
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

// Errors
export {
  XMTPBaseError,
  ClientNotInitializedError,
  ClientAlreadyInitializedError,
  SignerUnavailableError,
  InvalidSignerError,
  NetworkError,
  ConnectionError,
  TimeoutError,
  DatabaseError,
  DatabaseCorruptionError,
  DatabaseLockError,
  ConversationNotFoundError,
  ConversationCreationError,
  InvalidConversationError,
  MessageNotFoundError,
  MessageSendError,
  MessageDecodeError,
  MessageEncodeError,
  UnsupportedContentTypeError,
  ContentTypeRegistrationError,
  GroupNotFoundError,
  GroupPermissionError,
  GroupMemberError,
  InstallationLimitError,
  InstallationRevocationError,
  ConsentError,
  ConsentNotFoundError,
  StreamError,
  StreamClosedError,
  ValidationError,
  InvalidAddressError,
  InvalidInboxIdError,
  BrowserNotSupportedError,
  OPFSNotSupportedError,
  MultipleTabsError,
  WASMPanicError,
  ErrorFactory,
  ErrorHandler,
  isXMTPError,
  isNetworkError,
  isDatabaseError,
  isInstallationLimitError,
  isDatabaseCorruptionError,
  isMultipleTabsError,
  isWASMPanicError,
} from './errors';

// Utilities
export {
  AsyncStream,
  SubscriptionManager,
  AddressValidator,
  ContentTypeUtils,
  ConsentUtils,
  SignerUtils,
  InstallationUtils,
  NetworkUtils,
  DatabaseUtils,
  PerformanceUtils,
  BrowserUtils,
} from './utils';

// Type alias for conversation union
export type { XMTPConversation } from './Conversations';

// Default export
export { Client as default } from './Client';