import { Client, Group } from '@xmtp/browser-sdk';

/**
 * Enhanced group membership validation with smart retry mechanism
 * Handles the lag between membership publishing and canSend availability
 */
export async function validateGroupMembershipWithRetry(
  client: Client, 
  group: Group<string>,
  maxRetries: number = 10,
  retryDelay: number = 2000
): Promise<{
  canSend: boolean;
  membershipIsPublished: boolean;
  retries: number;
  totalTime: number;
}> {
  const startTime = Date.now();
  let retries = 0;
  
  console.log('🔍 Starting enhanced group membership validation...');
  
  try {
    // For XMTP V3, we check if the group has members and no errors
    const hasMembers = group.members && (
      Array.isArray(group.members) ? group.members.length > 0 : 
      typeof group.members === 'object' ? Object.keys(group.members).length > 0 : 
      false
    );
    
    // Check if there are any errors on the group
    const hasErrors = 'error' in group;
    
    // Initial canSend check
    let canSend = hasMembers && !hasErrors;
    console.log(`🔍 Initial canSend check: ${canSend} (members: ${hasMembers}, errors: ${hasErrors})`);
    
    while (!canSend && retries < maxRetries) {
      retries++;
      console.log(`⏳ Group not ready (attempt ${retries}/${maxRetries}), retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Re-check group status
      const currentHasMembers = group.members && (
        Array.isArray(group.members) ? group.members.length > 0 : 
        typeof group.members === 'object' ? Object.keys(group.members).length > 0 : 
        false
      );
      const currentHasErrors = 'error' in group;
      canSend = currentHasMembers && !currentHasErrors;
      
      console.log(`🔍 Retry ${retries}: canSend=${canSend} (members: ${currentHasMembers}, errors: ${currentHasErrors})`);
      
      if (canSend) {
        console.log('✅ Group is now ready to send messages!');
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    const result = {
      canSend,
      membershipIsPublished: canSend, // In XMTP V3, if canSend is true, membership is considered published
      retries,
      totalTime
    };
    
    if (canSend) {
      console.log(`✅ Group validation successful after ${retries} retries (${totalTime}ms)`);
    } else {
      console.warn(`⚠️ Group validation failed after ${retries} retries (${totalTime}ms)`);
    }
    
    return result;
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ Group validation error:', error);
    
    return {
      canSend: false,
      membershipIsPublished: false,
      retries,
      totalTime
    };
  }
}

/**
 * Get canSend status with retry mechanism
 * This is the main function used by the UI to determine if messages can be sent
 */
export async function getCanSendStatusWithRetry(
  client: Client | null, 
  conversation: any,
  maxRetries: number = 10,
  retryDelay: number = 2000
): Promise<{
  canSend: boolean;
  isGroup: boolean;
  retries: number;
  totalTime: number;
  error?: string;
}> {
  if (!client || !conversation) {
    return {
      canSend: false,
      isGroup: false,
      retries: 0,
      totalTime: 0,
      error: 'No client or conversation'
    };
  }
  
  const startTime = Date.now();
  
  try {
    // Check if this is a group conversation
    const isGroup = 'members' in conversation;
    
    if (!isGroup) {
      // For DMs, check if recipient is registered
      const peerAddress = conversation.peerAddress || conversation.id;
      if (peerAddress && peerAddress.startsWith('0x')) {
        try {
          const canMessage = await Client.canMessage([
            { identifier: peerAddress, identifierKind: 'Ethereum' }
          ], 'production');
          const canSend = Array.isArray(canMessage) ? canMessage[0] : !!canMessage;
          return {
            canSend,
            isGroup: false,
            retries: 0,
            totalTime: Date.now() - startTime
          };
        } catch (error) {
          console.error('❌ DM canMessage check failed:', error);
          return {
            canSend: false,
            isGroup: false,
            retries: 0,
            totalTime: Date.now() - startTime,
            error: 'DM check failed'
          };
        }
      }
      return {
        canSend: true,
        isGroup: false,
        retries: 0,
        totalTime: Date.now() - startTime
      };
    }
    
    // For groups, use the enhanced validation with retry
    const validation = await validateGroupMembershipWithRetry(
      client, 
      conversation as Group<string>,
      maxRetries,
      retryDelay
    );
    
    return {
      canSend: validation.canSend,
      isGroup: true,
      retries: validation.retries,
      totalTime: validation.totalTime
    };
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ getCanSendStatusWithRetry error:', error);
    
    return {
      canSend: false,
      isGroup: 'members' in conversation,
      retries: 0,
      totalTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Enhanced group validation that properly checks membership status
 * Works with your existing XMTP V3 implementation
 */
export async function validateGroupMembership(client: Client, group: any) {
  try {
    console.log('🔍 Validating group membership...');
    
    // Check if membership is published using the existing property
    const isPublished = group.membershipIsPublished !== undefined ? group.membershipIsPublished : true;
    console.log('📋 Group membership published:', isPublished);
    
    // If not published, we can't force publish it in this version
    // The XMTP client should handle this automatically
    
    // Get member count
    let memberCount = 0;
    if (Array.isArray(group.members)) {
      memberCount = group.members.length;
    } else if (group.members && typeof group.members === 'object') {
      memberCount = Object.keys(group.members).length;
    }
    console.log('👥 Group member count:', memberCount);
    
    // Determine if we can send messages
    const canSend = isPublished && memberCount >= 2 && !('error' in group);
    console.log('✅ Can send messages:', canSend);
    
    return {
      isPublished,
      memberCount,
      canSend,
      members: group.members
    };
  } catch (error) {
    console.error('❌ Group membership validation failed:', error);
    return {
      isPublished: false,
      memberCount: 0,
      canSend: false,
      members: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Enhanced canSend check that works with your existing logic
 * Legacy function for backward compatibility
 */
export async function getCanSendStatus(client: Client, conversation: any) {
  // For DMs, use the existing canMessage check
  if (!('members' in conversation)) {
    const peerAddress = conversation.peerAddress || conversation.id;
    if (peerAddress && peerAddress.startsWith('0x')) {
      try {
        const canMessage = await Client.canMessage([
          { identifier: peerAddress, identifierKind: 'Ethereum' }
        ], 'production');
        const canSend = Array.isArray(canMessage) ? canMessage[0] : !!canMessage;
        return { canSend, reason: canSend ? 'DM ready' : 'Recipient not registered' };
      } catch (error) {
        console.error('❌ DM canMessage check failed:', error);
        return { canSend: false, reason: 'DM check failed' };
      }
    }
    return { canSend: true, reason: 'DM conversation' };
  }
  
  // For groups, use enhanced validation
  const groupValidation = await validateGroupMembership(client, conversation);
  return {
    canSend: groupValidation.canSend,
    reason: groupValidation.canSend 
      ? `Group ready (${groupValidation.memberCount} members)`
      : groupValidation.error || 'Group not ready'
  };
} 