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
      className={`wearable-card card-elevated fade-in-up ${comingSoon ? '' : 'interactive'}`}
      style={{
        border: `2px solid ${isConnected ? color : 'transparent'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-6)',
        background: isConnected
          ? `linear-gradient(135deg, ${color}12 0%, ${color}08 100%)`
          : 'white',
        position: 'relative',
        opacity: comingSoon ? 0.6 : 1,
        transition: 'all var(--transition-base)',
      }}
    >
      {/* Coming Soon Badge */}
      {comingSoon && (
        <div
          className="scale-in"
          style={{
            position: 'absolute',
            top: 'var(--space-3)',
            right: 'var(--space-3)',
            background: 'var(--gradient-primary)',
            color: 'white',
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: 'var(--shadow-md)',
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
                className="glass scale-in"
                style={{
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 'var(--space-2)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--color-gray-600)', marginBottom: '4px', fontWeight: '500' }}>
                  Today's Steps
                </div>
                <div
                  className="text-gradient"
                  style={{
                    fontSize: '28px',
                    fontWeight: '800',
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
              <div
                className="pulse"
                style={{
                  fontSize: '12px',
                  color: 'var(--color-gray-500)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                  fontWeight: '500',
                }}
              >
                <span style={{ fontSize: '14px' }}>🔄</span>
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
            className="btn-enhanced"
            style={{
              width: '100%',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isConnected
                ? 'var(--color-gray-100)'
                : `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`,
              color: isConnected ? 'var(--color-gray-700)' : 'white',
              fontWeight: '700',
              fontSize: '14px',
              cursor: isConnecting || comingSoon ? 'not-allowed' : 'pointer',
              opacity: isConnecting ? 0.6 : 1,
              transition: 'all var(--transition-base)',
              boxShadow: isConnected ? 'none' : 'var(--shadow-md)',
              transform: 'translateZ(0)',
            }}
            onMouseEnter={(e) => {
              if (!isConnecting && !comingSoon && !isConnected) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isConnecting && !comingSoon) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = isConnected ? 'none' : 'var(--shadow-md)';
              }
            }}
          >
            {isConnecting ? (
              <span className="shimmer">Connecting...</span>
            ) : isConnected ? (
              'Disconnect'
            ) : (
              'Connect'
            )}
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
