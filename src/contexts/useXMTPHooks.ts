import { useXMTP } from './SimpleXMTPContext';

export const useXMTPClient = () => {
  const { client } = useXMTP();
  return client;
};

export const useXMTPInitialized = () => {
  const { isInitialized } = useXMTP();
  return isInitialized;
};

export const useXMTPError = () => {
  const { error, clearError } = useXMTP();
  return { error, clearError };
}; 