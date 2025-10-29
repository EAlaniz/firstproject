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
      className="steps-card-noir"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        ease: [0.4, 0, 0.2, 1],
      }}
      style={{
        padding: '32px',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header Label */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <p className="text-meta" style={{ margin: 0 }}>
          Today's Activity
        </p>
      </div>

      {/* Circular Progress with Step Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '32px',
        position: 'relative',
      }}>
        <div className="circular-progress-noir">
          <CircularProgress value={progress} size={240} strokeWidth={14} />
        </div>

        {/* Step count overlay */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.2,
          }}
          style={{
            position: 'absolute',
            textAlign: 'center',
          }}
        >
          <div
            className="text-gradient-blue-mint"
            style={{
              fontSize: '72px',
              fontWeight: 600,
              lineHeight: 1,
              marginBottom: '8px',
              letterSpacing: '-2px',
            }}
          >
            {displaySteps.toLocaleString()}
          </div>
          <div
            className="text-meta"
            style={{
              fontSize: '13px',
              marginBottom: '4px',
            }}
          >
            / {dailyGoal.toLocaleString()} steps
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 600,
              color: isGoalReached ? 'var(--accent-mint)' : 'var(--accent-blue)',
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
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.4,
          }}
          className="satisfaction-pulse"
          style={{
            background: 'rgba(0, 191, 166, 0.1)',
            border: '1px solid var(--accent-mint)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: 'var(--glow-mint-soft)',
          }}
        >
          <p style={{
            fontSize: '16px',
            fontWeight: 500,
            color: 'var(--accent-mint)',
            margin: 0,
            letterSpacing: '0.5px',
          }}>
            Goal reached.
          </p>
        </motion.div>
      )}

      {/* Stats Pills */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
      }}>
        {/* Streak Pill */}
        <motion.div
          className="card-noir hover-illuminate"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.3,
          }}
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
          }}>
            <Trophy size={20} color="white" />
          </div>
          <div className="stat-noir">
            <div className="stat-noir-label">
              Streak
            </div>
            <div className="stat-noir-value" style={{ fontSize: '24px' }}>
              {currentStreak}
              <span style={{ fontSize: '13px', fontWeight: 300, marginLeft: '4px', color: 'var(--text-secondary)' }}>
                days
              </span>
            </div>
          </div>
        </motion.div>

        {/* Tokens Pill */}
        <motion.div
          className="card-noir hover-illuminate"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.4, 0, 0.2, 1],
            delay: 0.35,
          }}
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'var(--gradient-blue-to-mint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-blue-soft)',
          }}>
            <Coins size={20} color="white" />
          </div>
          <div className="stat-noir">
            <div className="stat-noir-label">
              Tokens
            </div>
            <div className="stat-noir-value" style={{ fontSize: '24px' }}>
              {totalTokens.toLocaleString()}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

StepsCard.displayName = 'StepsCard';
