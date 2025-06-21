import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StepTracker from './components/StepTracker';
import ActivityShare from './components/ActivityShare';
import Achievements from './components/Achievements';
import SocialFeed from './components/SocialFeed';
import { Flame, Star, Crown, Zap } from 'lucide-react';

function App() {
  const [currentSteps, setCurrentSteps] = useState(7240);
  const [dailyGoal, setDailyGoal] = useState(10000);
  const [currentStreak, setCurrentStreak] = useState(12);
  const [totalTokens, setTotalTokens] = useState(156);

  const isGoalReached = currentSteps >= dailyGoal;

  // Mock achievements data
  const achievements = [
    {
      id: '1',
      title: 'FIRST STEPS',
      description: 'Complete your first daily goal',
      icon: <Star className="w-6 h-6" />,
      earned: true
    },
    {
      id: '2',
      title: 'STREAK MASTER',
      description: 'Maintain a 7-day streak',
      icon: <Flame className="w-6 h-6" />,
      earned: true
    },
    {
      id: '3',
      title: 'TOKEN COLLECTOR',
      description: 'Earn 100 tokens',
      icon: <Crown className="w-6 h-6" />,
      earned: true
    },
    {
      id: '4',
      title: 'POWER WALKER',
      description: 'Walk 15,000 steps in a day',
      icon: <Zap className="w-6 h-6" />,
      earned: false,
      progress: currentSteps,
      maxProgress: 15000
    }
  ];

  // Mock social feed data
  const feedPosts = [
    {
      id: '1',
      username: 'walker_alex',
      steps: 12500,
      contentType: 'music' as const,
      content: '🎵 Just crushed my walk listening to "Don\'t Stop Me Now" by Queen! Nothing beats classic rock for motivation! 🚀',
      likes: 23,
      comments: 5,
      timestamp: '2h ago'
    },
    {
      id: '2',
      username: 'fit_sarah',
      steps: 10800,
      contentType: 'podcast' as const,
      content: '🎧 Mind blown by today\'s episode of "How I Built This" - perfect walking companion for entrepreneurs!',
      likes: 18,
      comments: 3,
      timestamp: '3h ago'
    },
    {
      id: '3',
      username: 'book_lover_mike',
      steps: 11200,
      contentType: 'audiobook' as const,
      content: '📚 Getting lost in "Atomic Habits" while walking through the park. Great combo of physical and mental exercise!',
      likes: 31,
      comments: 7,
      timestamp: '4h ago'
    }
  ];

  // Simulate step updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSteps(prev => {
        const increment = Math.floor(Math.random() * 20) + 5;
        return Math.min(prev + increment, dailyGoal + 2000);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [dailyGoal]);

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <Header currentStreak={currentStreak} totalTokens={totalTokens} />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <StepTracker 
          currentSteps={currentSteps}
          dailyGoal={dailyGoal}
          onGoalChange={setDailyGoal}
        />
        
        <ActivityShare isUnlocked={isGoalReached} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Achievements achievements={achievements} />
          <SocialFeed posts={feedPosts} isUnlocked={isGoalReached} />
        </div>
        
        {/* Integration notice */}
        <div className="mt-8 p-4 bg-gray-900 border-2 border-gray-600 text-center">
          <p className="text-gray-400 text-sm">
            🚀 More features coming soon!
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;