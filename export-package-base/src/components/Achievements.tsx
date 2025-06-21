import React from 'react';
import { Award, Flame, Star, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

interface AchievementsProps {
  achievements: Achievement[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <div className="bg-gray-900 border-4 border-yellow-400 p-6 mb-6">
      <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center space-x-2">
        <Award className="w-5 h-5" />
        <span>ACHIEVEMENTS</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`border-2 p-4 transition-all ${
              achievement.earned
                ? 'border-yellow-400 bg-yellow-400 bg-opacity-10'
                : 'border-gray-600 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-8 h-8 flex items-center justify-center ${
                achievement.earned ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                {achievement.icon}
              </div>
              <div className="flex-1">
                <h4 className={`font-bold text-sm ${
                  achievement.earned ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {achievement.title}
                </h4>
                <p className="text-xs text-gray-400">{achievement.description}</p>
              </div>
            </div>
            
            {achievement.progress !== undefined && achievement.maxProgress && (
              <div className="w-full bg-gray-700 h-2 mt-2">
                <div
                  className="bg-yellow-400 h-full transition-all duration-300"
                  style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}