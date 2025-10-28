import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Share2, Users, TrendingUp } from 'lucide-react';
import { XMTPMessenger } from '../../xmtp/components/XMTPMessenger';

interface ConnectTabProps {
  // XMTP
  xmtpClient: any;
  isInitializing: boolean;
  onInitializeXMTP: () => void;

  // Social
  todaySteps: number;
  dailyGoal: number;
  onShare: (platform: string, text: string) => void;
}

const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

export const ConnectTab: React.FC<ConnectTabProps> = ({
  xmtpClient,
  isInitializing,
  onInitializeXMTP,
  todaySteps,
  dailyGoal,
  onShare,
}) => {
  const isGoalReached = todaySteps >= dailyGoal;

  // If XMTP is initialized, show the messenger
  if (xmtpClient) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={springConfig}
        className="pb-24"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        <XMTPMessenger />
      </motion.div>
    );
  }

  // Otherwise, show the connect hub
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
          Connect
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-500)',
          }}
        >
          Share your progress and chat with the community
        </p>
      </div>

      {/* XMTP Messaging Card */}
      <section className="mb-6">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="card-dimensional p-6"
        >
          <div className="flex items-start space-x-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-base)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-base-glow)',
              }}
            >
              <MessageCircle size={24} color="white" />
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--gray-900)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Secure Messaging
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-600)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {isInitializing
                  ? 'Setting up your encrypted messaging...'
                  : 'Enable XMTP to chat securely with other users on Base'}
              </p>
              <button
                onClick={onInitializeXMTP}
                disabled={isInitializing}
                className="btn-gradient"
                style={{
                  opacity: isInitializing ? 0.6 : 1,
                  cursor: isInitializing ? 'not-allowed' : 'pointer',
                }}
              >
                {isInitializing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Initializing...</span>
                  </div>
                ) : (
                  'Enable Messaging'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Share Progress Card */}
      <section className="mb-6">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`card-dimensional p-6 ${!isGoalReached ? 'opacity-60' : ''}`}
        >
          <div className="flex items-start space-x-4">
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: isGoalReached
                  ? 'linear-gradient(135deg, #10B981 0%, #34D399 100%)'
                  : 'linear-gradient(135deg, #D1D5DB 0%, #9CA3AF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isGoalReached ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              <Share2 size={24} color="white" />
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  color: 'var(--gray-900)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Share Your Achievement
              </h3>
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--gray-600)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                {isGoalReached
                  ? 'You crushed your goal today! Share your progress with the community.'
                  : `Complete your goal to unlock sharing (${(dailyGoal - todaySteps).toLocaleString()} steps left)`}
              </p>
              {isGoalReached && (
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      onShare(
                        'twitter',
                        `Just hit my ${(dailyGoal / 1000).toFixed(
                          1
                        )}K step goal on @Move10K! Moving more, earning more. 💪`
                      )
                    }
                    className="flex-1 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Share on Warpcast
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Community Stats Card */}
      <section className="mb-6">
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="card-dimensional p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-5 h-5" style={{ color: 'var(--color-base-blue)' }} />
            <h3
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 600,
                color: 'var(--gray-900)',
              }}
            >
              Community Activity
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--color-base-blue)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                1.2K
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--success-600)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                15M
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Steps Today
              </div>
            </div>
            <div className="text-center">
              <div
                style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 700,
                  color: 'var(--warning-600)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                892
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--gray-600)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Goals Hit
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Recent Activity Feed (Coming Soon) */}
      <section className="mb-6">
        <h2
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Activity Feed
        </h2>

        <div className="text-center py-12">
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
            <TrendingUp size={32} style={{ color: 'var(--gray-400)' }} />
          </div>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: 'var(--gray-500)',
              marginBottom: 'var(--space-1)',
            }}
          >
            Activity feed coming soon
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--gray-400)',
            }}
          >
            See what your friends are achieving
          </p>
        </div>
      </section>
    </motion.div>
  );
};
