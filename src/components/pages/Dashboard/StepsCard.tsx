import React from 'react';
import { Activity, Trophy, Circle } from 'lucide-react';

interface StepsCardProps {
  currentSteps: number;
  dailyGoal: number;
  currentStreak: number;
  totalTokens: number;
}

export const StepsCard: React.FC<StepsCardProps> = React.memo(({
  currentSteps,
  dailyGoal,
  currentStreak,
  totalTokens,
}) => {
  const progress = (currentSteps / dailyGoal) * 100;
  const isGoalReached = currentSteps >= dailyGoal;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      {/* Steps Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-600">Today's Steps</h2>
            <p className="text-3xl font-medium mt-1">{currentSteps.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Activity className="w-8 h-8 text-gray-700" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoalReached ? 'bg-green-500' : 'bg-black'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {dailyGoal.toLocaleString()} goal
            </span>
            <span className={isGoalReached ? 'text-green-600 font-medium' : 'text-gray-600'}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Streak</p>
              <p className="text-xl font-medium">{currentStreak} days</p>
            </div>
          </div>
        </div>

        {/* Tokens */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Circle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Tokens</p>
              <p className="text-xl font-medium">{totalTokens}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Reached Banner */}
      {isGoalReached && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-center text-green-800 font-medium">
            Goal Reached! Keep moving!
          </p>
        </div>
      )}
    </div>
  );
});

StepsCard.displayName = 'StepsCard';
