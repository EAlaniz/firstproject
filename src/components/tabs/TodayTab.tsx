import React from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Zap } from 'lucide-react';
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
      className="pb-24"
    >
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-white mb-2">
          Today's Activity
        </h1>
        <p className="text-sm text-neutral-400">
          Track your progress and stay motivated
        </p>
      </div>

      {/* Permission Banners */}
      <div className="space-y-4 mb-6">
        {/* Health Permission Banner */}
        {isNative && !hasPermission && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="card p-4 bg-brand-500/10 border border-brand-500/30 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <Activity className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-white mb-1">Enable Step Tracking</h4>
                <p className="text-sm text-neutral-300 mb-3">
                  Connect to {stepDataSource === 'healthkit' ? 'Apple Health' : 'Health Connect'} to
                  automatically track your daily steps.
                </p>
                <button
                  onClick={requestPermissions}
                  className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
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
      <section className="mb-8">
        <StepsCard
          currentSteps={todaySteps}
          dailyGoal={dailyGoal}
          currentStreak={currentStreak}
          totalTokens={totalTokens}
        />

        {/* Step Data Source Indicator & Refresh */}
        <div className="flex justify-center items-center mt-4 space-x-3">
          <span className="text-xs text-neutral-400">
            {stepDataSource === 'healthkit' && '📱 Apple Health'}
            {stepDataSource === 'health-connect' && '📱 Health Connect'}
            {stepDataSource === 'mock' && '🌐 Demo Mode'}
            {stepDataSource === 'manual' && '✍️ Manual Entry'}
          </span>
          {isNative && hasPermission && (
            <button
              onClick={refreshSteps}
              disabled={isLoadingSteps}
              className="text-xs text-brand-500 hover:text-neutral-300 flex items-center space-x-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingSteps ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Goal Selector */}
        <div className="flex justify-center mt-6">
          <select
            value={dailyGoal}
            onChange={(e) => onGoalChange(Number(e.target.value))}
            className="bg-neutral-800 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value={5000}>5K Steps</option>
            <option value={7500}>7.5K Steps</option>
            <option value={10000}>10K Steps</option>
            <option value={12500}>12.5K Steps</option>
            <option value={15000}>15K Steps</option>
          </select>
        </div>
      </section>

      {/* Wearables removed for lean foundation */}
    </motion.div>
  );
};
