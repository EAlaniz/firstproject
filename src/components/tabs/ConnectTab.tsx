import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, TrendingUp } from 'lucide-react';

interface ConnectTabProps {
  todaySteps: number;
  dailyGoal: number;
  onShare: (platform: string, text: string) => void;
}

const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

export const ConnectTab: React.FC<ConnectTabProps> = ({ todaySteps, dailyGoal, onShare }) => {
  const isGoalReached = todaySteps >= dailyGoal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Share Progress Card - Poolsuite Style */}
      <section className="flex-1 flex flex-col justify-center space-y-4 max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className={`border-2 border-black rounded-xl p-4 bg-[var(--surface-elevated)] ${
            !isGoalReached ? 'opacity-60' : ''
          }`}
          style={{
            boxShadow: isGoalReached
              ? '4px 4px 0px rgba(127, 208, 87, 0.4)'
              : '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center"
              style={{
                background: isGoalReached
                  ? 'linear-gradient(135deg, #7FD057 0%, #34D399 100%)'
                  : 'linear-gradient(135deg, #4A4A4A 0%, #2A2A2A 100%)',
                boxShadow: isGoalReached
                  ? '2px 2px 0px rgba(0, 0, 0, 0.4)'
                  : '2px 2px 0px rgba(0, 0, 0, 0.6)',
              }}
            >
              <Share2 size={20} color="white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold uppercase tracking-tight text-[var(--text)] mb-1">
                Share Your Achievement
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                {isGoalReached
                  ? 'You crushed your goal today! Share your progress with the community.'
                  : `Complete your goal to unlock sharing (${(dailyGoal - todaySteps).toLocaleString()} steps left)`}
              </p>
              {isGoalReached && (
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      onShare(
                        'twitter',
                        `Just hit my ${(dailyGoal / 1000).toFixed(
                          1
                        )}K step goal on @Move10K! Moving more, earning more. 💪`
                      )
                    }
                    className="flex-1 px-3 py-2 bg-black border-2 border-black rounded-lg text-xs font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
                    style={{
                      boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    Share on X
                  </button>
                  <button
                    onClick={() =>
                      onShare(
                        'farcaster',
                        `Just hit my ${(dailyGoal / 1000).toFixed(1)}K step goal on Move10K! 💪`
                      )
                    }
                    className="flex-1 px-3 py-2 border-2 border-black rounded-lg text-xs font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
                    style={{
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    Warpcast
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>


      {/* Community Stats Card - Poolsuite Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.2 }}
          className="border-2 border-black rounded-xl p-4 bg-[var(--surface-elevated)]"
          style={{
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black/20">
            <div
              className="w-8 h-8 rounded border-2 border-black flex items-center justify-center"
              style={{
                backgroundColor: 'rgb(59, 130, 246)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 0 0 15px rgb(59 130 246 / 0.5)'
              }}
            >
              <Users size={16} color="white" strokeWidth={2.5} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-tight text-[var(--text-secondary)]">
              Community Activity
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-brand-500 mb-0.5">1.2K</div>
              <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)]">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-success mb-0.5">15M</div>
              <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)]">
                Steps Today
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono text-warning mb-0.5">892</div>
              <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)]">
                Goals Hit
              </div>
            </div>
          </div>
        </motion.div>


      {/* Activity Feed - Coming Soon - Poolsuite Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.3 }}
          className="border-2 border-black rounded-xl p-6 bg-[var(--bg-secondary)] text-center relative overflow-hidden"
          style={{
            boxShadow: 'inset 1px 1px 3px rgba(0, 0, 0, 0.3), 3px 3px 0px rgba(0, 0, 0, 0.7)',
          }}
        >
          {/* Retro scanline effect */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
            }}
          />

          <div className="relative z-10">
            <div
              className="w-12 h-12 rounded-full border-2 border-black bg-[var(--surface-elevated)] flex items-center justify-center mx-auto mb-3"
              style={{ boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)' }}
            >
              <TrendingUp size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-bold uppercase tracking-tight text-[var(--text-secondary)] mb-1">
              Activity Feed Coming Soon
            </p>
            <p className="text-xs text-[var(--text-muted)]">See what your friends are achieving</p>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};
