import React from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';
import { StepsCard } from '../pages/Dashboard/StepsCard';

interface TodayTabProps {
  // Steps data
  todaySteps: number;
  dailyGoal: number;
  currentStreak: number;
  totalTokens: number;
  onGoalChange: (goal: number) => void;

  // Health data
  isNative: boolean;
  hasPermission: boolean;
  isLoadingSteps: boolean;
  healthError: string | null;
  stepDataSource: string;
  requestPermissions: () => void;
  refreshSteps: () => void;
  openHealthSettings: () => void;
}

const springConfig = {
  type: 'spring' as const,
  damping: 25,
  stiffness: 300,
};

export const TodayTab: React.FC<TodayTabProps> = ({
  todaySteps,
  dailyGoal,
  currentStreak,
  totalTokens,
  onGoalChange,
  isNative,
  hasPermission,
  isLoadingSteps,
  healthError,
  stepDataSource,
  requestPermissions,
  refreshSteps,
  openHealthSettings,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springConfig}
      className="flex flex-col h-full"
    >
      {/* Permission Banners */}
      <div className="space-y-4 mb-2">
        {/* Health Permission Banner */}
        {isNative && !hasPermission && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="card p-4 rounded-xl"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(59, 130, 246, 0.3)'
            }}
          >
            <div className="flex items-start space-x-3">
              <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'rgb(59, 130, 246)' }} />
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Enable Step Tracking</h4>
                <p className="text-sm text-neutral-300 mb-3">
                  Connect to {stepDataSource === 'healthkit' ? 'Apple Health' : 'Health Connect'} to
                  automatically track your daily steps.
                </p>
                <button
                  onClick={requestPermissions}
                  className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'rgb(59, 130, 246)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgb(59, 130, 246)'}
                >
                  Enable Tracking
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Health Error Banner */}
        {healthError && isNative && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="card p-4 bg-warning/10 border border-warning/30 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-warning flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Health Permission Required</h4>
                <p className="text-sm text-neutral-300 mb-3">{healthError}</p>
                <button
                  onClick={openHealthSettings}
                  className="bg-warning text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors"
                >
                  Open Health Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Whoop removed for lean foundation */}
      </div>

      {/* Steps Card */}
      <section className="flex flex-col flex-1">
        <StepsCard
          currentSteps={todaySteps}
          dailyGoal={dailyGoal}
          currentStreak={currentStreak}
          totalTokens={totalTokens}
          onGoalChange={onGoalChange}
        />

        {/* Step Data Source Indicator & Refresh */}
        {isNative && hasPermission && (
          <div className="flex justify-center items-center mt-2 space-x-3">
            <span className="text-xs text-neutral-400">
              {stepDataSource === 'healthkit' && '📱 Apple Health'}
              {stepDataSource === 'health-connect' && '📱 Health Connect'}
            </span>
            <button
              onClick={refreshSteps}
              disabled={isLoadingSteps}
              className="text-xs hover:text-neutral-300 flex items-center space-x-1 disabled:opacity-50"
              style={{ color: 'rgb(59, 130, 246)' }}
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingSteps ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </section>

      {/* Wearables removed for lean foundation */}
    </motion.div>
  );
};
