import React, { useState } from 'react';
import { Music, Headphones, BookOpen, Send } from 'lucide-react';

interface ActivityShareProps {
  isUnlocked: boolean;
}

export default function ActivityShare({ isUnlocked }: ActivityShareProps) {
  const [selectedType, setSelectedType] = useState<'music' | 'podcast' | 'audiobook'>('music');
  const [content, setContent] = useState('');
  
  if (!isUnlocked) {
    return (
      <div className="bg-gray-900 border-4 border-gray-600 p-6 mb-6 opacity-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 mx-auto mb-4 flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-2">SOCIAL FEED LOCKED</h3>
          <p className="text-gray-400 text-sm">Complete your daily goal to unlock sharing!</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 border-4 border-purple-400 p-6 mb-6">
      <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center space-x-2">
        <Headphones className="w-5 h-5" />
        <span>SHARE YOUR WALK VIBES</span>
      </h3>
      
      <div className="flex space-x-2 mb-4">
        {[
          { type: 'music' as const, icon: Music, label: 'MUSIC' },
          { type: 'podcast' as const, icon: Headphones, label: 'PODCAST' },
          { type: 'audiobook' as const, icon: BookOpen, label: 'AUDIOBOOK' }
        ].map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`flex items-center space-x-2 px-4 py-2 border-2 transition-colors ${
              selectedType === type
                ? 'border-purple-400 bg-purple-400 text-black'
                : 'border-gray-600 text-gray-400 hover:border-purple-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="font-bold text-sm">{label}</span>
          </button>
        ))}
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What ${selectedType} powered your walk?`}
          className="flex-1 bg-gray-800 border-2 border-gray-600 text-white px-3 py-2 focus:border-purple-400 focus:outline-none"
        />
        <button 
          className="bg-purple-400 text-black px-4 py-2 border-2 border-purple-400 hover:bg-purple-300 transition-colors flex items-center space-x-1"
          onClick={() => {
            // Handle share
            setContent('');
          }}
        >
          <Send className="w-4 h-4" />
          <span className="font-bold">SHARE</span>
        </button>
      </div>
    </div>
  );
}