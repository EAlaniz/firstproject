import React from 'react';
import { Activity, MessageCircle, Menu } from 'lucide-react';
import { OnchainKitWallet } from '../../OnchainKitWallet';

interface DashboardHeaderProps {
  activeView: 'dashboard' | 'messages';
  isInitialized: boolean;
  isInitializing: boolean;
  onMenuClick: () => void;
  onMessagesClick: () => void;
  onInitializeXMTP: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  activeView,
  isInitialized,
  isInitializing,
  onMenuClick,
  onMessagesClick,
  onInitializeXMTP,
}) => {
  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 border-b transition-colors"
      style={{
        height: '56px', // Mobile height
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo Section */}
      <div className="flex items-center" style={{ gap: 'var(--space-1-5)' }}>
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 'var(--avatar-l)',
            height: 'var(--avatar-l)',
            backgroundColor: 'rgb(87, 139, 250)',
          }}
        >
          <Activity className="text-white" style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} />
        </div>
        <span
          className="font-medium"
          style={{
            fontSize: 'var(--fs-title-4)',
            lineHeight: 'var(--lh-title-4)',
            fontWeight: 'var(--fw-title-heavy)',
            color: 'var(--text)',
          }}
        >
          10K
        </span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden sm:flex items-center" style={{ gap: 'var(--space-1)' }}>
        {isInitialized ? (
          <button
            onClick={onMessagesClick}
            className="flex items-center rounded transition-all duration-fast"
            style={{
              gap: 'var(--space-1)',
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--fs-label-1)',
              fontWeight: 'var(--fw-label)',
              backgroundColor: activeView === 'messages' ? 'var(--brand-500)' : 'transparent',
              color: activeView === 'messages' ? 'white' : 'var(--text-muted)',
              opacity: activeView === 'messages' ? 1 : 0.88,
            }}
            onMouseEnter={(e) => {
              if (activeView !== 'messages') {
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (activeView !== 'messages') {
                e.currentTarget.style.opacity = '0.88';
              }
            }}
          >
            <MessageCircle style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} />
            <span>Messages</span>
          </button>
        ) : (
          <button
            onClick={onInitializeXMTP}
            disabled={isInitializing}
            className="flex items-center rounded transition-all duration-fast"
            style={{
              gap: 'var(--space-1)',
              padding: 'var(--space-1) var(--space-2)',
              fontSize: 'var(--fs-label-1)',
              fontWeight: 'var(--fw-label)',
              backgroundColor: 'transparent',
              color: isInitializing ? 'var(--text-muted)' : 'var(--text-muted)',
              opacity: isInitializing ? 0.5 : 0.88,
              cursor: isInitializing ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isInitializing) {
                e.currentTarget.style.opacity = '1';
              }
            }}
            onMouseLeave={(e) => {
              if (!isInitializing) {
                e.currentTarget.style.opacity = '0.88';
              }
            }}
          >
            <MessageCircle style={{ width: 'var(--icon-s)', height: 'var(--icon-s)' }} />
            <span>{isInitializing ? 'Initializing...' : 'Enable Messages'}</span>
          </button>
        )}
        <OnchainKitWallet />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="sm:hidden rounded transition-all duration-fast"
        style={{
          padding: 'var(--space-1)',
          backgroundColor: 'transparent',
          color: 'var(--text)',
          opacity: 0.88,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.88';
        }}
      >
        <Menu style={{ width: 'var(--icon-m)', height: 'var(--icon-m)' }} />
      </button>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
