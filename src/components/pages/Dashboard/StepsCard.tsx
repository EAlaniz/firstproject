import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import { CircularProgress } from '../../CircularProgress';

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
  const progress = Math.min((currentSteps / dailyGoal) * 100, 100);
  const isGoalReached = currentSteps >= dailyGoal;

  // Animated step counter
  const [displaySteps, setDisplaySteps] = useState(0);

  useEffect(() => {
    const duration = 1500; // 1.5 seconds
    const steps = 60;
    const increment = currentSteps / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= currentSteps) {
        setDisplaySteps(currentSteps);
        clearInterval(timer);
      } else {
        setDisplaySteps(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [currentSteps]);

  return (
    <motion.div
      className="card card-elevated p-8 rounded-xl relative overflow-visible"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {/* Header Label */}
      <div className="mb-6 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 m-0">
          Today's Activity
        </p>
      </div>

      {/* Circular Progress with Step Count */}
      <div className="flex justify-center items-center mb-8 relative">
        <CircularProgress value={progress} size={240} strokeWidth={14} />

        {/* Step count overlay */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.2,
          }}
          className="absolute text-center"
        >
          <div className="text-6xl font-semibold text-brand-500 leading-none mb-2 tracking-tighter">
            {displaySteps.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
            / {dailyGoal.toLocaleString()} steps
          </div>
          <div className={`text-xl font-semibold ${isGoalReached ? 'text-success' : 'text-brand-500'}`}>
            {Math.round(progress)}%
          </div>
        </motion.div>
      </div>

      {/* Goal Reached Celebration */}
      {isGoalReached && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.4,
          }}
          className="bg-success/10 border border-success rounded-lg p-4 mb-6 text-center"
        >
          <p className="text-base font-medium text-success m-0 tracking-wide">
            Goal reached.
          </p>
        </motion.div>
      )}

      {/* Stats Pills */}
      <div className="grid grid-cols-2 gap-4">
        {/* Streak Pill */}
        <motion.div
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-base"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.3,
          }}
        >
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center shadow-sm">
            <Trophy size={20} color="white" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Streak
            </div>
            <div className="text-2xl font-semibold text-neutral-700 dark:text-neutral-100">
              {currentStreak}
              <span className="text-xs font-light ml-1 text-neutral-500">
                days
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tokens Pill */}
        <motion.div
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-base"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.35,
          }}
        >
          <div className="w-10 h-10 rounded-md bg-gradient-to-br from-brand-500 to-success flex items-center justify-center shadow-sm">
            <Coins size={20} color="white" />
          </div>
          <div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              Tokens
            </div>
            <div className="text-2xl font-semibold text-neutral-700 dark:text-neutral-100">
              {totalTokens.toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

StepsCard.displayName = 'StepsCard';
