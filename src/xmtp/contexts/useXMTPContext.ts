import { useContext } from 'react';
import { XMTPContext } from './XMTPContext';
import type { XMTPContextValue } from '../types';

export const useXMTP = (): XMTPContextValue => {
  const context = useContext(XMTPContext);
  if (!context) {
    throw new Error('useXMTP must be used within an XMTPProvider');
  }
  return context;
};