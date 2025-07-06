// XMTP V3 Implementation
// Following official XMTP V3 browser-sdk patterns

// Context
export { XMTPProvider } from './contexts/XMTPContext';
export { useXMTP } from './contexts/useXMTPContext';

// Hooks
export { 
  useXMTPClient, 
  useXMTPError, 
  useXMTPInitialized, 
  useXMTPConnection 
} from './hooks/useXMTP';

// Components
export { XMTPMessenger } from './components/XMTPMessenger';

// Types
export type { 
  XMTPContextValue, 
  Message, 
  Conversation, 
  XMTPConfig 
} from './types';

// Utils
export { createEOASigner, validateSigner } from './utils/signer'; 