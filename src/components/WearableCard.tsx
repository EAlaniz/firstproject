import React from 'react';
import type { WearableDevice } from '../types/wearables';

interface WearableCardProps {
  device: WearableDevice;
  onConnect: () => void;
  onDisconnect: () => void;
}

export const WearableCard: React.FC<WearableCardProps> = ({
  device,
  onConnect,
  onDisconnect,
}) => {
  const { name, description, icon, color, comingSoon, status, stepData } = device;
  const { isConnected, isConnecting, lastSyncTime, error } = status;

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div
      className={`card card-elevated p-6 rounded-lg relative transition-all duration-base ${comingSoon ? 'opacity-60' : ''}`}
      style={{
        border: `2px solid ${isConnected ? color : 'transparent'}`,
        background: isConnected
          ? `linear-gradient(135deg, ${color}12 0%, ${color}08 100%)`
          : undefined,
      }}
    >
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
          Coming Soon
        </div>
      )}

      {/* Header */}
      <div className="flex items-center mb-3">
        <div className="text-3xl mr-3">{icon}</div>
        <div className="flex-1">
          <h3 className="m-0 text-lg font-semibold text-neutral-700 dark:text-neutral-100">
            {name}
          </h3>
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {description}
          </p>
        </div>
      </div>

      {/* Status */}
      {!comingSoon && (
        <>
          <div className="mb-3">
            {isConnected && stepData && (
              <div className="card p-4 rounded-md mb-2 shadow-sm">
                <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-1 font-medium">
                  Today's Steps
                </div>
                <div
                  className="text-3xl font-extrabold"
                  style={{
                    background: `linear-gradient(135deg, ${color} 0%, ${color}AA 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {stepData.steps.toLocaleString()}
                </div>
              </div>
            )}

            {isConnected && lastSyncTime && (
              <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1 font-medium">
                <span className="text-sm">🔄</span>
                Last synced: {formatLastSync(lastSyncTime)}
              </div>
            )}

            {error && (
              <div className="bg-warning/10 border border-warning/50 p-2 px-3 rounded-md text-xs text-warning mt-2">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isConnecting || comingSoon}
            className={`btn w-full ${
              isConnected
                ? 'btn-secondary'
                : 'text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-base'
            } ${isConnecting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            style={{
              background: !isConnected
                ? `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`
                : undefined,
            }}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </>
      )}

      {comingSoon && (
        <div className="text-center p-4 text-xs text-neutral-400">
          We're working on adding {name} integration soon!
        </div>
      )}
    </div>
  );
};
