import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';

export interface XMTPMessage {
  id: string;
  content: string;
  senderAddress: string;
  senderName?: string;
  timestamp: Date;
  type: 'text' | 'achievement' | 'challenge' | 'progress';
}

export interface XMTPConversation {
  peerAddress: string;
  peerName?: string;
  peerENS?: string;
  lastMessage?: XMTPMessage;
  unreadCount: number;
  isOnline?: boolean;
}

export interface CommunityPost {
  id: string;
  user: string;
  address: string;
  content: string;
  steps: number;
  timestamp: Date;
  likes: number;
  comments: number;
  type?: 'achievement' | 'progress' | 'challenge' | 'general';
}

export function useXMTP() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [client, setClient] = useState<any>(null);
  const [conversations, setConversations] = useState<XMTPConversation[]>([]);
  const [messages, setMessages] = useState<Record<string, XMTPMessage[]>>({});
  const [communityFeed, setCommunityFeed] = useState<CommunityPost[]>([]);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  // Initialize XMTP client
  const initializeXMTP = useCallback(async () => {
    if (!walletClient || !address || !isConnected) {
      return;
    }

    setIsInitializing(true);
    
    try {
      // Simulate XMTP initialization
      console.log('Initializing XMTP client...');
      
      // In real implementation, you would use:
      // const xmtp = await Client.create(walletClient, { env: 'production' });
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setClient({ address }); // Mock client
      setIsEnabled(true);
      
      // Load initial data
      await loadConversations();
      await loadCommunityFeed();
      
      console.log('XMTP initialized successfully');
    } catch (error) {
      console.error('Failed to initialize XMTP:', error);
      setIsEnabled(false);
    } finally {
      setIsInitializing(false);
    }
  }, [walletClient, address, isConnected]);

  // Load conversations
  const loadConversations = async () => {
    try {
      // Mock conversations data
      const mockConversations: XMTPConversation[] = [
        {
          peerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
          peerName: 'Alex Walker',
          peerENS: 'alex.eth',
          lastMessage: {
            id: '1',
            content: 'Just hit 15K steps! 🚶‍♂️',
            senderAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
            timestamp: new Date(Date.now() - 1800000),
            type: 'achievement'
          },
          unreadCount: 1,
          isOnline: true
        },
        {
          peerAddress: '0x8ba1f109551bD432803012645Hac136c30C6213',
          peerName: 'Sarah Fitness',
          peerENS: 'sarah.eth',
          lastMessage: {
            id: '2',
            content: 'Want to do a step challenge this week?',
            senderAddress: '0x8ba1f109551bD432803012645Hac136c30C6213',
            timestamp: new Date(Date.now() - 3600000),
            type: 'challenge'
          },
          unreadCount: 0,
          isOnline: false
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  // Load community feed
  const loadCommunityFeed = async () => {
    try {
      const mockFeed: CommunityPost[] = [
        {
          id: '1',
          user: 'Alex Walker',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
          content: 'Just completed a 5-mile morning walk! Perfect way to start the day 🌅',
          steps: 12500,
          timestamp: new Date(Date.now() - 1800000),
          likes: 23,
          comments: 5,
          type: 'achievement'
        },
        {
          id: '2',
          user: 'Sarah Fitness',
          address: '0x8ba1f109551bD432803012645Hac136c30C6213',
          content: 'Week 3 of my 10K daily goal streak! Feeling stronger every day 💪',
          steps: 10800,
          timestamp: new Date(Date.now() - 3600000),
          likes: 18,
          comments: 3,
          type: 'progress'
        },
        {
          id: '3',
          user: 'Mike Runner',
          address: '0x9cd2f109551bD432803012645Hac136c30C6214',
          content: 'Anyone up for a weekend hiking challenge? Looking for accountability partners!',
          steps: 8900,
          timestamp: new Date(Date.now() - 5400000),
          likes: 31,
          comments: 12,
          type: 'challenge'
        }
      ];
      
      setCommunityFeed(mockFeed);
    } catch (error) {
      console.error('Failed to load community feed:', error);
    }
  };

  // Send message
  const sendMessage = async (
    peerAddress: string, 
    content: string, 
    type: 'text' | 'achievement' | 'challenge' | 'progress' = 'text'
  ) => {
    if (!client || !address) {
      throw new Error('XMTP not initialized');
    }

    try {
      const message: XMTPMessage = {
        id: `${Date.now()}-${Math.random()}`,
        content,
        senderAddress: address,
        timestamp: new Date(),
        type
      };
      
      // Update local messages
      setMessages(prev => ({
        ...prev,
        [peerAddress]: [...(prev[peerAddress] || []), message]
      }));
      
      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv.peerAddress === peerAddress 
          ? { ...conv, lastMessage: message }
          : conv
      ));
      
      console.log('Message sent:', content);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };

  // Share achievement
  const shareAchievement = async (peerAddress: string, achievement: string, steps: number) => {
    const content = `🏆 Just unlocked "${achievement}" with ${steps.toLocaleString()} steps! Keep moving! 💪`;
    await sendMessage(peerAddress, content, 'achievement');
  };

  // Send step challenge
  const sendStepChallenge = async (peerAddress: string, targetSteps: number, duration: string) => {
    const content = `🚀 Step Challenge: Let's see who can hit ${targetSteps.toLocaleString()} steps first! Duration: ${duration}. Are you in? 💪`;
    await sendMessage(peerAddress, content, 'challenge');
  };

  // Share daily progress
  const shareDailyProgress = async (peerAddress: string, steps: number, goal: number) => {
    const percentage = Math.round((steps / goal) * 100);
    const content = `📊 Daily Progress: ${steps.toLocaleString()}/${goal.toLocaleString()} steps (${percentage}%) 🚶‍♂️`;
    await sendMessage(peerAddress, content, 'progress');
  };

  // Load messages for a conversation
  const loadMessages = async (peerAddress: string) => {
    if (!client) return;

    try {
      // Mock messages for the conversation
      const mockMessages: XMTPMessage[] = [
        {
          id: '1',
          content: 'Hey! How\'s your step goal going today?',
          senderAddress: peerAddress,
          timestamp: new Date(Date.now() - 7200000),
          type: 'text'
        },
        {
          id: '2',
          content: 'Going great! Already at 8,000 steps 🚶‍♂️',
          senderAddress: address || '',
          timestamp: new Date(Date.now() - 3600000),
          type: 'progress'
        }
      ];
      
      setMessages(prev => ({
        ...prev,
        [peerAddress]: mockMessages
      }));
      
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // Start new conversation
  const startConversation = async (peerAddress: string) => {
    if (!client) {
      throw new Error('XMTP not initialized');
    }

    try {
      const newConversation: XMTPConversation = {
        peerAddress,
        peerENS: undefined,
        unreadCount: 0,
        isOnline: false
      };
      
      setConversations(prev => [newConversation, ...prev]);
      
      console.log('Conversation started');
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    }
  };

  // Post to community feed
  const postToCommunity = async (content: string, type: 'achievement' | 'progress' | 'challenge' | 'general' = 'general') => {
    if (!client || !address) {
      throw new Error('XMTP not initialized');
    }

    try {
      const post: CommunityPost = {
        id: `${Date.now()}-${Math.random()}`,
        user: 'You', // Would be resolved from ENS or profile
        address,
        content,
        steps: 0, // Would be current steps
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        type
      };
      
      setCommunityFeed(prev => [post, ...prev]);
      
      console.log('Posted to community:', content);
    } catch (error) {
      console.error('Failed to post to community:', error);
      throw error;
    }
  };

  // Initialize on wallet connection
  useEffect(() => {
    if (isConnected && walletClient && !client) {
      initializeXMTP();
    }
  }, [isConnected, walletClient, client, initializeXMTP]);

  return {
    client,
    conversations,
    messages,
    communityFeed,
    isInitializing,
    isEnabled,
    initializeXMTP,
    sendMessage,
    shareAchievement,
    sendStepChallenge,
    shareDailyProgress,
    loadMessages,
    startConversation,
    postToCommunity,
    loadConversations,
    loadCommunityFeed
  };
}