import React from 'react';
import { Activity, Trophy } from 'lucide-react';

interface HeaderProps {
  currentStreak: number;
  totalTokens: number;
}

export default function Header({ currentStreak, totalTokens }: HeaderProps) {
  return (
    <header className="bg-black border-b-4 border-green-400 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-400 flex items-center justify-center">
            <Activity className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-green-400 tracking-wider">10K</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{currentStreak}</span>
            <span className="text-white text-sm">STREAK</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
            <span className="text-purple-400 font-bold">{totalTokens}</span>
            <span className="text-white text-sm">TOKENS</span>
          </div>
        </div>
      </div>
    </header>
  );
}