import React from 'react';
import { motion } from 'framer-motion';
import { Activity, MessageCircle, Trophy } from 'lucide-react';

export type TabView = 'today' | 'connect' | 'rewards';

interface BottomTabNavProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
}

interface TabConfig {
  id: TabView;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  {
    id: 'today',
    label: 'Today',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: <MessageCircle className="w-5 h-5" />,
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: <Trophy className="w-5 h-5" />,
  },
];

export const BottomTabNav: React.FC<BottomTabNavProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="nav-noir">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`nav-noir-item ${isActive ? 'active' : ''}`}
              >
                {/* Active indicator with glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: 'var(--gradient-blue-to-mint)',
                      boxShadow: 'var(--glow-blue-soft)',
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />
                )}

                {/* Icon with subtle illuminate animation */}
                <motion.div
                  animate={{
                    filter: isActive ? 'brightness(1.15)' : 'brightness(1)',
                  }}
                  transition={{
                    duration: 0.15,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="mb-1"
                >
                  {tab.icon}
                </motion.div>

                {/* Label */}
                <span
                  className="text-xs"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area for iOS notch */}
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
};
