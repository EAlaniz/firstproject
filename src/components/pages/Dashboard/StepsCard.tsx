import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Coins, Footprints, Target } from 'lucide-react';
import { useIsBaseMiniApp } from '../../../hooks/useIsBaseMiniApp';

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
  const { isMiniApp } = useIsBaseMiniApp();

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
      className="relative rounded-xl overflow-visible border-2 border-black bg-[var(--surface-elevated)] max-w-2xl mx-auto"
      style={{
        padding: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
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
      <div className="flex items-center justify-between pb-2 border-b-2 border-black/20"
        style={{
          marginBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
        }}
      >
        <div className="flex items-center" style={{ gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)' }}>
          <div className="rounded border-2 border-black flex items-center justify-center"
            style={{
              width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              backgroundColor: 'rgb(59, 130, 246)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)'
            }}
          >
            <Footprints style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" strokeWidth={2.5} />
          </div>
          <h3 className="uppercase tracking-tight font-bold text-[var(--text-secondary)] m-0"
            style={{
              fontSize: isMiniApp ? 'var(--fs-label-2)' : 'var(--fs-label-1)',
              fontWeight: 'var(--fw-label-heavy)',
            }}
          >
            Today's Activity
          </h3>
        </div>
        <div className="font-mono text-[var(--text-muted)] border border-black/30 px-2 py-1 rounded bg-black/20"
          style={{
            fontSize: 'var(--fs-caption)',
          }}
        >
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Big Step Counter Display - Retro LCD style */}
      <div style={{ marginBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-1-5)' }}>
        <div className="border-2 border-black rounded-lg bg-gradient-to-br from-[var(--surface-elevated-2)] to-[var(--bg-secondary)] relative overflow-hidden"
          style={{
            padding: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
            boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), 2px 2px 0px rgba(0, 0, 0, 0.5)'
          }}
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
              className="text-center"
              style={{ marginBottom: isMiniApp ? 'var(--space-0-5)' : 'var(--space-1)' }}
            >
              <div className="font-bold leading-none tracking-tighter font-mono"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-display-3)' : 'var(--fs-display-2)',
                  lineHeight: isMiniApp ? 'var(--lh-display-3)' : 'var(--lh-display-2)',
                  marginBottom: 'var(--space-0-25)',
                  color: 'rgb(59, 130, 246)',
                  textShadow: '0px 0px 20px rgb(59 130 246 / 0.5), 0px 0px 40px rgb(59 130 246 / 0.3)'
                }}
              >
                {displaySteps.toLocaleString()}
              </div>
              <div className="text-[var(--text-muted)] uppercase tracking-wide font-bold"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                / {dailyGoal.toLocaleString()} steps
              </div>
            </motion.div>

            {/* Retro progress bar */}
            <div className="relative">
              <div className="border-2 border-black rounded overflow-hidden bg-black/40"
                style={{
                  height: isMiniApp ? '16px' : '20px',
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1], delay: 0.3 }}
                  className={`h-full relative ${
                    isGoalReached
                      ? 'bg-gradient-to-r from-success via-warning to-success'
                      : ''
                  }`}
                  style={{
                    background: isGoalReached
                      ? undefined
                      : 'linear-gradient(to right, rgb(59, 130, 246), rgb(37, 99, 235))',
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
                <div className="bg-black border-2 border-black rounded-t"
                  style={{
                    padding: isMiniApp ? 'var(--space-0-25) var(--space-1)' : 'var(--space-0-5) var(--space-1-5)',
                    boxShadow: '2px 0px 0px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  <span className="font-bold font-mono"
                    style={{
                      fontSize: isMiniApp ? 'var(--fs-caption)' : 'var(--fs-label-2)',
                      color: isGoalReached ? '#7FD057' : 'rgb(59, 130, 246)'
                    }}
                  >
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
          className="border-2 border-black bg-gradient-to-r from-success/20 to-warning/20 rounded-lg text-center relative overflow-hidden"
          style={{
            padding: isMiniApp ? 'var(--space-0-5)' : 'var(--space-1)',
            marginBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-1-5)',
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
          <p className="font-bold uppercase tracking-wide text-success m-0 relative z-10"
            style={{
              fontSize: 'var(--fs-caption)',
              fontWeight: 'var(--fw-caption)',
            }}
          >
            🎉 Goal Reached!
          </p>
        </motion.div>
      )}

      {/* Stats Pills - Poolsuite inspired with press effect */}
      <div className="grid grid-cols-2"
        style={{
          gap: isMiniApp ? 'var(--space-1)' : 'var(--space-1-5)',
          marginBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-1-5)',
        }}
      >
        {/* Streak Pill */}
        <motion.button
          className="relative border-2 border-black rounded-lg flex items-center transition-all duration-150 bg-[var(--surface-elevated-2)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          style={{
            padding: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
            gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
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
          <div className="rounded-md border-2 border-black bg-gradient-to-br from-warning to-warning/80 flex items-center justify-center"
            style={{
              width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Trophy style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="uppercase font-bold tracking-tight text-[var(--text-muted)] mb-0"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
              }}
            >
              Streak
            </div>
            <div className="font-bold text-[var(--text)] font-mono"
              style={{
                fontSize: isMiniApp ? 'var(--fs-title-4)' : 'var(--fs-title-3)',
                lineHeight: isMiniApp ? 'var(--lh-title-4)' : 'var(--lh-title-3)',
              }}
            >
              {currentStreak}
              <span className="font-normal ml-1 text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                }}
              >
                days
              </span>
            </div>
          </div>
        </motion.button>

        {/* Tokens Pill */}
        <motion.button
          className="relative border-2 border-black rounded-lg flex items-center transition-all duration-150 bg-[var(--surface-elevated-2)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          style={{
            padding: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
            gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
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
          <div className="rounded-md border-2 border-black flex items-center justify-center"
            style={{
              width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
              background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
              boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.3), 0 0 20px rgb(59 130 246 / 0.5)',
            }}
          >
            <Coins style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="uppercase font-bold tracking-tight text-[var(--text-muted)] mb-0"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
              }}
            >
              Tokens
            </div>
            <div className="font-bold text-[var(--text)] font-mono"
              style={{
                fontSize: isMiniApp ? 'var(--fs-title-4)' : 'var(--fs-title-3)',
                lineHeight: isMiniApp ? 'var(--lh-title-4)' : 'var(--lh-title-3)',
              }}
            >
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
          <div className="flex items-center"
            style={{
              padding: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
            }}
          >
            <div className="rounded border-2 border-black flex items-center justify-center"
              style={{
                width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                marginRight: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
                backgroundColor: 'rgb(59, 130, 246)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)'
              }}
            >
              <Target style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <label htmlFor="goal-selector" className="uppercase font-bold tracking-tight text-[var(--text-muted)] block"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                  marginBottom: 'var(--space-0-5)',
                }}
              >
                Daily Goal
              </label>
              <select
                id="goal-selector"
                value={dailyGoal}
                onChange={(e) => onGoalChange(Number(e.target.value))}
                className="w-full bg-black/40 border-2 border-black rounded font-bold font-mono focus:outline-none cursor-pointer transition-all hover:bg-black/60"
                style={{
                  padding: isMiniApp ? 'var(--space-0-75) var(--space-1-5)' : 'var(--space-1) var(--space-2)',
                  fontSize: isMiniApp ? 'var(--fs-label-2)' : 'var(--fs-label-1)',
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
