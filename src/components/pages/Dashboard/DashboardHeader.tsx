import React from 'react';
import { Activity } from 'lucide-react';
import { OnchainKitWallet } from '../../OnchainKitWallet';
import { useIsBaseMiniApp } from '../../../hooks/useIsBaseMiniApp';
import { useBaseAccountCapabilities } from '../../../hooks/useBaseAccountCapabilities';

interface DashboardHeaderProps {
  activeView: 'dashboard' | 'messages';
  isInitialized: boolean;
  isInitializing: boolean;
  onMessagesClick: () => void;
  onInitializeXMTP: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(() => {
  const { isMiniApp, ready } = useIsBaseMiniApp();
  const { loading } = useBaseAccountCapabilities();
  return (
    <header
      className="flex items-center justify-between px-4 sm:px-6 border-b transition-colors"
      style={{
        height: '56px',
        backgroundColor: 'var(--bg)',
        borderColor: 'var(--border)',
        position: 'relative',
        zIndex: 'var(--z-sticky)', // Ensure wallet dropdown appears above content
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

      {/* Wallet Only - Messages UI removed per user request */}
      <div className="flex items-center">
        {(!isMiniApp || (ready && !loading)) && <OnchainKitWallet />}
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
