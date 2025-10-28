import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Trophy, Zap, TrendingUp, Gift, ExternalLink } from 'lucide-react';

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
      className="pb-24"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 600,
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Rewards
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-500)',
          }}
        >
          Track your earnings and claim rewards
        </p>
      </div>

      {/* Token Balance Card */}
      <section className="mb-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...springConfig, delay: 0.1 }}
          className="card-dimensional p-8 text-center"
          style={{
            background: 'var(--gradient-mesh)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--gray-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 'var(--space-3)',
            }}
          >
            Total Tokens Earned
          </div>
          <div
            style={{
              fontSize: 'var(--text-display)',
              fontWeight: 700,
              background: 'var(--gradient-base)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              marginBottom: 'var(--space-4)',
            }}
          >
            {totalTokens.toLocaleString()}
          </div>
          <div className="flex justify-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-gradient"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Coins size={18} />
              <span>Claim Rewards</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'white',
                border: '2px solid var(--gray-200)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <ExternalLink size={16} />
              <span>View History</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Wallet Info */}
      <section className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.2 }}
          className="card-dimensional p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--gray-900)',
              }}
            >
              Wallet Balance
            </h3>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--gray-500)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          {balance && (
            <div className="flex items-center justify-between">
              <span
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-600)',
                }}
              >
                {balance.symbol} Balance:
              </span>
              <span
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  color: 'var(--gray-900)',
                }}
              >
                {parseFloat(balance.formatted).toFixed(4)}
              </span>
            </div>
          )}
        </motion.div>
      </section>

      {/* Stats Grid */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springConfig, delay: 0.3 }}
            className="stat-pill"
            style={{
              padding: 'var(--space-6)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Trophy size={24} color="white" />
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--gray-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-1)',
              }}
            >
              Current Streak
            </div>
            <div
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 700,
                color: 'var(--gray-900)',
                lineHeight: 1,
              }}
            >
              {currentStreak}
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginLeft: '4px' }}>
                days
              </span>
            </div>
          </motion.div>

          {/* Tokens This Week */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springConfig, delay: 0.35 }}
            className="stat-pill"
            style={{
              padding: 'var(--space-6)',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-3)',
                boxShadow: 'var(--shadow-base-glow)',
              }}
            >
              <TrendingUp size={24} color="white" />
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--gray-600)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 'var(--space-1)',
              }}
            >
              This Week
            </div>
            <div
              style={{
                fontSize: 'var(--text-3xl)',
                fontWeight: 700,
                color: 'var(--gray-900)',
                lineHeight: 1,
              }}
            >
              +{Math.floor(totalTokens * 0.3)}
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginLeft: '4px' }}>
                tokens
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reward Tiers */}
      <section className="mb-6">
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Reward Tiers
        </h2>

        <div className="space-y-3">
          {/* Bronze Tier */}
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="card-dimensional p-4"
            style={{
              borderLeft: '4px solid #CD7F32',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #CD7F32 0%, #B8860B 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={20} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--gray-900)',
                    }}
                  >
                    Bronze Tier
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                    }}
                  >
                    10 tokens per goal
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: '#CD7F32',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Active
              </div>
            </div>
          </motion.div>

          {/* Silver Tier */}
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="card-dimensional p-4 opacity-60"
            style={{
              borderLeft: '4px solid #C0C0C0',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={20} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--gray-900)',
                    }}
                  >
                    Silver Tier
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                    }}
                  >
                    15 tokens per goal
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-500)',
                  fontWeight: 600,
                }}
              >
                250 tokens
              </div>
            </div>
          </motion.div>

          {/* Gold Tier */}
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="card-dimensional p-4 opacity-60"
            style={{
              borderLeft: '4px solid #FFD700',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trophy size={20} color="white" />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--gray-900)',
                    }}
                  >
                    Gold Tier
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      color: 'var(--gray-600)',
                    }}
                  >
                    20 tokens per goal
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-500)',
                  fontWeight: 600,
                }}
              >
                500 tokens
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springConfig, delay: 0.4 }}
          className="card-dimensional p-8 text-center"
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--gray-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-3)',
            }}
          >
            <Gift size={32} style={{ color: 'var(--gray-400)' }} />
          </div>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--gray-500)',
              marginBottom: 'var(--space-1)',
            }}
          >
            More rewards coming soon
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-400)',
            }}
          >
            NFT badges, exclusive perks, and partner rewards
          </p>
        </motion.div>
      </section>
    </motion.div>
  );
};
