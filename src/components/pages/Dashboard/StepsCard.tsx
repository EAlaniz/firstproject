import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Trophy, Coins } from 'lucide-react';
import { CircularProgress } from '../../CircularProgress';

interface StepsCardProps {
  currentSteps: number;
  dailyGoal: number;
  currentStreak: number;
  totalTokens: number;
}

// Spring config for smooth, physics-based animations
const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

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
      className="card-minimal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        padding: '32px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header Label */}
      <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
        <p className="text-label" style={{ color: 'var(--gray-500)' }}>
          Today's Activity
        </p>
      </div>

      {/* Circular Progress with Step Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 'var(--space-8)',
        position: 'relative',
      }}>
        <CircularProgress value={progress} size={240} strokeWidth={14} />

        {/* Step count overlay */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.2 }}
          style={{
            position: 'absolute',
            textAlign: 'center',
          }}
        >
          <div
            className="text-display"
            style={{
              background: 'var(--gradient-base)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              marginBottom: 'var(--space-2)',
            }}
          >
            {displaySteps.toLocaleString()}
          </div>
          <div
            className="text-label"
            style={{
              color: 'var(--gray-600)',
              fontSize: 'var(--text-sm)',
            }}
          >
            / {dailyGoal.toLocaleString()} steps
          </div>
          <div
            style={{
              fontSize: 'var(--text-h4)',
              fontWeight: 600,
              color: isGoalReached ? 'var(--success-600)' : 'var(--color-base-blue)',
              marginTop: 'var(--space-1)',
            }}
          >
            {Math.round(progress)}%
          </div>
        </motion.div>
      </div>

      {/* Goal Reached Celebration */}
      {isGoalReached && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.4 }}
          style={{
            background: 'var(--success-50)',
            border: '2px solid var(--success-500)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '28px', marginBottom: 'var(--space-1)' }}>🎉</div>
          <p style={{
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            color: 'var(--success-600)',
            margin: 0,
          }}>
            Goal Reached! Keep moving!
          </p>
        </motion.div>
      )}

      {/* Stats Pills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-4)',
      }}>
        {/* Streak Pill */}
        <motion.div
          className="stat-pill"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springConfig, delay: 0.3 }}
          whileHover={{ y: -2 }}
          style={{
            background: 'var(--glass-subtle)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
          }}>
            <Trophy size={20} color="white" />
          </div>
          <div>
            <p className="text-label" style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-600)',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              Streak
            </p>
            <p style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--gray-900)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {currentStreak}
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginLeft: '4px' }}>
                days
              </span>
            </p>
          </div>
        </motion.div>

        {/* Tokens Pill */}
        <motion.div
          className="stat-pill"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...springConfig, delay: 0.35 }}
          whileHover={{ y: -2 }}
          style={{
            background: 'var(--glass-subtle)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--gradient-base)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-base-glow)',
          }}>
            <Coins size={20} color="white" />
          </div>
          <div>
            <p className="text-label" style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-600)',
              margin: 0,
              textTransform: 'uppercase',
            }}>
              Tokens
            </p>
            <p style={{
              fontSize: 'var(--text-h3)',
              fontWeight: 700,
              color: 'var(--gray-900)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {totalTokens.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

StepsCard.displayName = 'StepsCard';
