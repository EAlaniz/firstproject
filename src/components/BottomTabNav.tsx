import React from 'react';
import { motion } from 'framer-motion';
import { Activity, MessageCircle, Trophy } from 'lucide-react';
import { useIsBaseMiniApp } from '../hooks/useIsBaseMiniApp';

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
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: 'connect',
    label: 'Connect',
    icon: <MessageCircle className="w-4 h-4" />,
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: <Trophy className="w-4 h-4" />,
  },
];

export const BottomTabNav: React.FC<BottomTabNavProps> = ({ activeTab, onTabChange }) => {
  const { isMiniApp } = useIsBaseMiniApp();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-3" style={{ minHeight: isMiniApp ? '48px' : '56px' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex flex-col items-center justify-center transition-colors duration-fast py-2 ${
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
                <div className="mb-0.5">
                  {tab.icon}
                </div>

                {/* Label */}
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-normal'}`}>
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
