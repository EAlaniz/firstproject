import React, { useState, useEffect } from 'react';
import { useXMTP } from '../hooks/useXMTP';
import { MessageCircle, Send, Users, Plus, Trophy, Target, Zap } from 'lucide-react';

interface XMTPMessagingProps {
  currentSteps: number;
  dailyGoal: number;
  isGoalReached: boolean;
}

export default function XMTPMessaging({ currentSteps, dailyGoal, isGoalReached }: XMTPMessagingProps) {
  const { 
    conversations, 
    messages, 
    isInitializing, 
    isEnabled, 
    sendMessage, 
    shareAchievement, 
    sendStepChallenge, 
    shareDailyProgress,
    loadMessages,
    startConversation 
  } = useXMTP();

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newPeerAddress, setNewPeerAddress] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [activeTab, setActiveTab] = useState<'conversations' | 'quick_actions'>('conversations');

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation, loadMessages]);

  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return;

    try {
      await sendMessage(selectedConversation, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartConversation = async () => {
    if (!newPeerAddress.trim()) return;

    try {
      await startConversation(newPeerAddress.trim());
      setNewPeerAddress('');
      setShowNewConversation(false);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!selectedConversation) return;

    try {
      switch (action) {
        case 'share_progress':
          await shareDailyProgress(selectedConversation, currentSteps, dailyGoal);
          break;
        case 'share_achievement':
          if (isGoalReached) {
            await shareAchievement(selectedConversation, 'Daily Goal Complete', currentSteps);
          }
          break;
        case 'send_challenge':
          await sendStepChallenge(selectedConversation, 15000, '24 hours');
          break;
      }
    } catch (error) {
      console.error('Failed to send quick action:', error);
    }
  };

  if (!isEnabled) {
    return (
      <div className="bg-gray-900 border-4 border-gray-600 p-6 mb-6 opacity-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 mx-auto mb-4 flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-2">XMTP MESSAGING</h3>
          <p className="text-gray-400 text-sm mb-4">
            {isInitializing ? 'Initializing secure messaging...' : 'Connect your wallet to enable messaging'}
          </p>
          {isInitializing && (
            <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin mx-auto"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-4 border-purple-400 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-purple-400 flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span>SECURE MESSAGING</span>
        </h3>
        <button
          onClick={() => setShowNewConversation(true)}
          className="text-purple-400 hover:text-purple-300 transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-4 py-2 border-2 transition-colors ${
            activeTab === 'conversations'
              ? 'border-purple-400 bg-purple-400 text-black'
              : 'border-gray-600 text-gray-400 hover:border-purple-400'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          CHATS
        </button>
        <button
          onClick={() => setActiveTab('quick_actions')}
          className={`px-4 py-2 border-2 transition-colors ${
            activeTab === 'quick_actions'
              ? 'border-purple-400 bg-purple-400 text-black'
              : 'border-gray-600 text-gray-400 hover:border-purple-400'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          QUICK SHARE
        </button>
      </div>

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="border-2 border-purple-400 p-4 mb-4 bg-purple-400 bg-opacity-10">
          <h4 className="font-bold text-purple-400 mb-2">Start New Conversation</h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={newPeerAddress}
              onChange={(e) => setNewPeerAddress(e.target.value)}
              placeholder="Enter wallet address or ENS name"
              className="flex-1 bg-gray-800 border-2 border-gray-600 text-white px-3 py-2 focus:border-purple-400 focus:outline-none"
            />
            <button
              onClick={handleStartConversation}
              className="bg-purple-400 text-black px-4 py-2 font-bold hover:bg-purple-300 transition-colors"
            >
              START
            </button>
            <button
              onClick={() => setShowNewConversation(false)}
              className="bg-gray-600 text-white px-4 py-2 font-bold hover:bg-gray-500 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {activeTab === 'conversations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Conversations List */}
          <div className="border-2 border-gray-600 p-4 max-h-64 overflow-y-auto">
            <h4 className="font-bold text-white mb-3">Conversations</h4>
            {conversations.length === 0 ? (
              <p className="text-gray-400 text-sm">No conversations yet. Start one!</p>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.peerAddress}
                    onClick={() => setSelectedConversation(conv.peerAddress)}
                    className={`p-3 border-2 cursor-pointer transition-colors ${
                      selectedConversation === conv.peerAddress
                        ? 'border-purple-400 bg-purple-400 bg-opacity-10'
                        : 'border-gray-600 hover:border-purple-400'
                    }`}
                  >
                    <div className="font-bold text-white text-sm">
                      {conv.peerENS || `${conv.peerAddress.slice(0, 6)}...${conv.peerAddress.slice(-4)}`}
                    </div>
                    {conv.lastMessage && (
                      <div className="text-xs text-gray-400 truncate">
                        {conv.lastMessage.content}
                      </div>
                    )}
                    {conv.unreadCount > 0 && (
                      <div className="w-4 h-4 bg-purple-400 rounded-full text-xs text-black flex items-center justify-center">
                        {conv.unreadCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="border-2 border-gray-600 p-4">
            {selectedConversation ? (
              <div className="h-64 flex flex-col">
                <div className="flex-1 overflow-y-auto mb-3 space-y-2">
                  {(messages[selectedConversation] || []).map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 border-2 ${
                        message.senderAddress.toLowerCase() === selectedConversation.toLowerCase()
                          ? 'border-blue-400 bg-blue-400 bg-opacity-10 ml-4'
                          : 'border-green-400 bg-green-400 bg-opacity-10 mr-4'
                      }`}
                    >
                      <div className="text-white text-sm">{message.content}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-2 border-gray-600 text-white px-3 py-2 focus:border-purple-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-purple-400 text-black px-4 py-2 font-bold hover:bg-purple-300 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quick_actions' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => handleQuickAction('share_progress')}
              disabled={!selectedConversation}
              className="bg-blue-600 text-white p-4 font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Target className="w-5 h-5" />
              <span>SHARE PROGRESS</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('share_achievement')}
              disabled={!selectedConversation || !isGoalReached}
              className="bg-yellow-600 text-white p-4 font-bold hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>SHARE ACHIEVEMENT</span>
            </button>
            
            <button
              onClick={() => handleQuickAction('send_challenge')}
              disabled={!selectedConversation}
              className="bg-red-600 text-white p-4 font-bold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5" />
              <span>SEND CHALLENGE</span>
            </button>
          </div>
          
          {!selectedConversation && (
            <p className="text-gray-400 text-sm text-center">
              Select a conversation to use quick actions
            </p>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        🔒 End-to-end encrypted messaging powered by XMTP
      </div>
    </div>
  );
}