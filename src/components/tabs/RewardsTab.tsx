import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Trophy, TrendingUp, Gift, ExternalLink } from 'lucide-react';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="h-full flex flex-col overflow-hidden"
    >
      {/* Token Balance Card - Poolsuite LCD Style */}
      <section className="flex-1 flex flex-col justify-center space-y-3 overflow-y-auto max-w-2xl mx-auto w-full">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="border-2 border-black rounded-xl p-6 bg-gradient-to-br from-[var(--surface-elevated-2)] to-[var(--bg-secondary)] text-center relative overflow-hidden"
          style={{
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
            <div className="text-xs uppercase font-bold tracking-wide text-[var(--text-muted)] mb-2">
              Total Tokens Earned
            </div>
            <div
              className="text-5xl font-bold font-mono leading-none mb-4"
              style={{
                color: 'rgb(59, 130, 246)',
                textShadow: '0px 0px 30px rgb(59 130 246 / 0.5), 0px 0px 50px rgb(59 130 246 / 0.3)'
              }}
            >
              {totalTokens.toLocaleString()}
            </div>
            <div className="flex justify-center gap-2">
              <button
                className="px-4 py-2 border-2 border-black rounded-lg text-sm font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
                style={{
                  backgroundColor: 'rgb(59, 130, 246)',
                  boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9), 0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)',
                }}
              >
                <Coins size={16} />
                <span>Claim Rewards</span>
              </button>
              <button
                className="px-4 py-2 bg-[var(--surface-elevated-2)] border-2 border-black rounded-lg text-sm font-bold uppercase tracking-tight text-[var(--text)] transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none flex items-center gap-2"
                style={{
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
          className="border-2 border-black rounded-xl p-4 bg-[var(--surface-elevated)]"
          style={{
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-black/20">
            <h3 className="text-xs font-bold uppercase tracking-tight text-[var(--text-secondary)]">
              Wallet Balance
            </h3>
            <span className="text-xs font-mono text-[var(--text-muted)] bg-black/30 border border-black/40 px-2 py-1 rounded">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          {balance && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-tight text-[var(--text-muted)]">
                {balance.symbol} Balance:
              </span>
              <span className="text-xl font-bold font-mono" style={{ color: 'rgb(59, 130, 246)' }}>
                {parseFloat(balance.formatted).toFixed(4)}
              </span>
            </div>
          )}
        </motion.div>


      {/* Stats Grid - Poolsuite Style */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.3 }}
            className="border-2 border-black rounded-xl p-4 bg-[var(--surface-elevated-2)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
            style={{
              boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
              }}
            >
              <Trophy size={20} color="white" />
            </div>
            <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)] mb-1">
              Current Streak
            </div>
            <div className="text-3xl font-bold font-mono text-[var(--text)] leading-none">
              {currentStreak}
              <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">days</span>
            </div>
          </motion.div>

          {/* Tokens This Week */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.35 }}
            className="border-2 border-black rounded-xl p-4 bg-[var(--surface-elevated-2)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
            style={{
              boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.8)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg border-2 border-black flex items-center justify-center mb-3"
              style={{
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4), 0 0 20px rgb(59 130 246 / 0.5)',
              }}
            >
              <TrendingUp size={20} color="white" />
            </div>
            <div className="text-xs uppercase font-bold tracking-tight text-[var(--text-muted)] mb-1">
              This Week
            </div>
            <div className="text-3xl font-bold font-mono text-[var(--text)] leading-none">
              +{Math.floor(totalTokens * 0.3)}
              <span className="text-xs font-normal ml-1 text-[var(--text-muted)]">tokens</span>
            </div>
          </motion.div>
        </div>


      {/* Reward Tiers - Poolsuite Style */}
      <div className="mb-3">
        <h2 className="text-xs font-bold uppercase tracking-tight text-[var(--text-secondary)] mb-2 ml-1">
          Reward Tiers
        </h2>

        <div className="space-y-2">
          {/* Bronze Tier - Active */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.4 }}
            className="border-2 border-black rounded-xl p-3 bg-[var(--surface-elevated)] relative overflow-hidden"
            style={{
              boxShadow: '3px 3px 0px rgba(205, 127, 50, 0.4)',
              borderLeftWidth: '6px',
              borderLeftColor: '#CD7F32',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy size={16} color="white" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
                    Bronze Tier
                  </div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">10 tokens per goal</div>
                </div>
              </div>
              <div className="text-xs font-bold uppercase tracking-tight px-2 py-1 rounded border-2 border-black bg-[#CD7F32] text-white">
                Active
              </div>
            </div>
          </motion.div>

          {/* Silver Tier - Locked */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.45 }}
            className="border-2 border-black rounded-xl p-3 bg-[var(--surface-elevated)] opacity-60 relative overflow-hidden"
            style={{
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
              borderLeftWidth: '6px',
              borderLeftColor: '#C0C0C0',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy size={16} color="white" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
                    Silver Tier
                  </div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">15 tokens per goal</div>
                </div>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--text-muted)]">250 tokens</div>
            </div>
          </motion.div>

          {/* Gold Tier - Locked */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springConfig, delay: 0.5 }}
            className="border-2 border-black rounded-xl p-3 bg-[var(--surface-elevated)] opacity-60 relative overflow-hidden"
            style={{
              boxShadow: '3px 3px 0px rgba(0, 0, 0, 0.5)',
              borderLeftWidth: '6px',
              borderLeftColor: '#FFD700',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <Trophy size={16} color="white" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight text-[var(--text)]">
                    Gold Tier
                  </div>
                  <div className="text-xs font-mono text-[var(--text-muted)]">20 tokens per goal</div>
                </div>
              </div>
              <div className="text-xs font-bold font-mono text-[var(--text-muted)]">500 tokens</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Coming Soon - Poolsuite Style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.55 }}
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
              <Gift size={24} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-sm font-bold uppercase tracking-tight text-[var(--text-secondary)] mb-1">
              More Rewards Coming Soon
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              NFT badges, exclusive perks, and partner rewards
            </p>
          </div>
        </motion.div>
      </section>
    </motion.div>
  );
};
