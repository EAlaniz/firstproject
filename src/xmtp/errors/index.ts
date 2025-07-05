// XMTP Error Classes - Mirror of official SDK
import type { XMTPError } from '../types';

// Base XMTP Error
export class XMTPBaseError extends Error implements XMTPError {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Client Errors
export class ClientNotInitializedError extends XMTPBaseError {
  constructor(message = 'XMTP client is not initialized') {
    super(message, 'CLIENT_NOT_INITIALIZED');
  }
}

export class ClientAlreadyInitializedError extends XMTPBaseError {
  constructor(message = 'XMTP client is already initialized') {
    super(message, 'CLIENT_ALREADY_INITIALIZED');
  }
}

export class SignerUnavailableError extends XMTPBaseError {
  constructor(message = 'Signer is not available') {
    super(message, 'SIGNER_UNAVAILABLE');
  }
}

export class InvalidSignerError extends XMTPBaseError {
  constructor(message = 'Invalid signer provided') {
    super(message, 'INVALID_SIGNER');
  }
}

// Network Errors
export class NetworkError extends XMTPBaseError {
  constructor(message = 'Network request failed', details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
  }
}

export class ConnectionError extends XMTPBaseError {
  constructor(message = 'Failed to connect to XMTP network') {
    super(message, 'CONNECTION_ERROR');
  }
}

export class TimeoutError extends XMTPBaseError {
  constructor(message = 'Request timed out') {
    super(message, 'TIMEOUT_ERROR');
  }
}

// Database Errors
export class DatabaseError extends XMTPBaseError {
  constructor(message = 'Database operation failed', details?: unknown) {
    super(message, 'DATABASE_ERROR', details);
  }
}

export class DatabaseCorruptionError extends XMTPBaseError {
  constructor(message = 'Database corruption detected') {
    super(message, 'DATABASE_CORRUPTION');
  }
}

export class DatabaseLockError extends XMTPBaseError {
  constructor(message = 'Database is locked by another process') {
    super(message, 'DATABASE_LOCK');
  }
}

// Conversation Errors
export class ConversationNotFoundError extends XMTPBaseError {
  constructor(conversationId: string) {
    super(`Conversation not found: ${conversationId}`, 'CONVERSATION_NOT_FOUND', { conversationId });
  }
}

export class ConversationCreationError extends XMTPBaseError {
  constructor(message = 'Failed to create conversation', details?: unknown) {
    super(message, 'CONVERSATION_CREATION_ERROR', details);
  }
}

export class InvalidConversationError extends XMTPBaseError {
  constructor(message = 'Invalid conversation') {
    super(message, 'INVALID_CONVERSATION');
  }
}

// Message Errors
export class MessageNotFoundError extends XMTPBaseError {
  constructor(messageId: string) {
    super(`Message not found: ${messageId}`, 'MESSAGE_NOT_FOUND', { messageId });
  }
}

export class MessageSendError extends XMTPBaseError {
  constructor(message = 'Failed to send message', details?: unknown) {
    super(message, 'MESSAGE_SEND_ERROR', details);
  }
}

export class MessageDecodeError extends XMTPBaseError {
  constructor(message = 'Failed to decode message', details?: unknown) {
    super(message, 'MESSAGE_DECODE_ERROR', details);
  }
}

export class MessageEncodeError extends XMTPBaseError {
  constructor(message = 'Failed to encode message', details?: unknown) {
    super(message, 'MESSAGE_ENCODE_ERROR', details);
  }
}

// Content Type Errors
export class UnsupportedContentTypeError extends XMTPBaseError {
  constructor(contentType: string) {
    super(`Unsupported content type: ${contentType}`, 'UNSUPPORTED_CONTENT_TYPE', { contentType });
  }
}

export class ContentTypeRegistrationError extends XMTPBaseError {
  constructor(message = 'Failed to register content type', details?: unknown) {
    super(message, 'CONTENT_TYPE_REGISTRATION_ERROR', details);
  }
}

// Group Errors
export class GroupNotFoundError extends XMTPBaseError {
  constructor(groupId: string) {
    super(`Group not found: ${groupId}`, 'GROUP_NOT_FOUND', { groupId });
  }
}

export class GroupPermissionError extends XMTPBaseError {
  constructor(message = 'Insufficient group permissions') {
    super(message, 'GROUP_PERMISSION_ERROR');
  }
}

export class GroupMemberError extends XMTPBaseError {
  constructor(message = 'Group member operation failed', details?: unknown) {
    super(message, 'GROUP_MEMBER_ERROR', details);
  }
}

// Installation Errors
export class InstallationLimitError extends XMTPBaseError {
  constructor(limit: number, inboxId?: string) {
    super(
      `Installation limit reached: ${limit}/5 installations`,
      'INSTALLATION_LIMIT_ERROR',
      { limit, inboxId }
    );
  }
}

export class InstallationRevocationError extends XMTPBaseError {
  constructor(message = 'Failed to revoke installation', details?: unknown) {
    super(message, 'INSTALLATION_REVOCATION_ERROR', details);
  }
}

// Consent Errors
export class ConsentError extends XMTPBaseError {
  constructor(message = 'Consent operation failed', details?: unknown) {
    super(message, 'CONSENT_ERROR', details);
  }
}

export class ConsentNotFoundError extends XMTPBaseError {
  constructor(identifier: string) {
    super(`Consent not found for: ${identifier}`, 'CONSENT_NOT_FOUND', { identifier });
  }
}

// Streaming Errors
export class StreamError extends XMTPBaseError {
  constructor(message = 'Stream error occurred', details?: unknown) {
    super(message, 'STREAM_ERROR', details);
  }
}

export class StreamClosedError extends XMTPBaseError {
  constructor(message = 'Stream has been closed') {
    super(message, 'STREAM_CLOSED');
  }
}

// Validation Errors
export class ValidationError extends XMTPBaseError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class InvalidAddressError extends XMTPBaseError {
  constructor(address: string) {
    super(`Invalid address: ${address}`, 'INVALID_ADDRESS', { address });
  }
}

export class InvalidInboxIdError extends XMTPBaseError {
  constructor(inboxId: string) {
    super(`Invalid inbox ID: ${inboxId}`, 'INVALID_INBOX_ID', { inboxId });
  }
}

// Browser-Specific Errors
export class BrowserNotSupportedError extends XMTPBaseError {
  constructor(message = 'Browser not supported') {
    super(message, 'BROWSER_NOT_SUPPORTED');
  }
}

export class OPFSNotSupportedError extends XMTPBaseError {
  constructor(message = 'Origin Private File System not supported') {
    super(message, 'OPFS_NOT_SUPPORTED');
  }
}

export class MultipleTabsError extends XMTPBaseError {
  constructor(message = 'Multiple tabs detected. XMTP Browser SDK only supports single tab access.') {
    super(message, 'MULTIPLE_TABS_ERROR');
  }
}

export class WASMPanicError extends XMTPBaseError {
  constructor(message = 'WASM panic occurred', details?: unknown) {
    super(message, 'WASM_PANIC', details);
  }
}

// Error Factory
export class ErrorFactory {
  static fromWasmError(error: any): XMTPBaseError {
    const message = error?.message || 'Unknown WASM error';
    
    // Check for specific error patterns
    if (message.includes('already registered 5/5 installations')) {
      const inboxIdMatch = message.match(/InboxID ([a-f0-9]{64})/);
      return new InstallationLimitError(5, inboxIdMatch?.[1]);
    }
    
    if (message.includes('group with welcome id')) {
      return new DatabaseCorruptionError(message);
    }
    
    if (message.includes('simultaneous connections')) {
      return new MultipleTabsError(message);
    }
    
    if (message.includes('unreachable') || message.includes('panicked')) {
      return new WASMPanicError(message, error);
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return new NetworkError(message, error);
    }
    
    if (message.includes('database') || message.includes('sqlite')) {
      return new DatabaseError(message, error);
    }
    
    // Default to base XMTP error
    return new XMTPBaseError(message, 'UNKNOWN_ERROR', error);
  }
  
