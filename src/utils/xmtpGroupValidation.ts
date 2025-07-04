import { Client } from '@xmtp/browser-sdk';

/**
 * Simple group validation for XMTP groups
 */
export async function validateGroupMembership(_client: Client, group: any) {
  try {
    console.log('🔍 Validating group membership...');
    
    // Check if group has canSend method
    if (typeof group.canSend === 'function') {
      const canSend = await group.canSend();
      console.log('✅ Group canSend:', canSend);
      return {
        canSend,
        isPublished: canSend,
        memberCount: group.members?.length || 0,
        members: group.members || []
      };
    }
    
    // Fallback: basic validation
    const memberCount = Array.isArray(group.members) ? group.members.length : 0;
    const canSend = memberCount >= 2;
    
    console.log('📋 Basic group validation:', { memberCount, canSend });
    
    return {
      isPublished: true,
      memberCount,
      canSend,
      members: group.members || []
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
 * Check if conversation can send messages
 */
export async function getCanSendStatus(client: Client, conversation: any) {
  // For DMs
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
  
  // For groups
  const groupValidation = await validateGroupMembership(client, conversation);
  return {
    canSend: groupValidation.canSend,
    reason: groupValidation.canSend 
      ? `Group ready (${groupValidation.memberCount} members)`
      : groupValidation.error || 'Group not ready'
  };
}