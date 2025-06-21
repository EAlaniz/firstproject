import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, Users, Plus, X, Search, Circle, Trophy, Target, Zap, ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  senderAddress: string;
  senderName?: string;
  timestamp: Date;
  type: 'text' | 'achievement' | 'challenge' | 'progress';
}

interface Conversation {
  peerAddress: string;
  peerName?: string;
  lastMessage?: Message;
  unreadCount: number;
  isOnline?: boolean;
}

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentSteps: number;
  dailyGoal: number;
  isGoalReached: boolean;
  currentStreak: number;
}

export default function MessagingPanel({ 
  isOpen, 
  onClose, 
  currentSteps, 
  dailyGoal, 
  isGoalReached, 
  currentStreak 
}: MessagingPanelProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'community' | 'challenges'>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');

  // Mock data - in real implementation, this would come from messaging service
  const [conversations] = useState<Conversation[]>([
    {
      peerAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
      peerName: 'Alex Walker',
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
  ]);

  const [messages] = useState<Record<string, Message[]>>({
    '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1': [
      {
        id: '1',
        content: 'Hey! How\'s your step goal going today?',
        senderAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
        senderName: 'Alex Walker',
        timestamp: new Date(Date.now() - 7200000),
        type: 'text'
      },
      {
        id: '2',
        content: `Going great! At ${currentSteps.toLocaleString()} steps so far 🚶‍♂️`,
        senderAddress: 'me',
        timestamp: new Date(Date.now() - 3600000),
        type: 'progress'
      },
      {
        id: '3',
        content: 'Just hit 15K steps! 🚶‍♂️',
        senderAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
        senderName: 'Alex Walker',
        timestamp: new Date(Date.now() - 1800000),
        type: 'achievement'
      }
    ]
  });

  const [communityFeed] = useState([
    {
      id: '1',
      user: 'Alex Walker',
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1',
      content: 'Just completed a 5-mile morning walk! Perfect way to start the day 🌅',
      steps: 12500,
      timestamp: new Date(Date.now() - 1800000),
      likes: 23,
      comments: 5
    },
    {
      id: '2',
      user: 'Sarah Fitness',
      address: '0x8ba1f109551bD432803012645Hac136c30C6213',
      content: 'Week 3 of my 10K daily goal streak! Feeling stronger every day 💪',
      steps: 10800,
      timestamp: new Date(Date.now() - 3600000),
      likes: 18,
      comments: 3
    },
    {
      id: '3',
      user: 'Mike Runner',
      address: '0x9cd2f109551bD432803012645Hac136c30C6214',
      content: 'Anyone up for a weekend hiking challenge? Looking for accountability partners!',
      steps: 8900,
      timestamp: new Date(Date.now() - 5400000),
      likes: 31,
      comments: 12
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // In real implementation, this would use messaging service to send the message
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const handleQuickShare = (type: 'progress' | 'achievement' | 'challenge') => {
    if (!selectedConversation) return;

    let content = '';
    switch (type) {
      case 'progress':
        content = `📊 Daily Progress: ${currentSteps.toLocaleString()}/${dailyGoal.toLocaleString()} steps (${Math.round((currentSteps / dailyGoal) * 100)}%)`;
        break;
      case 'achievement':
        if (isGoalReached) {
          content = `🏆 Just completed my daily goal! ${currentSteps.toLocaleString()} steps done! 💪`;
        }
        break;
      case 'challenge':
        content = `🚀 Step Challenge: Want to see who can hit 15,000 steps first today? Are you in?`;
        break;
    }
    
    if (content) {
      console.log('Sending quick share:', content);
    }
  };

  const handleStartNewChat = () => {
    if (!newChatAddress.trim()) return;
    
    console.log('Starting new chat with:', newChatAddress);
    setNewChatAddress('');
    setShowNewChat(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl h-[90vh] sm:h-[80vh] flex overflow-hidden sm:rounded-2xl rounded-t-2xl">
        {/* Sidebar */}
        <div className="w-full sm:w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-medium">Messages</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('conversations')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'conversations'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setActiveTab('community')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'community'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('challenges')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'challenges'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Challenges
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'conversations' && (
              <div className="p-3 sm:p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                </div>

                {/* New Chat Button */}
                <button
                  onClick={() => setShowNewChat(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">New Chat</span>
                </button>

                {/* Conversations List */}
                {conversations.map((conv) => (
                  <button
                    key={conv.peerAddress}
                    onClick={() => {
                      setSelectedConversation(conv.peerAddress);
                      // On mobile, hide sidebar when conversation is selected
                      if (window.innerWidth < 640) {
                        // This would need additional state management for mobile view
                      }
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedConversation === conv.peerAddress
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs sm:text-sm font-medium">
                            {conv.peerName?.charAt(0) || conv.peerAddress.slice(2, 4).toUpperCase()}
                          </span>
                        </div>
                        {conv.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate text-sm">
                            {conv.peerName || `${conv.peerAddress.slice(0, 6)}...${conv.peerAddress.slice(-4)}`}
                          </p>
                          {conv.unreadCount > 0 && (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-black rounded-full flex items-center justify-center">
                              <span className="text-xs text-white">{conv.unreadCount}</span>
                            </div>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {conv.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'community' && (
              <div className="p-3 sm:p-4 space-y-4">
                {communityFeed.map((post) => (
                  <div key={post.id} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {post.user.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{post.user}</p>
                        <p className="text-xs text-gray-600">
                          {post.steps.toLocaleString()} steps • {post.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm mb-3">{post.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-600">
                      <span>{post.likes} likes</span>
                      <span>{post.comments} comments</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'challenges' && (
              <div className="p-3 sm:p-4 space-y-4">
                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">Weekend Step Challenge</h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    First to reach 20,000 steps wins 50 tokens
                  </p>
                  <div className="text-xs text-gray-500">
                    3 participants • Ends in 2 days
                  </div>
                </div>

                <div className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">7-Day Streak Challenge</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Upcoming</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Maintain your daily goal for 7 consecutive days
                  </p>
                  <div className="text-xs text-gray-500">
                    Starts Monday • 12 participants
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area - Hidden on mobile when no conversation selected */}
        <div className={`flex-1 flex-col ${selectedConversation ? 'flex' : 'hidden sm:flex'}`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="sm:hidden p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="font-medium text-sm">
                        {conversations.find(c => c.peerAddress === selectedConversation)?.peerName?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {conversations.find(c => c.peerAddress === selectedConversation)?.peerName || 'Unknown User'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {conversations.find(c => c.peerAddress === selectedConversation)?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex space-x-1 sm:space-x-2">
                    <button
                      onClick={() => handleQuickShare('progress')}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Share Progress"
                    >
                      <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                    {isGoalReached && (
                      <button
                        onClick={() => handleQuickShare('achievement')}
                        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Share Achievement"
                      >
                        <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleQuickShare('challenge')}
                      className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Send Challenge"
                    >
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
                {(messages[selectedConversation] || []).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderAddress === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-2xl ${
                        message.senderAddress === 'me'
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-black'
                      }`}
                    >
                      {message.type === 'achievement' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs font-medium">Achievement</span>
                        </div>
                      )}
                      {message.type === 'progress' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs font-medium">Progress Update</span>
                        </div>
                      )}
                      {message.type === 'challenge' && (
                        <div className="flex items-center space-x-2 mb-1">
                          <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs font-medium">Challenge</span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderAddress === 'me' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <div className="flex space-x-2 sm:space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 sm:px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-2">Select a conversation</h3>
                  <p className="text-sm text-gray-600">Choose a chat to start messaging</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Start New Chat</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={newChatAddress}
                onChange={(e) => setNewChatAddress(e.target.value)}
                placeholder="Enter wallet address or ENS name"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartNewChat}
                  disabled={!newChatAddress.trim()}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}