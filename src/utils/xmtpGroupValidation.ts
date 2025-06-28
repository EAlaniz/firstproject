import { Client, Group, GroupMessage } from '@xmtp/browser-sdk';

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
    // First, ensure membership is published
    const membership = await group.membership();
    const published = await membership.isPublished();
    
    if (!published) {
      console.log('📢 Publishing group membership...');
      await membership.publish();
      console.log('✅ Membership published, waiting for sync...');
    } else {
      console.log('✅ Membership already published');
    }
    
    // Smart retry loop for canSend
    let canSend = await group.canSend();
    console.log(`🔍 Initial canSend check: ${canSend}`);
    
    while (!canSend && retries < maxRetries) {
      retries++;
      console.log(`⏳ Group not ready (attempt ${retries}/${maxRetries}), retrying in ${retryDelay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Re-check both canSend and membership status
      canSend = await group.canSend();
      const membershipIsPublished = await membership.isPublished();
      
      console.log(`🔍 Retry ${retries}: canSend=${canSend}, membershipIsPublished=${membershipIsPublished}`);
      
      if (canSend) {
        console.log('✅ Group is now ready to send messages!');
        break;
      }
    }
    
    const totalTime = Date.now() - startTime;
    const finalMembershipIsPublished = await membership.isPublished();
    
    const result = {
      canSend,
      membershipIsPublished: finalMembershipIsPublished,
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
      // For DMs, just check canSend directly
      const canSend = await conversation.canSend();
      return {
        canSend,
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
        const canMessage = await client.canMessage(peerAddress);
        return { canSend: canMessage, reason: canMessage ? 'DM ready' : 'Recipient not registered' };
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

export function GroupChat({ client, groupId }: { client: any, groupId: string }) {
  const { group, messages, canSend, loading, error } = useGroupWithRetry(client, groupId);

  const handleSend = async (text: string) => {
    if (!group || !canSend) {
      toast.error('Cannot send message - group not ready');
      return;
    }
    
    try {
      await group.send(text);
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message');
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">❌ Error loading group: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>
      
      <div className="border-t p-4">
        {loading ? (
          <p className="text-gray-500 italic">Loading group chat…</p>
        ) : canSend ? (
          <MessageComposer onSend={handleSend} />
        ) : (
          <p className="text-yellow-600 font-medium">
            ⏳ Group syncing… messaging will be available shortly.
          </p>
        )}
      </div>
    </div>
  );
}

interface UseGroupWithRetryResult {
  group: Group<string> | null;
  messages: GroupMessage<string>[];
  canSend: boolean;
  loading: boolean;
  error?: string;
} 