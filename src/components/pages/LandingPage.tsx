import React from 'react';
import { Activity } from 'lucide-react';
import { ConnectWallet } from '@coinbase/onchainkit/wallet';
import { useIsBaseMiniApp } from '../../hooks/useIsBaseMiniApp';

interface LandingPageProps {
  onCreateWallet: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = React.memo(({
  onCreateWallet
}) => {
  const { isMiniApp } = useIsBaseMiniApp();
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg)',
      }}
    >
      {/* Header */}
      <header
        className="border-b"
        style={{
          borderColor: 'var(--border)',
          height: 'var(--nav-height-mobile)',
        }}
      >
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center"
        >
          <div className="flex items-center" style={{ gap: 'var(--space-1-5)' }}>
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 'var(--avatar-l)',
                height: 'var(--avatar-l)',
                backgroundColor: 'rgb(87, 139, 250)',
              }}
            >
              <Activity
                className="text-white"
                style={{
                  width: 'var(--icon-s)',
                  height: 'var(--icon-s)',
                }}
              />
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
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
          {/* Hero Content */}
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h1
              className="font-normal tracking-tight"
              style={{
                fontSize: 'var(--fs-display-2)',
                lineHeight: 'var(--lh-display-2)',
                fontWeight: 'var(--fw-display)',
                color: 'var(--text)',
                marginBottom: 'var(--space-3)',
              }}
            >
              Move. Earn. Connect.
            </h1>
            <p
              className="max-w-2xl mx-auto"
              style={{
                fontSize: 'var(--fs-title-4)',
                lineHeight: 'var(--lh-title-4)',
                fontWeight: 'var(--fw-body)',
                color: 'var(--text-muted)',
                paddingLeft: 'var(--space-2)',
                paddingRight: 'var(--space-2)',
              }}
            >
              An inclusive wellness platform that rewards your daily movement with tokens and connects you with a community of movers.
            </p>
          </div>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row justify-center items-center"
            style={{
              gap: 'var(--space-2)',
              paddingLeft: 'var(--space-2)',
              paddingRight: 'var(--space-2)',
            }}
          >
            {/* Primary CTA */}
            {!isMiniApp && (
              <div className="onchainkit-connect-wallet">
                <ConnectWallet />
              </div>
            )}

            {/* Secondary CTA removed: OnchainKit ConnectWallet supports onboarding/creation if needed */}
          </div>

          {/* Features / Trust Indicators */}
          <div
            className="flex flex-wrap justify-center items-center"
            style={{
              gap: 'var(--space-3)',
              marginTop: 'var(--space-8)',
            }}
          >
            <div
              className="flex items-center"
              style={{
                gap: 'var(--space-1)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <img
                src="/base-logo.svg"
                alt="Base"
                style={{ width: '16px', height: '16px' }}
              />
              <span>Powered by Base Chain</span>
            </div>
            <div
              className="flex items-center"
              style={{
                gap: 'var(--space-1)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Low fees</span>
            </div>
            <div
              className="flex items-center"
              style={{
                gap: 'var(--space-1)',
                fontSize: 'var(--fs-caption)',
                fontWeight: 'var(--fw-caption)',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>Fast transactions</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';