  static fromNetworkError(error: any): NetworkError {
    return new NetworkError(error?.message || 'Network request failed', error);
  }
  
  static fromDatabaseError(error: any): DatabaseError {
    return new DatabaseError(error?.message || 'Database operation failed', error);
  }
}

// Error Type Guards
export function isXMTPError(error: any): error is XMTPError {
  return error instanceof XMTPBaseError || (error && typeof error.code === 'string');
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError || error?.code === 'NETWORK_ERROR';
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError || error?.code === 'DATABASE_ERROR';
}

export function isInstallationLimitError(error: any): error is InstallationLimitError {
  return error instanceof InstallationLimitError || error?.code === 'INSTALLATION_LIMIT_ERROR';
}

export function isDatabaseCorruptionError(error: any): error is DatabaseCorruptionError {
  return error instanceof DatabaseCorruptionError || error?.code === 'DATABASE_CORRUPTION';
}

export function isMultipleTabsError(error: any): error is MultipleTabsError {
  return error instanceof MultipleTabsError || error?.code === 'MULTIPLE_TABS_ERROR';
}

export function isWASMPanicError(error: any): error is WASMPanicError {
  return error instanceof WASMPanicError || error?.code === 'WASM_PANIC';
}

// Error Handler Utility
export class ErrorHandler {
  private static retryDelays = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff
  
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    onError?: (error: XMTPBaseError, attempt: number) => void
  ): Promise<T> {
    let lastError: XMTPBaseError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = isXMTPError(error) ? error : ErrorFactory.fromWasmError(error);
        
        if (onError) {
          onError(lastError, attempt);
        }
        
        // Don't retry certain errors
        if (
          isDatabaseCorruptionError(lastError) ||
          isMultipleTabsError(lastError) ||
          isWASMPanicError(lastError) ||
          attempt === maxRetries
        ) {
          break;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          const delay = this.retryDelays[Math.min(attempt, this.retryDelays.length - 1)];
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
  
  static logError(error: XMTPBaseError, context?: string): void {
    const prefix = context ? `[${context}]` : '[XMTP]';
    console.error(`${prefix} ${error.name}: ${error.message}`, error.details || '');
    
    if (error.stack) {
      console.error(error.stack);
    }
  }
}