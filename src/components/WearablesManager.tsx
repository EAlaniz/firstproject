import React, { useState } from 'react';
import { WearableCard } from './WearableCard';
import { useWearables } from '../hooks/useWearables';

export const WearablesManager: React.FC = () => {
  const { devices, connectedDevice, totalSteps, isLoading, connectDevice, disconnectDevice, refreshData } =
    useWearables();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="card-elevated fade-in-up"
      style={{
        background: 'linear-gradient(to bottom, white 0%, var(--color-gray-50) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-8)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '200px',
          background: 'var(--gradient-mesh)',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
          <h2
            className="text-gradient"
            style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '800',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Wearables & Devices
          </h2>
          {connectedDevice && (
            <button
              onClick={refreshData}
              disabled={isLoading}
              className="btn-enhanced glass"
              style={{
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                opacity: isLoading ? 0.6 : 1,
                boxShadow: 'var(--shadow-base)',
                transition: 'all var(--transition-base)',
              }}
            >
              <span className={isLoading ? 'pulse' : ''}>🔄</span>
              {isLoading ? 'Syncing...' : 'Refresh'}
            </button>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-gray-600)', lineHeight: '1.6' }}>
          Connect your fitness tracker to sync step data and earn rewards
        </p>
      </div>

      {/* Connection Status Summary */}
      {connectedDevice ? (
        <div
          className="glass scale-in"
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '2px solid var(--color-primary-500)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-6)',
            position: 'relative',
            zIndex: 1,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '28px' }}>{connectedDevice.icon}</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF' }}>
                  Connected to {connectedDevice.name}
                </div>
                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                  {connectedDevice.stepData ? (
                    <>
                      <span style={{ fontWeight: '600' }}>
                        {connectedDevice.stepData.steps.toLocaleString()}
                      </span>{' '}
                      steps today
                    </>
                  ) : (
                    'Syncing step data...'
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #3B82F6',
                backgroundColor: 'white',
                color: '#3B82F6',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {isExpanded ? 'Hide' : 'Manage'}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: '#FFF7ED',
            border: '2px solid #FB923C',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#9A3412', marginBottom: '4px' }}>
            No wearable connected
          </div>
          <div style={{ fontSize: '13px', color: '#78350F' }}>
            Connect a device below to start tracking your steps
          </div>
        </div>
      )}

      {/* Device Grid - Only show if expanded or no device connected */}
      {(!connectedDevice || isExpanded) && (
        <>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
            Available Devices
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
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
          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#6B7280',
              lineHeight: '1.6',
            }}
          >
            <strong>Note:</strong> Currently, you can connect one device at a time. More devices will be supported soon!
            Step data is refreshed automatically every hour.
          </div>
        </>
      )}
    </div>
  );
};
