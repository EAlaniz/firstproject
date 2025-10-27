/**
 * Type guard utilities for XMTP conversations and messages
 */

import type { Dm, Group } from '@xmtp/browser-sdk';

/**
 * Type guard to check if a conversation is a Group
 */
export function isGroupConversation<T>(
  conversation: Dm<T> | Group<T>
): conversation is Group<T> {
  return 'name' in conversation && conversation.name !== undefined;
}

/**
 * Type guard to check if a conversation is a DM (Direct Message)
 */
export function isDmConversation<T>(
  conversation: Dm<T> | Group<T>
): conversation is Dm<T> {
  return !isGroupConversation(conversation);
}

/**
 * Type guard to check if a value is a valid XMTP error
 */
export function isXMTPError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if an error is an identity sync error
 */
export function isIdentitySyncError(error: unknown): boolean {
  if (!isXMTPError(error)) return false;
  return error.message.includes('identity synchronization') ||
         error.message.includes('IdentitySyncFailed');
}

/**
 * Type guard to check if an error is an inbox validation error
 */
export function isInboxValidationError(error: unknown): boolean {
  if (!isXMTPError(error)) return false;
  return error.message.includes('InboxValidationFailed');
}

/**
 * Type guard to check if an error is an account already associated error
 */
export function isAccountAlreadyAssociatedError(error: unknown): boolean {
  if (!isXMTPError(error)) return false;
  return error.message.includes('AccountAlreadyAssociated') ||
         error.message.includes('already associated with another inbox');
}

/**
 * Type guard to check if an error is an installation limit error
 */
export function isInstallationLimitError(error: unknown): boolean {
  if (!isXMTPError(error)) return false;
  return error.message.includes('installation limit') ||
         error.message.includes('InstallationLimitExceeded');
}
