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
    <nav
      className="nav-minimal"
      style={{
        transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center py-3 transition-colors"
                style={{
                  color: isActive ? 'var(--color-base-blue)' : 'var(--gray-500)',
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-0.5"
                    style={{
                      background: 'var(--gradient-base)',
                    }}
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 300,
                    }}
                  />
                )}

                {/* Icon with scale animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 300,
                  }}
                  className="mb-1"
                >
                  {tab.icon}
                </motion.div>

                {/* Label */}
                <span
                  className="text-xs"
                  style={{
                    fontWeight: isActive ? 600 : 500,
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
