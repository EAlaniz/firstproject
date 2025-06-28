import { Client, Group } from '@xmtp/browser-sdk';

/**
 * AGGRESSIVE group membership validation with forced publishing
 * This approach forcibly publishes membership regardless of isPublished() status,
 * then retries canSend() up to 10 times with delays to handle eventual consistency
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
  
  console.log('🚀 Starting AGGRESSIVE group membership validation...');
  
  try {
    // STEP 1: Force publish membership regardless of current status
    console.log('📤 Force publishing group membership...');
    try {
      // Try to publish membership even if it's already published
      // This ensures eventual consistency across the network
      const groupAny = group as any;
      if (typeof groupAny.publishMembership === 'function') {
        await groupAny.publishMembership();
        console.log('✅ Membership publish attempt completed');
      } else {
        console.log('⚠️ publishMembership method not available, continuing...');
      }
    } catch (publishError) {
      console.log('⚠️ Membership publish failed (non-critical):', publishError);
      // Continue anyway - the membership might already be published
    }
    
    // STEP 2: Wait a moment for backend propagation
    console.log('⏳ Waiting for backend propagation...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // STEP 3: Check initial canSend status
    let canSend = false;
    try {
      const groupAny = group as any;
      canSend = await groupAny.canSend();
      console.log(`🔍 Initial canSend check: ${canSend}`);
    } catch (error) {
      console.log('⚠️ Initial canSend check failed:', error);
    }
    
    // STEP 4: Retry canSend with delays to handle eventual consistency
    while (!canSend && retries < maxRetries) {
      retries++;
      console.log(`⏳ Group not ready (attempt ${retries}/${maxRetries}), retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Re-check canSend status
      try {
        const groupAny = group as any;
        canSend = await groupAny.canSend();
        console.log(`🔍 Retry ${retries}: canSend=${canSend}`);
        
        if (canSend) {
          console.log('✅ Group is now ready to send messages!');
          break;
        }
      } catch (error) {
        console.log(`⚠️ canSend check failed on retry ${retries}:`, error);
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    const result = {
      canSend,
      membershipIsPublished: canSend, // If canSend is true, membership is considered published
      retries,
      totalTime
    };
    
    if (canSend) {
      console.log(`✅ AGGRESSIVE group validation successful after ${retries} retries (${totalTime}ms)`);
    } else {
      console.warn(`⚠️ AGGRESSIVE group validation failed after ${retries} retries (${totalTime}ms)`);
    }
    
    return result;
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('❌ AGGRESSIVE group validation error:', error);
    
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