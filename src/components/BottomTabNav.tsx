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
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center py-3 transition-colors duration-fast ${
                  isActive ? 'text-brand-500' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-brand-500"
                    transition={{
                      duration: 0.25,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  />
                )}

                {/* Icon */}
                <div className="mb-1">{tab.icon}</div>

                {/* Label */}
                <span className={`text-xs ${isActive ? 'font-semibold' : 'font-normal'}`}>
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
