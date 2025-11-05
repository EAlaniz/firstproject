import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Footprints, Target } from 'lucide-react';

interface StepsCardProps {
  currentSteps: number;
  dailyGoal: number;
  currentStreak: number;
  totalTokens: number;
  onGoalChange?: (goal: number) => void;
}

export const StepsCard: React.FC<StepsCardProps> = React.memo(({
  currentSteps,
  dailyGoal,
  currentStreak,
  totalTokens,
  onGoalChange,
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
      className="relative p-3 rounded-xl overflow-visible border-2 border-black bg-[var(--surface-elevated)] max-w-2xl mx-auto"
      style={{
        boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.9)',
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {/* Header with retro computer aesthetic */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded border-2 border-black flex items-center justify-center"
            style={{
              backgroundColor: 'rgb(59, 130, 246)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)'
            }}
          >
            <Footprints size={16} color="white" strokeWidth={2.5} />
          </div>
          <h3 className="text-sm uppercase tracking-tight font-bold text-[var(--text-secondary)] m-0">
            Today's Activity
          </h3>
        </div>
        <div className="text-xs font-mono text-[var(--text-muted)] border border-black/30 px-2 py-1 rounded bg-black/20">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Big Step Counter Display - Retro LCD style */}
      <div className="mb-1.5">
        <div className="border-2 border-black rounded-lg p-2.5 bg-gradient-to-br from-[var(--surface-elevated-2)] to-[var(--bg-secondary)] relative overflow-hidden"
          style={{ boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), 2px 2px 0px rgba(0, 0, 0, 0.5)' }}
        >
          {/* Retro scanline effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
            }}
          />

          <div className="relative z-10">
            {/* Step count */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center mb-1"
            >
              <div className="text-4xl font-bold leading-none mb-0.5 tracking-tighter font-mono"
                style={{
                  color: 'rgb(59, 130, 246)',
                  textShadow: '0px 0px 20px rgb(59 130 246 / 0.5), 0px 0px 40px rgb(59 130 246 / 0.3)'
                }}
              >
                {displaySteps.toLocaleString()}
              </div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-bold">
                / {dailyGoal.toLocaleString()} steps
              </div>
            </motion.div>

            {/* Retro progress bar */}
            <div className="relative">
              <div className="h-5 border-2 border-black rounded overflow-hidden bg-black/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                  className={`h-full relative ${
                    isGoalReached
                      ? 'bg-gradient-to-r from-success via-warning to-success'
                      : 'bg-gradient-to-r from-brand-500 to-brand-600'
                  }`}
                  style={{
                    boxShadow: 'inset 0px -2px 0px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  {/* Animated shine effect */}
                  {isGoalReached && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </motion.div>
              </div>

              {/* Percentage display */}
              <div className="absolute -top-1 right-0 transform translate-y-[-100%]">
                <div className="bg-black border-2 border-black px-3 py-1 rounded-t"
                  style={{ boxShadow: '2px 0px 0px rgba(0, 0, 0, 0.8)' }}
                >
                  <span className={`text-sm font-bold font-mono ${
                    isGoalReached ? 'text-success' : 'text-brand-500'
                  }`}>
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Reached Banner - Poolsuite style */}
      {isGoalReached && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.5,
          }}
          className="border-2 border-black bg-gradient-to-r from-success/20 to-warning/20 rounded-lg p-1 mb-1.5 text-center relative overflow-hidden"
          style={{
            boxShadow: '3px 3px 0px rgba(127, 208, 87, 0.3)',
          }}
        >
          {/* Animated background pattern */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)',
            }}
            animate={{ x: [0, 20] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-xs font-bold uppercase tracking-wide text-success m-0 relative z-10">
            🎉 Goal Reached!
          </p>
        </motion.div>
      )}

      {/* Stats Pills - Poolsuite inspired with press effect */}
      <div className="grid grid-cols-2 gap-1.5 mb-1.5">
        {/* Streak Pill */}
        <motion.button
          className="relative border-2 border-black rounded-lg p-2 flex items-center gap-2 transition-all duration-150 bg-[var(--surface-elevated-2)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          style={{
            boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.6,
          }}
        >
          <div className="w-8 h-8 rounded-md border-2 border-black bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center"
            style={{
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Trophy size={16} color="white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)] mb-0">
              Streak
            </div>
            <div className="text-lg font-bold text-[var(--text)] font-mono">
              {currentStreak}
              <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">
                days
              </span>
            </div>
          </div>
        </motion.button>

        {/* Tokens Pill */}
        <motion.button
          className="relative border-2 border-black rounded-lg p-2 flex items-center gap-2 transition-all duration-150 bg-[var(--surface-elevated-2)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          style={{
            boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.65,
          }}
        >
          <div className="w-8 h-8 rounded-md border-2 border-black flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.3), 0 0 20px rgb(59 130 246 / 0.5)',
            }}
          >
            <Coins size={16} color="white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)] mb-0">
              Tokens
            </div>
            <div className="text-lg font-bold text-[var(--text)] font-mono">
              {totalTokens.toLocaleString()}
            </div>
          </div>
        </motion.button>
      </div>

      {/* Goal Selector - Poolsuite style */}
      {onGoalChange && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.7,
          }}
          className="border-2 border-black rounded-lg bg-[var(--bg-secondary)] relative overflow-hidden"
          style={{
            boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.3), 2px 2px 0px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div className="flex items-center p-2">
            <div className="w-8 h-8 rounded border-2 border-black flex items-center justify-center mr-3"
              style={{
                backgroundColor: 'rgb(59, 130, 246)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)'
              }}
            >
              <Target size={16} color="white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <label htmlFor="goal-selector" className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)] block mb-1">
                Daily Goal
              </label>
              <select
                id="goal-selector"
                value={dailyGoal}
                onChange={(e) => onGoalChange(Number(e.target.value))}
                className="w-full bg-black/40 border-2 border-black rounded px-3 py-1.5 text-sm font-bold font-mono focus:outline-none cursor-pointer transition-all hover:bg-black/60"
                style={{
                  color: 'rgb(59, 130, 246)',
                  boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                <option value={5000}>5,000 steps</option>
                <option value={7500}>7,500 steps</option>
                <option value={10000}>10,000 steps</option>
                <option value={12500}>12,500 steps</option>
                <option value={15000}>15,000 steps</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

StepsCard.displayName = 'StepsCard';
