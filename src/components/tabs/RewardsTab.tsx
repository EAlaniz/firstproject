import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Trophy, TrendingUp, Gift, ExternalLink } from 'lucide-react';
import { useIsBaseMiniApp } from '../../hooks/useIsBaseMiniApp';

interface RewardsTabProps {
  totalTokens: number;
  currentStreak: number;
  address: string | undefined;
  balance: any;
}

const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

export const RewardsTab: React.FC<RewardsTabProps> = ({
  totalTokens,
  currentStreak,
  address,
  balance,
}) => {
  const { isMiniApp } = useIsBaseMiniApp();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Token Balance Card - Poolsuite LCD Style */}
      <section className="flex-1 flex flex-col justify-center overflow-y-auto max-w-2xl mx-auto w-full"
        style={{
          gap: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="border-2 border-black rounded-xl bg-gradient-to-br from-[var(--surface-elevated-2)] to-[var(--bg-secondary)] text-center relative overflow-hidden"
          style={{
            padding: isMiniApp ? 'var(--space-4)' : 'var(--space-6)',
            boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.3), 4px 4px 0px rgba(0, 0, 0, 0.9)',
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
            <div className="uppercase font-bold tracking-wide text-[var(--text-muted)]"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Total Tokens Earned
            </div>
            <div
              className="font-bold font-mono leading-none"
              style={{
                fontSize: isMiniApp ? 'var(--fs-display-2)' : 'var(--fs-display-1)',
                marginBottom: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
                color: 'rgb(59, 130, 246)',
                textShadow: '0px 0px 30px rgb(59 130 246 / 0.5), 0px 0px 50px rgb(59 130 246 / 0.3)'
              }}
            >
              {totalTokens.toLocaleString()}
            </div>
            <div className="flex justify-center"
              style={{
                gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
              }}
            >
              <button
                className="border-2 border-black rounded-lg font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none flex items-center"
                style={{
                  padding: isMiniApp ? 'var(--space-1-5) var(--space-2)' : 'var(--space-2) var(--space-4)',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                  backgroundColor: 'rgb(59, 130, 246)',
                  boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)',
                }}
              >
                <Coins size={16} />
                <span>Claim Rewards</span>
              </button>
              <button
                className="bg-[var(--surface-elevated-2)] border-2 border-black rounded-lg font-bold uppercase tracking-tight text-[var(--text)] transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none flex items-center"
                style={{
                  padding: isMiniApp ? 'var(--space-1-5) var(--space-2)' : 'var(--space-2) var(--space-4)',
                  gap: 'var(--space-1)',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                  boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9)',
                }}
              >
                <ExternalLink size={14} />
                <span>History</span>
              </button>
            </div>
          </div>
        </motion.div>


      {/* Wallet Info - Poolsuite Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.2 }}
          className="border-2 border-black rounded-xl bg-[var(--surface-elevated)]"
          style={{
            padding: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b-2 border-black/20"
            style={{
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            <h3 className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
              }}
            >
              Wallet Balance
            </h3>
            <span className="font-mono text-[var(--text-muted)] bg-black/30 border border-black/40 rounded"
              style={{
                fontSize: 'var(--fs-caption)',
                padding: 'var(--space-0-5) var(--space-1)',
              }}
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          {balance && (
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-tight text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                {balance.symbol} Balance:
              </span>
              <span className="font-bold font-mono"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-title-3)' : 'var(--fs-title-2)',
                  color: 'rgb(59, 130, 246)'
                }}
              >
                {parseFloat(balance.formatted).toFixed(4)}
              </span>
            </div>
          )}
        </motion.div>


      {/* Stats Grid - Poolsuite Style */}
        <div className="grid grid-cols-2"
          style={{
            gap: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
          }}
        >
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.3 }}
            className="border-2 border-black rounded-xl bg-[var(--surface-elevated-2)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
            style={{
              padding: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
              boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              className="rounded-lg border-2 border-black flex items-center justify-center"
              style={{
                width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                marginBottom: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Trophy style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" />
            </div>
            <div className="uppercase font-bold tracking-tight text-[var(--text-muted)]"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                marginBottom: 'var(--space-0-5)',
              }}
            >
              Current Streak
            </div>
            <div className="font-bold font-mono text-[var(--text)] leading-none">
              <span style={{ fontSize: isMiniApp ? 'var(--fs-title-2)' : 'var(--fs-title-1)' }}>
                {currentStreak}
              </span>
              <span className="font-normal text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  marginLeft: 'var(--space-0-5)',
                }}
              >
                days
              </span>
            </div>
          </motion.div>

          {/* Tokens This Week */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.35 }}
            className="border-2 border-black rounded-xl bg-[var(--surface-elevated-2)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
            style={{
              padding: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
              boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              className="rounded-lg border-2 border-black flex items-center justify-center"
              style={{
                width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                marginBottom: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4), 0 0 20px rgb(59 130 246 / 0.5)',
              }}
            >
              <TrendingUp style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} color="white" />
            </div>
            <div className="uppercase font-bold tracking-tight text-[var(--text-muted)]"
              style={{
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                marginBottom: 'var(--space-0-5)',
              }}
            >
              This Week
            </div>
            <div className="font-bold font-mono text-[var(--text)] leading-none">
              <span style={{ fontSize: isMiniApp ? 'var(--fs-title-2)' : 'var(--fs-title-1)' }}>
                +{Math.floor(totalTokens * 0.3)}
              </span>
              <span className="font-normal text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  marginLeft: 'var(--space-0-5)',
                }}
              >
                tokens
              </span>
            </div>
          </motion.div>
        </div>


      {/* Reward Tiers - Poolsuite Style */}
      <div>
        <h2 className="font-bold uppercase tracking-tight text-[var(--text-secondary)] ml-1"
          style={{
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-caption)',
            marginBottom: 'var(--space-1-5)',
          }}
        >
          Reward Tiers
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)' }}>
          {/* Bronze Tier - Active */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.4 }}
            className="border-2 border-black rounded-xl bg-[var(--surface-elevated)] relative overflow-hidden"
            style={{
              padding: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
              boxShadow: '3px 3px 0px rgba(205, 127, 50, 0.4)',
              borderLeftWidth: '6px',
              borderLeftColor: '#CD7F32',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center"
                style={{
                  gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
                }}
              >
                <div
                  className="rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    width: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    height: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    background: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} color="white" />
                </div>
                <div>
                  <div className="font-bold uppercase tracking-tight text-[var(--text)]"
                    style={{
                      fontSize: 'var(--fs-label-2)',
                      fontWeight: 'var(--fw-label-heavy)',
                    }}
                  >
                    Bronze Tier
                  </div>
                  <div className="font-mono text-[var(--text-muted)]"
                    style={{
                      fontSize: 'var(--fs-caption)',
                    }}
                  >
                    10 tokens per goal
                  </div>
                </div>
              </div>
              <div className="font-bold uppercase tracking-tight rounded border-2 border-black bg-[#CD7F32] text-white"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                  padding: 'var(--space-0-5) var(--space-1-5)',
                }}
              >
                Active
              </div>
            </div>
          </motion.div>

          {/* Silver Tier - Locked */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.45 }}
            className="border-2 border-black rounded-xl bg-[var(--surface-elevated)] opacity-60 relative overflow-hidden"
            style={{
              padding: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
              borderLeftWidth: '6px',
              borderLeftColor: '#C0C0C0',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center"
                style={{
                  gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
                }}
              >
                <div
                  className="rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    width: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    height: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} color="white" />
                </div>
                <div>
                  <div className="font-bold uppercase tracking-tight text-[var(--text)]"
                    style={{
                      fontSize: 'var(--fs-label-2)',
                      fontWeight: 'var(--fw-label-heavy)',
                    }}
                  >
                    Silver Tier
                  </div>
                  <div className="font-mono text-[var(--text-muted)]"
                    style={{
                      fontSize: 'var(--fs-caption)',
                    }}
                  >
                    15 tokens per goal
                  </div>
                </div>
              </div>
              <div className="font-bold font-mono text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                250 tokens
              </div>
            </div>
          </motion.div>

          {/* Gold Tier - Locked */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.5 }}
            className="border-2 border-black rounded-xl bg-[var(--surface-elevated)] opacity-60 relative overflow-hidden"
            style={{
              padding: isMiniApp ? 'var(--space-1-5)' : 'var(--space-3)',
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
              borderLeftWidth: '6px',
              borderLeftColor: '#FFD700',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center"
                style={{
                  gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
                }}
              >
                <div
                  className="rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    width: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    height: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} color="white" />
                </div>
                <div>
                  <div className="font-bold uppercase tracking-tight text-[var(--text)]"
                    style={{
                      fontSize: 'var(--fs-label-2)',
                      fontWeight: 'var(--fw-label-heavy)',
                    }}
                  >
                    Gold Tier
                  </div>
                  <div className="font-mono text-[var(--text-muted)]"
                    style={{
                      fontSize: 'var(--fs-caption)',
                    }}
                  >
                    20 tokens per goal
                  </div>
                </div>
              </div>
              <div className="font-bold font-mono text-[var(--text-muted)]"
                style={{
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 'var(--fw-caption)',
                }}
              >
                500 tokens
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Coming Soon - Poolsuite Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.55 }}
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
                width: isMiniApp ? 'var(--avatar-xl)' : 'var(--avatar-xxl)',
                height: isMiniApp ? 'var(--avatar-xl)' : 'var(--avatar-xxl)',
                marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)'
              }}
            >
              <Gift style={{ width: 'var(--icon-m)', height: 'var(--icon-m)' }} className="text-[var(--text-muted)]" />
            </div>
            <p className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
              style={{
                fontSize: 'var(--fs-label-2)',
                fontWeight: 'var(--fw-label-heavy)',
                marginBottom: 'var(--space-0-5)',
              }}
            >
              More Rewards Coming Soon
            </p>
            <p className="text-[var(--text-muted)]"
              style={{
                fontSize: 'var(--fs-caption)',
              }}
            >
              NFT badges, exclusive perks, and partner rewards
            </p>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};
