import { useXMTP } from '../contexts/useXMTPContext';

/**
 * Hook to get XMTP client
 */
export const useXMTPClient = () => {
  const { client } = useXMTP();
  return client;
};

/**
 * Hook to get XMTP error state
 */
export const useXMTPError = () => {
  const { error, clearError } = useXMTP();
  return { error, clearError };
};

/**
 * Hook to get XMTP initialization state
 */
export const useXMTPInitialized = () => {
  const { isInitialized } = useXMTP();
  return isInitialized;
};

/**
 * Hook to get XMTP connection state
 */
export const useXMTPConnection = () => {
  const { isConnecting } = useXMTP();
  return isConnecting;
}; 