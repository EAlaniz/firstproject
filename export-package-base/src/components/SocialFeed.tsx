import React from 'react';
import { Heart, MessageCircle, Music, Headphones, BookOpen } from 'lucide-react';

interface FeedPost {
  id: string;
  username: string;
  steps: number;
  contentType: 'music' | 'podcast' | 'audiobook';
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface SocialFeedProps {
  posts: FeedPost[];
  isUnlocked: boolean;
}

export default function SocialFeed({ posts, isUnlocked }: SocialFeedProps) {
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'music': return <Music className="w-4 h-4" />;
      case 'podcast': return <Headphones className="w-4 h-4" />;
      case 'audiobook': return <BookOpen className="w-4 h-4" />;
      default: return <Music className="w-4 h-4" />;
    }
  };
  
  if (!isUnlocked) {
    return (
      <div className="bg-gray-900 border-4 border-gray-600 p-6 opacity-50">
        <h3 className="text-lg font-bold text-gray-500 mb-4">COMMUNITY FEED</h3>
        <div className="text-center py-8">
          <p className="text-gray-400">Complete your daily goal to join the conversation!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 border-4 border-blue-400 p-6">
      <h3 className="text-lg font-bold text-blue-400 mb-4">COMMUNITY FEED</h3>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {posts.map((post) => (
          <div key={post.id} className="border-2 border-gray-600 p-4 bg-gray-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-400 flex items-center justify-center">
                  <span className="text-black font-bold text-sm">
                    {post.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-white font-bold text-sm">{post.username}</span>
                  <div className="flex items-center space-x-1 text-xs text-green-400">
                    <span>{post.steps.toLocaleString()} steps</span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-400">{post.timestamp}</span>
            </div>
            
            <div className="flex items-start space-x-2 mb-3">
              <div className="text-purple-400">
                {getContentIcon(post.contentType)}
              </div>
              <p className="text-white text-sm flex-1">{post.content}</p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs">
              <button className="flex items-center space-x-1 text-red-400 hover:text-red-300">
                <Heart className="w-4 h-4" />
                <span>{post.likes}</span>
              </button>
              <button className="flex items-center space-x-1 text-blue-400 hover:text-blue-300">
                <MessageCircle className="w-4 h-4" />
                <span>{post.comments}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}