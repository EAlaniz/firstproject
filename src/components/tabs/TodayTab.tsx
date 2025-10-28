import React from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw, Zap } from 'lucide-react';
import { StepsCard } from '../pages/Dashboard/StepsCard';
import { WearablesManager } from '../WearablesManager';

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

  // Whoop integration
  isWhoopConnected: boolean;
  isWhoopConnecting: boolean;
  whoopError: string | null;
  whoopData: any;
  connectWhoop: () => void;
  disconnectWhoop: () => void;
  refreshWhoopData: () => void;
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
  isWhoopConnected,
  isWhoopConnecting,
  whoopError,
  whoopData,
  connectWhoop,
  disconnectWhoop,
  refreshWhoopData,
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
        <h1
          style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 600,
            color: 'var(--gray-900)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Today's Activity
        </h1>
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--gray-500)',
          }}
        >
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
            className="p-4 bg-blue-50 border border-blue-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-1">Enable Step Tracking</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Connect to {stepDataSource === 'healthkit' ? 'Apple Health' : 'Health Connect'} to
                  automatically track your daily steps.
                </p>
                <button
                  onClick={requestPermissions}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
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
            className="p-4 bg-amber-50 border border-amber-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
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
                <h4 className="font-medium text-amber-900 mb-1">Health Permission Required</h4>
                <p className="text-sm text-amber-700 mb-3">{healthError}</p>
                <button
                  onClick={openHealthSettings}
                  className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                >
                  Open Health Settings
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Whoop Connection Banner */}
        {!isWhoopConnected && !isWhoopConnecting && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-purple-900 mb-1">Connect Your Whoop</h4>
                <p className="text-sm text-purple-700 mb-3">
                  Track recovery, sleep, and strain data. Get rewarded for optimal health!
                </p>
                <button
                  onClick={connectWhoop}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Connect Whoop</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Whoop Connecting State */}
        {isWhoopConnecting && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
              <p className="text-sm text-purple-700 font-medium">Connecting to Whoop...</p>
            </div>
          </div>
        )}

        {/* Whoop Connected State */}
        {isWhoopConnected && whoopData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springConfig}
            className="p-4 bg-green-50 border border-green-200 rounded-xl"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Zap className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900 mb-1">Whoop Connected</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    {whoopData.profile && (
                      <p>
                        Connected as {whoopData.profile.first_name} {whoopData.profile.last_name}
                      </p>
                    )}
                    {whoopData.recovery && (
                      <p>Latest Recovery: {whoopData.recovery.score?.recovery_score}%</p>
                    )}
                    {whoopData.sleep && (
                      <p>Sleep Performance: {whoopData.sleep.score?.sleep_performance_percentage}%</p>
                    )}
                    {whoopData.cycle && <p>Daily Strain: {whoopData.cycle.score?.strain.toFixed(1)}</p>}
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <button
                      onClick={refreshWhoopData}
                      className="text-xs text-green-600 hover:text-green-700 flex items-center space-x-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh Data</span>
                    </button>
                    <span className="text-gray-300">•</span>
                    <button onClick={disconnectWhoop} className="text-xs text-red-600 hover:text-red-700">
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Whoop Error Banner */}
        {whoopError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">Whoop Connection Error</h4>
                <p className="text-sm text-red-700">{whoopError}</p>
              </div>
            </div>
          </div>
        )}
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
          <span className="text-xs text-gray-500">
            {stepDataSource === 'healthkit' && '📱 Apple Health'}
            {stepDataSource === 'health-connect' && '📱 Health Connect'}
            {stepDataSource === 'mock' && '🌐 Demo Mode'}
            {stepDataSource === 'manual' && '✍️ Manual Entry'}
          </span>
          {isNative && hasPermission && (
            <button
              onClick={refreshSteps}
              disabled={isLoadingSteps}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 disabled:opacity-50"
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
            className="bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value={5000}>5K Steps</option>
            <option value={7500}>7.5K Steps</option>
            <option value={10000}>10K Steps</option>
            <option value={12500}>12.5K Steps</option>
            <option value={15000}>15K Steps</option>
          </select>
        </div>
      </section>

      {/* Wearables Section */}
      <section className="mb-8">
        <WearablesManager />
      </section>
    </motion.div>
  );
};
