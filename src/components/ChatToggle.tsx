import React from 'react';
import { useXMTP } from '../contexts/XMTPContext';
import DMChat from './DMChat';
import GroupChat from './GroupChat';

interface ChatToggleProps {
  conversationId: string | null;
  onRetry?: (msg: any) => void;
}

const ChatToggle: React.FC<ChatToggleProps> = ({ conversationId, onRetry }) => {
  const { conversations } = useXMTP();

  // If no conversation is selected, show placeholder
  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="mb-2">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  // Find the conversation to determine its type
  const conversation = conversations.find(c => c.id === conversationId);
  
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Enhanced conversation type detection that works with both fresh XMTP objects and cached plain objects
  const isGroup = (() => {
    console.log('🔍 ChatToggle: Analyzing conversation object:', {
      id: conversation.id,
      hasMembers: 'members' in conversation,
      membersType: 'members' in conversation ? typeof conversation.members : 'N/A',
      membersValue: 'members' in conversation ? conversation.members : 'N/A',
      hasKind: 'kind' in conversation,
      kindValue: 'kind' in conversation ? (conversation as any).kind : 'N/A',
      idLength: conversation.id.length,
      isLongId: conversation.id.length > 20
    });

    // Method 1: Check for 'kind' property (most reliable)
    if ('kind' in conversation && typeof (conversation as any).kind === 'string') {
      const isGroupByKind = (conversation as any).kind === 'group';
      console.log('🔍 Conversation type:', isGroupByKind ? 'Group' : 'DM', '(detected via kind property)');
      return isGroupByKind;
    }
    
    // Method 2: Check for 'members' property (but be more careful)
    if ('members' in conversation) {
      // If members is an array with multiple items, it's likely a group
      if (Array.isArray(conversation.members) && conversation.members.length > 1) {
        console.log('🔍 Conversation type: Group (detected via members array with multiple items)');
        return true;
      }
      // If members is an array with 1 item, it might be a DM with cached data
      if (Array.isArray(conversation.members) && conversation.members.length === 1) {
        console.log('🔍 Conversation type: DM (detected via members array with single item - likely cached DM)');
        return false;
      }
      // If members is not an array, it might be a DM with cached data
      console.log('🔍 Conversation type: DM (detected via non-array members - likely cached DM)');
      return false;
    }
    
    // Method 3: Check conversation ID pattern (fallback)
    // Group IDs are typically longer and have a specific pattern
    // DM IDs are usually shorter and represent the peer address
    const isGroupById = conversationId.length > 20; // Heuristic: group IDs are longer
    console.log('🔍 Conversation type:', isGroupById ? 'Group' : 'DM', '(detected via ID length heuristic)');
    return isGroupById;
  })();

  console.log('🎯 ChatToggle: Rendering', isGroup ? 'GroupChat' : 'DMChat', 'for conversation:', conversationId);

  // Render the appropriate chat component
  if (isGroup) {
    return <GroupChat conversationId={conversationId} onRetry={onRetry} />;
  } else {
    return <DMChat conversationId={conversationId} onRetry={onRetry} />;
  }
};

export default ChatToggle; 