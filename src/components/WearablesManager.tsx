import React, { useState } from 'react';
import { WearableCard } from './WearableCard';
import { useWearables } from '../hooks/useWearables';

export const WearablesManager: React.FC = () => {
  const { devices, connectedDevice, totalSteps, isLoading, connectDevice, disconnectDevice, refreshData } =
    useWearables();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card p-8 relative overflow-hidden">
      {/* Header */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl font-semibold text-neutral-700 dark:text-neutral-100 m-0">
            Wearables & Devices
          </h2>
          {connectedDevice && (
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`btn btn-secondary flex items-center gap-2 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
        <p className="m-0 text-neutral-500 dark:text-neutral-400 text-sm">
          Connect your fitness tracker to sync step data and earn rewards.
        </p>
      </div>

      {/* Connection Status Summary */}
      {connectedDevice ? (
        <div className="card bg-brand-500/5 border-2 border-brand-500 rounded-lg p-4 mb-6 relative z-10 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{connectedDevice.icon}</div>
              <div>
                <div className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                  Connected to {connectedDevice.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {connectedDevice.stepData ? (
                    connectedDevice.id === 'whoop' ? (
                      <>
                        <span className="font-semibold">
                          {connectedDevice.stepData.steps.toLocaleString()}
                        </span>{' '}
                        estimated steps
                      </>
                    ) : (
                      <>
                        <span className="font-semibold">
                          {connectedDevice.stepData.steps.toLocaleString()}
                        </span>{' '}
                        steps today
                      </>
                    )
                  ) : isLoading ? (
                    'Loading data...'
                  ) : (
                    'Waiting for data...'
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-2 rounded-md border border-brand-500 bg-white dark:bg-neutral-700 text-brand-500 text-xs font-semibold cursor-pointer hover:bg-brand-50 dark:hover:bg-neutral-600 transition-colors duration-fast"
            >
              {isExpanded ? 'Hide' : 'Manage'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-warning/10 border-2 border-warning rounded-lg p-4 mb-5 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <div className="text-sm font-semibold text-warning mb-1">
            No wearable connected
          </div>
          <div className="text-xs text-warning/80">
            Connect a device below to start tracking your steps
          </div>
        </div>
      )}

      {/* Device Grid - Only show if expanded or no device connected */}
      {(!connectedDevice || isExpanded) && (
        <>
          <div className="text-sm font-semibold mb-3 text-neutral-700 dark:text-neutral-100">
            Available Devices
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
            {devices.map((device) => (
              <WearableCard
                key={device.id}
                device={device}
                onConnect={() => connectDevice(device.id)}
                onDisconnect={() => disconnectDevice(device.id)}
              />
            ))}
          </div>

          {/* Info Footer */}
          <div className="mt-5 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-md text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            <strong className="font-semibold">Note:</strong> Currently, you can connect one device at a time. More devices will be supported soon!
            Step data is refreshed automatically every hour.
          </div>
        </>
      )}
    </div>
  );
};
