import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Users, TrendingUp } from 'lucide-react';
import { useIsBaseMiniApp } from '../../hooks/useIsBaseMiniApp';

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
  const { isMiniApp } = useIsBaseMiniApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Share Progress Card - Poolsuite Style */}
      <section className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full"
        style={{
          gap: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className={`border-2 border-black rounded-xl bg-[var(--surface-elevated)] ${
            !isGoalReached ? 'opacity-60' : ''
          }`}
          style={{
            padding: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
            boxShadow: isGoalReached
              ? '4px 4px 0px rgba(127, 208, 87, 0.4)'
              : '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-start"
            style={{
              gap: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            <div
              className="rounded-lg border-2 border-black flex items-center justify-center"
              style={{
                width: isMiniApp ? 'var(--avatar-xl)' : '40px',
                height: isMiniApp ? 'var(--avatar-xl)' : '40px',
                background: isGoalReached
                  ? 'linear-gradient(135deg, #7FD057 0%, #34D399 100%)'
                  : 'linear-gradient(135deg, #4A4A4A 0%, #2A2A2A 100%)',
                boxShadow: isGoalReached
                  ? '2px 2px 0px rgba(0, 0, 0, 0.4)'
                  : '2px 2px 0px rgba(0, 0, 0, 0.6)',
              }}
            >
              <Share2 style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold uppercase tracking-tight text-[var(--text)]"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-label-1)' : 'var(--fs-title-4)',
                  fontWeight: 'var(--fw-label-heavy)',
                  marginBottom: 'var(--space-0-5)',
                }}
              >
                Share Your Achievement
              </h3>
              <p className="text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  marginBottom: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
                }}
              >
                {isGoalReached
                  ? 'You crushed your goal today! Share your progress with the community.'
                  : `Complete your goal to unlock sharing (${(dailyGoal - todaySteps).toLocaleString()} steps left)`}
              </p>
              {isGoalReached && (
                <div className="flex"
                  style={{
                    gap: 'var(--space-1)',
                  }}
                >
                  <button
                    onClick={() =>
                      onShare(
                        'twitter',
                        `Just hit my ${(dailyGoal / 1000).toFixed(
                          1
                        )}K step goal on @Move10K! Moving more, earning more. 💪`
                      )
                    }
                    className="flex-1 bg-black border-2 border-black rounded-lg font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
                    style={{
                      padding: isMiniApp ? 'var(--space-1) var(--space-2)' : 'var(--space-1-5) var(--space-3)',
                      fontSize: 'var(--fs-caption)',
                      fontWeight: 'var(--fw-caption)',
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
                    className="flex-1 border-2 border-black rounded-lg font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
                    style={{
                      padding: isMiniApp ? 'var(--space-1) var(--space-2)' : 'var(--space-1-5) var(--space-3)',
                      fontSize: 'var(--fs-caption)',
                      fontWeight: 'var(--fw-caption)',
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
          className="border-2 border-black rounded-xl bg-[var(--surface-elevated)]"
          style={{
            padding: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-center pb-2 border-b-2 border-black/20"
            style={{
              gap: 'var(--space-1-5)',
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            <div
              className="rounded border-2 border-black flex items-center justify-center"
              style={{
                width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                backgroundColor: 'rgb(59, 130, 246)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5), 0 0 15px rgb(59 130 246 / 0.5)'
              }}
            >
              <Users style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" strokeWidth={2.5} />
            </div>
            <h3 className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
              }}
            >
              Community Activity
            </h3>
          </div>

          <div className="grid grid-cols-3"
            style={{
              gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
            }}
          >
            <div className="text-center">
              <div className="font-bold font-mono"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-title-4)' : 'var(--fs-title-3)',
                  marginBottom: 'var(--space-0-25)',
                  color: 'rgb(59, 130, 246)'
                }}
              >1.2K</div>
              <div className="uppercase font-bold tracking-tight text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono text-success"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-title-4)' : 'var(--fs-title-3)',
                  marginBottom: 'var(--space-0-25)',
                }}
              >15M</div>
              <div className="uppercase font-bold tracking-tight text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                Steps Today
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold font-mono text-warning"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-title-4)' : 'var(--fs-title-3)',
                  marginBottom: 'var(--space-0-25)',
                }}
              >892</div>
              <div className="uppercase font-bold tracking-tight text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
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
          className="border-2 border-black rounded-xl bg-[var(--bg-secondary)] text-center relative overflow-hidden"
          style={{
            padding: isMiniApp ? 'var(--space-4)' : 'var(--space-6)',
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
              className="rounded-full border-2 border-black bg-[var(--surface-elevated)] flex items-center justify-center mx-auto"
              style={{
                width: isMiniApp ? 'var(--avatar-xxl)' : 'var(--avatar-xxxl)',
                height: isMiniApp ? 'var(--avatar-xxl)' : 'var(--avatar-xxxl)',
                marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)'
              }}
            >
              <TrendingUp style={{ width: 'var(--icon-m)', height: 'var(--icon-m)' }} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
              style={{
                fontSize: isMiniApp ? 'var(--fs-label-2)' : 'var(--fs-label-1)',
                fontWeight: 'var(--fw-label-heavy)',
                marginBottom: 'var(--space-0-5)',
              }}
            >
              Activity Feed Coming Soon
            </p>
            <p className="text-[var(--text-muted)]"
              style={{
                fontSize: 'var(--fs-caption)',
              }}
            >See what your friends are achieving</p>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};
