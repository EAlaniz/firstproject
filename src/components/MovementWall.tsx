import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Trophy, Flame } from 'lucide-react';
import { useIsBaseMiniApp } from '../hooks/useIsBaseMiniApp';

interface WallPost {
  id: string;
  address: string;
  ensName?: string;
  message: string;
  steps: number;
  streak: number;
  timestamp: Date;
  reactions: {
    fire: number;
    muscle: number;
    clap: number;
    trophy: number;
  };
}

interface MovementWallProps {
  onMessageUser: (address: string) => void;
}

// Mock data for demonstration
const mockPosts: WallPost[] = [
  {
    id: '1',
    address: '0x1234...5678',
    ensName: 'vitalik.eth',
    message: 'Just crushed 15K steps! Who\'s joining the 20K challenge? 💪',
    steps: 15234,
    streak: 12,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
    reactions: { fire: 15, muscle: 8, clap: 23, trophy: 5 },
  },
  {
    id: '2',
    address: '0xabcd...efgh',
    ensName: 'basebuilder.eth',
    message: 'Day 30 of my streak! Feeling unstoppable 🔥',
    steps: 12847,
    streak: 30,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5h ago
    reactions: { fire: 42, muscle: 18, clap: 31, trophy: 12 },
  },
  {
    id: '3',
    address: '0x9876...4321',
    message: 'First time hitting my 10K goal! This app is amazing 🎯',
    steps: 10234,
    streak: 3,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8h ago
    reactions: { fire: 8, muscle: 5, clap: 15, trophy: 3 },
  },
];

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const MovementWall: React.FC<MovementWallProps> = ({ onMessageUser }) => {
  const { isMiniApp } = useIsBaseMiniApp();
  const [postInputHeight, setPostInputHeight] = React.useState(0);
  const postInputRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const measureHeight = () => {
      if (postInputRef.current) {
        const height = postInputRef.current.offsetHeight;
        setPostInputHeight(height);
      }
    };

    // Measure immediately
    measureHeight();

    // Also measure after a short delay to ensure everything is rendered
    const timer = setTimeout(measureHeight, 100);

    // Setup ResizeObserver for dynamic resizing
    const resizeObserver = new ResizeObserver(measureHeight);
    if (postInputRef.current) {
      resizeObserver.observe(postInputRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [isMiniApp]);

  return (
    <div
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Post Input - Fixed at top */}
      <motion.div
        ref={postInputRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.1 }}
        className="border-2 border-black rounded-xl bg-[var(--surface-elevated)]"
        style={{
          padding: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
          boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
        }}
      >
        <h3
          className="font-bold uppercase tracking-tight text-[var(--text)]"
          style={{
            fontSize: isMiniApp ? 'var(--fs-label-1)' : 'var(--fs-title-4)',
            fontWeight: 'var(--fw-label-heavy)',
            marginBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
          }}
        >
          Share with Community
        </h3>
        <textarea
          placeholder="Share your progress, motivation, or create a challenge..."
          className="w-full border-2 border-black rounded-lg bg-[var(--bg)] text-[var(--text)] outline-none resize-none"
          style={{
            fontSize: 'var(--fs-caption)',
            padding: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            minHeight: isMiniApp ? '80px' : '100px',
          }}
        />
        <button
          className="w-full border-2 border-black rounded-lg font-bold uppercase tracking-tight text-white transition-all hover:translate-y-[-2px] active:translate-y-[1px] active:shadow-none"
          style={{
            padding: isMiniApp ? 'var(--space-1-5) var(--space-2)' : 'var(--space-2) var(--space-3)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 'var(--fw-caption)',
            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
            boxShadow: '0px 3px 0px rgba(0, 0, 0, 0.9)',
          }}
        >
          Post to Wall
        </button>
      </motion.div>

      {/* Scrollable Feed Section */}
      <div
        style={{
          position: 'absolute',
          top: postInputHeight > 0 ? `${postInputHeight + (isMiniApp ? 16 : 24)}px` : (isMiniApp ? '220px' : '260px'),
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'scroll',
          overflowX: 'hidden',
          paddingRight: 'var(--space-1)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Feed Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.2 }}
        >
          <h3
            className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
            style={{
              fontSize: 'var(--fs-caption)',
              fontWeight: 'var(--fw-caption)',
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            Recent Activity
          </h3>
        </motion.div>

        {/* Posts Feed */}
        <div className="flex flex-col" style={{ gap: isMiniApp ? 'var(--space-3)' : 'var(--space-4)' }}>
          {mockPosts.map((post, index) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300, delay: 0.3 + index * 0.1 }}
          className="border-2 border-black rounded-xl bg-[var(--surface-elevated)]"
          style={{
            padding: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Post Header */}
          <div
            className="flex items-center justify-between pb-2 border-b-2 border-black/20"
            style={{
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            <div className="flex items-center" style={{ gap: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)' }}>
              {/* Avatar */}
              <div
                className="rounded-full border-2 border-black flex items-center justify-center"
                style={{
                  width: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                  height: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                  background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.5)',
                }}
              >
                <span
                  className="font-bold text-white"
                  style={{ fontSize: isMiniApp ? 'var(--fs-caption)' : 'var(--fs-label-2)' }}
                >
                  {post.ensName ? post.ensName[0].toUpperCase() : post.address[2].toUpperCase()}
                </span>
              </div>

              {/* User Info */}
              <div>
                <p
                  className="font-bold text-[var(--text)]"
                  style={{
                    fontSize: isMiniApp ? 'var(--fs-caption)' : 'var(--fs-label-2)',
                    fontWeight: 'var(--fw-label-heavy)',
                  }}
                >
                  {post.ensName || post.address}
                </p>
                <p
                  className="text-[var(--text-muted)]"
                  style={{ fontSize: 'var(--fs-caption)' }}
                >
                  {formatTimeAgo(post.timestamp)}
                </p>
              </div>
            </div>
          </div>

          {/* Post Message */}
          <p
            className="text-[var(--text)]"
            style={{
              fontSize: isMiniApp ? 'var(--fs-caption)' : 'var(--fs-label-2)',
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
              lineHeight: '1.5',
            }}
          >
            {post.message}
          </p>

          {/* Stats Bar */}
          <div
            className="flex items-center border-2 border-black rounded-lg bg-[var(--bg)]"
            style={{
              padding: isMiniApp ? 'var(--space-1-5)' : 'var(--space-2)',
              marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
              gap: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
            }}
          >
            <div className="flex items-center" style={{ gap: 'var(--space-0-5)' }}>
              <Trophy style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} className="text-warning" />
              <span
                className="font-mono font-bold text-[var(--text)]"
                style={{ fontSize: 'var(--fs-caption)' }}
              >
                {post.steps.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: 'var(--space-0-5)' }}>
              <Flame style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} className="text-error" />
              <span
                className="font-mono font-bold text-[var(--text)]"
                style={{ fontSize: 'var(--fs-caption)' }}
              >
                {post.streak} day
              </span>
            </div>
          </div>

          {/* Reactions Bar */}
          <div
            className="flex items-center justify-between"
          >
            <div className="flex items-center" style={{ gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)' }}>
              <button
                className="flex items-center border-2 border-black rounded-lg bg-[var(--surface-elevated-2)] transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                style={{
                  padding: isMiniApp ? 'var(--space-0-5) var(--space-1)' : 'var(--space-1) var(--space-1-5)',
                  gap: 'var(--space-0-5)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                }}
              >
                <span style={{ fontSize: isMiniApp ? '12px' : '14px' }}>🔥</span>
                <span
                  className="font-mono font-bold text-[var(--text-secondary)]"
                  style={{ fontSize: 'var(--fs-caption)' }}
                >
                  {post.reactions.fire}
                </span>
              </button>
              <button
                className="flex items-center border-2 border-black rounded-lg bg-[var(--surface-elevated-2)] transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                style={{
                  padding: isMiniApp ? 'var(--space-0-5) var(--space-1)' : 'var(--space-1) var(--space-1-5)',
                  gap: 'var(--space-0-5)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                }}
              >
                <span style={{ fontSize: isMiniApp ? '12px' : '14px' }}>💪</span>
                <span
                  className="font-mono font-bold text-[var(--text-secondary)]"
                  style={{ fontSize: 'var(--fs-caption)' }}
                >
                  {post.reactions.muscle}
                </span>
              </button>
              <button
                className="flex items-center border-2 border-black rounded-lg bg-[var(--surface-elevated-2)] transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                style={{
                  padding: isMiniApp ? 'var(--space-0-5) var(--space-1)' : 'var(--space-1) var(--space-1-5)',
                  gap: 'var(--space-0-5)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                }}
              >
                <span style={{ fontSize: isMiniApp ? '12px' : '14px' }}>👏</span>
                <span
                  className="font-mono font-bold text-[var(--text-secondary)]"
                  style={{ fontSize: 'var(--fs-caption)' }}
                >
                  {post.reactions.clap}
                </span>
              </button>
            </div>

            {/* Message Button */}
            <button
              onClick={() => onMessageUser(post.address)}
              className="flex items-center border-2 border-black rounded-lg font-bold uppercase tracking-tight transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
              style={{
                padding: isMiniApp ? 'var(--space-1) var(--space-1-5)' : 'var(--space-1) var(--space-2)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                color: 'white',
                boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                gap: 'var(--space-0-5)',
              }}
            >
              <MessageCircle style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
              <span>Message</span>
            </button>
          </div>
        </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
