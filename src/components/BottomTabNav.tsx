import React from 'react';
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="flex justify-center"
        style={{
          paddingBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
          paddingLeft: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
          paddingRight: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
        }}
      >
        <div
          className="inline-flex bg-[var(--surface-elevated)] border-2 border-black rounded-xl pointer-events-auto"
          style={{
            gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
            padding: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.9)',
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center rounded-lg border-2 border-black transition-all duration-150 ${
                  isActive
                    ? 'text-white translate-y-[1px]'
                    : 'bg-[var(--surface-elevated-2)] text-[var(--text-muted)] hover:translate-y-[-1px] active:translate-y-[1px] active:shadow-none'
                }`}
                style={{
                  gap: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
                  paddingLeft: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
                  paddingRight: isMiniApp ? 'var(--space-2)' : 'var(--space-4)',
                  paddingTop: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
                  paddingBottom: isMiniApp ? 'var(--space-1)' : 'var(--space-2)',
                  backgroundColor: isActive ? 'rgb(59, 130, 246)' : undefined,
                  boxShadow: isActive ? '0 0 20px rgb(59 130 246 / 0.5), 0 0 40px rgb(59 130 246 / 0.3)' : '0px 2px 0px rgba(0, 0, 0, 0.8)',
                }}
              >
                {/* Icon */}
                {tab.icon}

                {/* Label */}
                <span className="uppercase tracking-tight font-bold"
                  style={{
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 'var(--fw-caption)',
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
      <div className="pointer-events-none" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
};
