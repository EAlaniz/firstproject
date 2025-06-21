import React from 'react';
import { Target, Zap } from 'lucide-react';

interface StepTrackerProps {
  currentSteps: number;
  dailyGoal: number;
  onGoalChange: (goal: number) => void;
}

export default function StepTracker({ currentSteps, dailyGoal, onGoalChange }: StepTrackerProps) {
  const progress = Math.min((currentSteps / dailyGoal) * 100, 100);
  const isGoalReached = currentSteps >= dailyGoal;
  
  return (
    <div className="bg-gray-900 border-4 border-green-400 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-green-400 flex items-center space-x-2">
          <Target className="w-6 h-6" />
          <span>TODAY'S MISSION</span>
        </h2>
        {isGoalReached && (
          <div className="flex items-center space-x-1 bg-green-400 text-black px-3 py-1 animate-pulse">
            <Zap className="w-4 h-4" />
            <span className="font-bold text-sm">COMPLETE!</span>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <div className="flex items-end space-x-2 mb-2">
          <span className="text-4xl font-mono font-bold text-white">
            {currentSteps.toLocaleString()}
          </span>
          <span className="text-lg text-gray-400 mb-1">/ {dailyGoal.toLocaleString()} steps</span>
        </div>
        
        {/* 8-bit style progress bar */}
        <div className="relative h-8 bg-gray-800 border-2 border-gray-600">
          <div 
            className={`h-full transition-all duration-500 ${
              isGoalReached ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Remaining: <span className="text-white font-bold">
            {Math.max(0, dailyGoal - currentSteps).toLocaleString()}
          </span> steps
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Goal:</label>
          <select 
            value={dailyGoal}
            onChange={(e) => onGoalChange(Number(e.target.value))}
            className="bg-gray-800 border-2 border-gray-600 text-white px-2 py-1 text-sm focus:border-green-400 focus:outline-none"
          >
            <option value={5000}>5K Steps</option>
            <option value={7500}>7.5K Steps</option>
            <option value={10000}>10K Steps</option>
            <option value={12500}>12.5K Steps</option>
            <option value={15000}>15K Steps</option>
          </select>
        </div>
      </div>
    </div>
  );
}