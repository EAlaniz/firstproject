import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useXMTP } from '../contexts/XMTPContext';
import { getCanSendStatusWithRetry } from '../utils/xmtpGroupValidation';

interface GroupState {
  canSend: boolean;
  membershipIsPublished: boolean;
  isRetrying: boolean;
  retryCount: number;
  lastError: string | null;
  lastSyncTime: number | null;
}

interface UseGroupWithRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  autoRetry?: boolean;
  onStateChange?: (state: GroupState) => void;
}

export function useGroupWithRetry(
  conversationId: string | null,
  options: UseGroupWithRetryOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 2000,
    autoRetry = true,
    onStateChange
  } = options;

  const { address } = useAccount();
  const { client, conversations } = useXMTP();
  const [state, setState] = useState<GroupState>({
    canSend: false,
    membershipIsPublished: false,
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    lastSyncTime: null
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  const validateAndSync = useCallback(async (forceRetry = false): Promise<GroupState> => {
    if (!client || !conversationId || !address) {
      return {
        canSend: false,
        membershipIsPublished: false,
        isRetrying: false,
        retryCount: 0,
        lastError: 'Missing client, conversation, or address',
        lastSyncTime: null
      };
    }

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
      return {
        canSend: false,
        membershipIsPublished: false,
        isRetrying: false,
        retryCount: 0,
        lastError: 'Conversation not found',
        lastSyncTime: null
      };
    }

    // 🚨 CRITICAL FIX: Check if this is actually a group conversation
    const isGroup = 'members' in conversation;
    if (!isGroup) {
      console.log('✅ This is a DM conversation, skipping group validation');
      return {
        canSend: true, // DMs can always send if conversation exists
        membershipIsPublished: true,
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        lastSyncTime: Date.now()
      };
    }

    try {
      console.log(`🔍 Validating group membership for ${conversationId} (attempt ${state.retryCount + 1})`);
      
      // Use the existing enhanced validation function
      const validation = await getCanSendStatusWithRetry(
        client, 
        conversation,
        maxRetries,
        retryDelay
      );
      
      console.log('📊 Group validation result:', {
        canSend: validation.canSend,
        isGroup: validation.isGroup,
        retries: validation.retries,
        totalTime: validation.totalTime,
        error: validation.error
      });

      const newState: GroupState = {
        canSend: validation.canSend,
        membershipIsPublished: validation.canSend, // If canSend is true, membership is published
        isRetrying: false,
        retryCount: 0, // Reset on success
        lastError: validation.error || null,
        lastSyncTime: Date.now()
      };

      if (isMountedRef.current) {
        setState(newState);
      }

      return newState;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Group validation failed (attempt ${state.retryCount + 1}):`, error);

      const newState: GroupState = {
        canSend: false,
        membershipIsPublished: false,
        isRetrying: false,
        retryCount: state.retryCount + 1,
        lastError: errorMessage,
        lastSyncTime: null
      };

      if (isMountedRef.current) {
        setState(newState);
      }

      return newState;
    }
  }, [client, conversationId, address, conversations, state.retryCount, maxRetries, retryDelay]);

  const retry = useCallback(async () => {
    if (state.isRetrying) return;

    setState(prev => ({ ...prev, isRetrying: true }));

    const result = await validateAndSync(true);

    // Auto-retry logic
    if (!result.canSend && autoRetry && result.retryCount < maxRetries) {
      console.log(`🔄 Auto-retrying in ${retryDelay}ms (${result.retryCount}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(async () => {
        if (isMountedRef.current) {
          await retry();
        }
      }, retryDelay);
    } else {
      setState(prev => ({ ...prev, isRetrying: false }));
    }
  }, [state.isRetrying, validateAndSync, autoRetry, maxRetries, retryDelay]);

  // Initial validation when conversation changes
  useEffect(() => {
    if (conversationId && client && address) {
      console.log(`🔄 Initial validation for ${conversationId}`);
      validateAndSync();
    }
  }, [conversationId, client, address, validateAndSync]);

  // Manual retry function
  const manualRetry = useCallback(async () => {
    console.log('🔄 Manual retry triggered');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState(prev => ({ ...prev, retryCount: 0, lastError: null }));
    await retry();
  }, [retry]);

  // Force refresh function
  const refresh = useCallback(async () => {
    console.log('🔄 Force refresh triggered');
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setState(prev => ({ 
      ...prev, 
      retryCount: 0, 
      lastError: null, 
      lastSyncTime: null 
    }));
    await validateAndSync(true);
  }, [validateAndSync]);

  return {
    ...state,
    retry: manualRetry,
    refresh,
    isGroup: conversationId ? conversations.some(c => c.id === conversationId && 'members' in c) : false
  };
} 