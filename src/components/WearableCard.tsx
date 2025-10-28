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
      className="wearable-card"
      style={{
        border: `2px solid ${isConnected ? color : '#E0E0E0'}`,
        borderRadius: '12px',
        padding: '20px',
        backgroundColor: isConnected ? `${color}08` : '#FAFAFA',
        position: 'relative',
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            backgroundColor: '#FFA726',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
          }}
        >
          Coming Soon
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ fontSize: '32px', marginRight: '12px' }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            {name}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666', marginTop: '2px' }}>
            {description}
          </p>
        </div>
      </div>

      {/* Status */}
      {!comingSoon && (
        <>
          <div style={{ marginBottom: '12px' }}>
            {isConnected && stepData && (
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  Today's Steps
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color }}>
                  {stepData.steps.toLocaleString()}
                </div>
              </div>
            )}

            {isConnected && lastSyncTime && (
              <div style={{ fontSize: '12px', color: '#666', display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '6px' }}>🔄</span>
                Last synced: {formatLastSync(lastSyncTime)}
              </div>
            )}

            {error && (
              <div
                style={{
                  backgroundColor: '#FFF3E0',
                  border: '1px solid #FFB74D',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#E65100',
                  marginTop: '8px',
                }}
              >
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isConnecting || comingSoon}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isConnected ? '#F5F5F5' : color,
              color: isConnected ? '#666' : 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: isConnecting || comingSoon ? 'not-allowed' : 'pointer',
              opacity: isConnecting ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </>
      )}

      {comingSoon && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px',
            fontSize: '13px',
            color: '#999',
          }}
        >
          We're working on adding {name} integration soon!
        </div>
      )}
    </div>
  );
};
