import React, { useState, useEffect } from 'react';
import { useProfile, useSignIn } from '@farcaster/auth-kit';
import { sdk } from '@farcaster/frame-sdk';
import { 
  User, 
  Share2, 
  MessageCircle, 
  Heart, 
  Trophy, 
  Users, 
  Settings,
  LogOut,
  Plus,
  Camera,
  Edit3,
  Bell,
  Star,
  TrendingUp,
  Award,
  Zap,
  Target,
  Flame,
  Crown
} from 'lucide-react';

interface FarcasterMiniAppProps {
  currentSteps: number;
  dailyGoal: number;
  isGoalReached: boolean;
  currentStreak: number;
  totalTokens: number;
  onShareAchievement: (achievement: any) => void;
}

const FarcasterMiniApp: React.FC<FarcasterMiniAppProps> = ({
  currentSteps,
  dailyGoal,
  isGoalReached,
  currentStreak,
  totalTokens,
  onShareAchievement
}) => {
  const { profile, isAuthenticated } = useProfile();
  const { signIn } = useSignIn({});
  
  const [activeTab, setActiveTab] = useState<'profile' | 'social' | 'achievements' | 'leaderboard'>('profile');
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Initialize Farcaster mini app
  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if we're in a mini app environment
        const isMiniApp = await sdk.isInMiniApp();
        
        if (isMiniApp) {
          // Hide splash screen when ready
          await sdk.actions.ready();
          setIsReady(true);
          
          // Listen for mini app events
          sdk.on('frameAdded', () => {
            console.log('Mini app added by user');
          });
          
          sdk.on('frameRemoved', () => {
            console.log('Mini app removed by user');
          });
          
          sdk.on('notificationsEnabled', () => {
            console.log('Notifications enabled');
          });
          
          sdk.on('notificationsDisabled', () => {
            console.log('Notifications disabled');
          });
        }
      } catch (error) {
        console.error('Error initializing mini app:', error);
      }
    };
    
    initMiniApp();
  }, []);
  
  // Mock Farcaster feed data
  const [farcasterFeed] = useState([
    {
      id: 1,
      author: { username: 'fitness_fan', displayName: 'Fitness Fan', fid: 12345 },
      content: 'Just hit 15,000 steps today! 🚶‍♂️ Feeling amazing and ready for tomorrow\'s challenge. #10K #MoveToEarn',
      timestamp: new Date(Date.now() - 3600000),
      likes: 24,
      recasts: 5,
      replies: 3,
      isLiked: false,
      isRecasted: false
    },
    {
      id: 2,
      author: { username: 'step_master', displayName: 'Step Master', fid: 67890 },
      content: 'Day 30 of my 10K challenge! 🔥 Consistency is key. Who else is crushing their daily goals? #10K #Wellness',
      timestamp: new Date(Date.now() - 7200000),
      likes: 42,
      recasts: 12,
      replies: 8,
      isLiked: true,
      isRecasted: false
    }
  ]);

  // Mock achievements data
  const achievements = [
    {
      id: 'daily_goal',
      title: 'Daily Goal Master',
      description: 'Complete your daily step goal',
      icon: '🎯',
      earned: isGoalReached,
      rarity: 'common',
      points: 10
    },
    {
      id: 'streak_7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: '🔥',
      earned: currentStreak >= 7,
      rarity: 'rare',
      points: 25
    },
    {
      id: 'streak_30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: '👑',
      earned: currentStreak >= 30,
      rarity: 'epic',
      points: 100
    },
    {
      id: 'high_steps',
      title: 'Distance Walker',
      description: 'Walk over 15,000 steps in a day',
      icon: '🚶‍♂️',
      earned: currentSteps >= 15000,
      rarity: 'rare',
      points: 50
    }
  ];

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, username: 'step_king', displayName: 'Step King', fid: 11111, steps: 25000, streak: 45 },
    { rank: 2, username: 'fitness_queen', displayName: 'Fitness Queen', fid: 22222, steps: 22000, streak: 38 },
    { rank: 3, username: 'walking_wizard', displayName: 'Walking Wizard', fid: 33333, steps: 20000, streak: 32 },
    { rank: 4, username: 'move_master', displayName: 'Move Master', fid: 44444, steps: 18500, streak: 28 },
    { rank: 5, username: 'step_sage', displayName: 'Step Sage', fid: 55555, steps: 17000, streak: 25 }
  ];

  const handleShareToFarcaster = async (content: string) => {
    try {
      // Use Farcaster SDK to compose a cast
      const result = await sdk.actions.composeCast({
        text: content,
        embeds: [window.location.origin]
      });
      
      if (result?.cast) {
        console.log('Cast posted successfully:', result.cast.hash);
        setShowShareModal(false);
      }
    } catch (error) {
      console.error('Failed to share to Farcaster:', error);
      alert('Failed to share to Farcaster');
    }
  };

  const handleAddMiniApp = async () => {
    try {
      await sdk.actions.addMiniApp();
    } catch (error) {
      console.error('Failed to add mini app:', error);
    }
  };

  const handleLike = (postId: number) => {
    // In a real implementation, this would update the post's like count
    console.log('Liked post:', postId);
  };

  const handleRecast = (postId: number) => {
    // In a real implementation, this would recast the post
    console.log('Recasted post:', postId);
  };

  const handleShareAchievement = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShowShareModal(true);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Connect to Farcaster</h3>
          <p className="text-gray-600 mb-6">Sign in to access social features and share your achievements</p>
          <button 
            onClick={async () => {
              try {
                console.log('Attempting Farcaster sign-in...');
                console.log('Current origin:', window.location.origin);
                signIn();
                console.log('Sign-in initiated successfully');
              } catch (error) {
                console.error('Farcaster sign-in error:', error);
                alert('Sign-in failed. Please check the console for details.');
              }
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors"
          >
            Sign in with Farcaster
          </button>
          <div className="mt-4 text-xs text-gray-500">
            <p>Domain: {window.location.hostname}</p>
            <p>Origin: {window.location.origin}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">{profile?.displayName || profile?.username}</p>
              <p className="text-sm text-gray-600">FID: {profile?.fid}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowProfileEdit(true)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => signIn()}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'social', label: 'Social', icon: MessageCircle },
          { id: 'achievements', label: 'Achievements', icon: Trophy },
          { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-purple-600">{currentSteps.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Steps Today</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
            </div>

            {/* Quick Share */}
            <div className="bg-purple-50 p-4 rounded-xl">
              <h4 className="font-medium mb-3">Share Your Progress</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleShareToFarcaster(`Just hit ${currentSteps.toLocaleString()} steps today! 🚶‍♂️ ${isGoalReached ? 'Daily goal complete! 🎯' : `${dailyGoal - currentSteps} steps to go!`} #10K #MoveToEarn`)}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Share Progress
                </button>
                {isGoalReached && (
                  <button
                    onClick={() => handleShareToFarcaster(`🎉 Daily goal achieved! ${currentSteps.toLocaleString()} steps completed. Day ${currentStreak} of my streak! #10K #Wellness #MoveToEarn`)}
                    className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Share Achievement
                  </button>
                )}
              </div>
            </div>

            {/* Add Mini App */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-medium mb-3">Stay Connected</h4>
              <p className="text-sm text-gray-600 mb-3">Add 10K to your Farcaster apps for quick access and notifications</p>
              <button
                onClick={handleAddMiniApp}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add to Farcaster
              </button>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="font-medium mb-3">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Daily Goal Completed</p>
                    <p className="text-xs text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">7-Day Streak Achieved</p>
                    <p className="text-xs text-gray-600">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-4">
            {/* Create Post */}
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <input
                  type="text"
                  placeholder="Share your fitness journey..."
                  className="flex-1 bg-white px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span className="text-sm">Photo</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm">Achievement</span>
                  </button>
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Post
                </button>
              </div>
            </div>

            {/* Feed */}
            <div className="space-y-4">
              {farcasterFeed.map((post) => (
                <div key={post.id} className="border rounded-xl p-4">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{post.author.displayName}</span>
                        <span className="text-gray-600">@{post.author.username}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500">{formatTimestamp(post.timestamp)}</span>
                      </div>
                      <p className="text-gray-800">{post.content}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.likes}</span>
                      </button>
                      <button
                        onClick={() => handleRecast(post.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          post.isRecasted ? 'text-green-600' : 'text-gray-600 hover:text-green-600'
                        }`}
                      >
                        <Share2 className={`w-4 h-4 ${post.isRecasted ? 'fill-current' : ''}`} />
                        <span className="text-sm">{post.recasts}</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm">{post.replies}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">Your Achievements</h3>
              <p className="text-gray-600">Track your progress and unlock rewards</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    achievement.earned
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-medium">{achievement.title}</h4>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            achievement.rarity === 'common' ? 'bg-gray-200 text-gray-700' :
                            achievement.rarity === 'rare' ? 'bg-blue-200 text-blue-700' :
                            'bg-purple-200 text-purple-700'
                          }`}>
                            {achievement.rarity}
                          </span>
                          <span className="text-xs text-gray-500">{achievement.points} pts</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {achievement.earned ? (
                        <>
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <button
                            onClick={() => handleShareAchievement(achievement)}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 text-xs">?</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">Global Leaderboard</h3>
              <p className="text-gray-600">See how you rank against other 10K users</p>
            </div>
            
            <div className="space-y-3">
              {leaderboard.map((user, index) => (
                <div
                  key={user.fid}
                  className={`flex items-center space-x-4 p-4 rounded-xl border ${
                    index === 0 ? 'bg-yellow-50 border-yellow-200' :
                    index === 1 ? 'bg-gray-50 border-gray-200' :
                    index === 2 ? 'bg-orange-50 border-orange-200' :
                    'bg-white border-gray-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-500 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{user.displayName}</span>
                      <span className="text-sm text-gray-600">@{user.username}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{user.steps.toLocaleString()} steps</span>
                      <span>•</span>
                      <span>{user.streak} day streak</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {index === 0 && <Trophy className="w-5 h-5 text-yellow-600" />}
                    {index === 1 && <Award className="w-5 h-5 text-gray-600" />}
                    {index === 2 && <Star className="w-5 h-5 text-orange-600" />}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Your Rank */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <h4 className="font-medium mb-2">Your Rank</h4>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-600">#127</span>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{currentSteps.toLocaleString()} steps today</p>
                  <p className="text-sm text-gray-600">{currentStreak} day streak</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Share Achievement Modal */}
      {showShareModal && selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Share Achievement</h3>
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{selectedAchievement.icon}</div>
              <h4 className="font-medium">{selectedAchievement.title}</h4>
              <p className="text-gray-600">{selectedAchievement.description}</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => handleShareToFarcaster(`🎉 Just unlocked "${selectedAchievement.title}"! ${selectedAchievement.description} #10K #Achievement #MoveToEarn`)}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Share to Farcaster
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarcasterMiniApp; 