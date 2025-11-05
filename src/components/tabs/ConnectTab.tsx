import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useIsBaseMiniApp } from '../../hooks/useIsBaseMiniApp';
import { XMTPMessenger } from '../XMTPMessenger';
import { MovementWall } from '../MovementWall';

interface ConnectTabProps {
  todaySteps: number;
  dailyGoal: number;
}

const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

export const ConnectTab: React.FC<ConnectTabProps> = ({ todaySteps, dailyGoal }) => {
  const isGoalReached = todaySteps >= dailyGoal;
  const { isMiniApp } = useIsBaseMiniApp();
  const [showMessenger, setShowMessenger] = useState(false);
  const [selectedUserAddress, setSelectedUserAddress] = useState<string>('');

  const handleMessageUser = (address: string) => {
    setSelectedUserAddress(address);
    setShowMessenger(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="w-full h-full flex flex-col overflow-hidden"
    >
      {/* Scrollable Movement Wall - Goal Gated */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingLeft: 'var(--space-2)',
          paddingRight: 'var(--space-2)',
          paddingTop: 'var(--space-2)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <div className="relative max-w-2xl mx-auto">
          {/* Lock Overlay when goal not reached */}
          {!isGoalReached && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{
                backgroundColor: 'rgba(10, 11, 13, 0.92)',
                backdropFilter: 'blur(6px)',
                borderRadius: 'var(--space-2)',
              }}
            >
              <div
                className="rounded-full border-2 border-white/20 flex items-center justify-center"
                style={{
                  width: isMiniApp ? 'var(--avatar-xxl)' : 'var(--avatar-xxxl)',
                  height: isMiniApp ? 'var(--avatar-xxl)' : 'var(--avatar-xxxl)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  marginBottom: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                }}
              >
                <Lock
                  style={{
                    width: isMiniApp ? 'var(--icon-m)' : 'var(--icon-l)',
                    height: isMiniApp ? 'var(--icon-m)' : 'var(--icon-l)'
                  }}
                  className="text-white/60"
                />
              </div>
              <p
                className="font-bold uppercase tracking-tight text-white text-center"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-label-2)' : 'var(--fs-label-1)',
                  fontWeight: 'var(--fw-label-heavy)',
                  marginBottom: 'var(--space-0-5)',
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                }}
              >
                {(dailyGoal - todaySteps).toLocaleString()} Steps to Unlock
              </p>
              <p
                className="text-white/60 text-center"
                style={{
                  fontSize: 'var(--fs-caption)',
                  paddingLeft: 'var(--space-4)',
                  paddingRight: 'var(--space-4)',
                }}
              >
                Complete your daily goal to access the Movement Wall
              </p>
            </div>
          )}

          {/* Movement Wall Content (blurred when locked) */}
          <div
            style={{
              filter: !isGoalReached ? 'blur(4px)' : 'none',
              pointerEvents: !isGoalReached ? 'none' : 'auto',
            }}
          >
            <MovementWall onMessageUser={handleMessageUser} />
          </div>
        </div>
      </div>

      {/* XMTP Messenger Modal */}
      <XMTPMessenger isOpen={showMessenger} onClose={() => setShowMessenger(false)} />
    </motion.div>
  );
};
