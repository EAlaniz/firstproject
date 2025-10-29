import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Wallet, Shield, Zap } from 'lucide-react';
import { useConnect, useAccount } from 'wagmi';

interface SmartWalletCreatorProps {
  onClose: () => void;
  onWalletCreated: (address: string) => void;
}

export const SmartWalletCreator: React.FC<SmartWalletCreatorProps> = ({
  onClose,
  onWalletCreated,
}) => {
  const [step, setStep] = useState<'intro' | 'creating' | 'success' | 'error'>('intro');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { connect, connectors, error } = useConnect();
  const { address, isConnected } = useAccount();

  // Get Coinbase Wallet connector
  const coinbaseConnector = connectors.find(
    connector => connector.id === 'coinbaseWallet' || connector.id === 'coinbaseWalletSDK'
  );

  // Watch for successful connection
  useEffect(() => {
    if (isConnected && address && step === 'creating') {
      setStep('success');
      onWalletCreated(address);
    }
  }, [isConnected, address, step, onWalletCreated]);

  // Watch for connection errors
  useEffect(() => {
    if (error && step === 'creating') {
      console.error('Wallet creation error:', error);
      setErrorMessage(error.message || 'Failed to create wallet');
      setStep('error');
    }
  }, [error, step]);

  const createSmartWallet = async () => {
    setStep('creating');

    try {
      if (!coinbaseConnector) {
        throw new Error('Coinbase Wallet connector not available');
      }

      // Connect with Coinbase Wallet - will prompt user to create if they don't have one
      connect({ connector: coinbaseConnector });
    } catch (error) {
      console.error('Failed to initiate wallet creation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create wallet');
      setStep('error');
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'var(--overlay)',
        zIndex: 'var(--z-modal)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded border"
        style={{
          backgroundColor: 'var(--bg)',
          borderColor: 'var(--border)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-elevation-2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Intro Step */}
        {step === 'intro' && (
          <>
            {/* Header */}
            <div
              className="flex items-center"
              style={{
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div
                className="flex items-center justify-center rounded"
                style={{
                  width: 'var(--avatar-xl)',
                  height: 'var(--avatar-xl)',
                  backgroundColor: 'rgba(87, 139, 250, 0.1)',
                }}
              >
                <Sparkles
                  style={{
                    width: 'var(--icon-m)',
                    height: 'var(--icon-m)',
                    color: 'rgb(87, 139, 250)',
                  }}
                />
              </div>
              <div>
                <h2
                  className="font-medium"
                  style={{
                    fontSize: 'var(--fs-title-3)',
                    lineHeight: 'var(--lh-title-3)',
                    fontWeight: 'var(--fw-title-heavy)',
                    color: 'var(--text)',
                    marginBottom: 'var(--space-0-5)',
                  }}
                >
                  Create Smart Wallet
                </h2>
                <p
                  style={{
                    fontSize: 'var(--fs-label-2)',
                    lineHeight: 'var(--lh-label)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Powered by Base & Onchain Kit
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div
              className="rounded border"
              style={{
                backgroundColor: 'var(--surface)',
                borderColor: 'var(--border)',
                padding: 'var(--space-4)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <p
                  className="font-medium"
                  style={{
                    fontSize: 'var(--fs-label-1)',
                    lineHeight: 'var(--lh-label)',
                    fontWeight: 'var(--fw-label-heavy)',
                    color: 'var(--text)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  Your wallet will have:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {[
                  { icon: Shield, label: 'Gasless transactions', desc: 'No need to buy ETH for gas' },
                  { icon: Zap, label: 'Instant setup', desc: 'Ready to use in seconds' },
                  { icon: Wallet, label: 'Self-custody', desc: 'You control your assets' },
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start"
                    style={{ gap: 'var(--space-1-5)' }}
                  >
                    <benefit.icon
                      style={{
                        width: 'var(--icon-s)',
                        height: 'var(--icon-s)',
                        color: 'rgb(87, 139, 250)',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    />
                    <div>
                      <p
                        className="font-medium"
                        style={{
                          fontSize: 'var(--fs-label-1)',
                          lineHeight: 'var(--lh-label)',
                          fontWeight: 'var(--fw-label-heavy)',
                          color: 'var(--text)',
                        }}
                      >
                        {benefit.label}
                      </p>
                      <p
                        style={{
                          fontSize: 'var(--fs-caption)',
                          lineHeight: 'var(--lh-caption)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {benefit.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex"
              style={{
                gap: 'var(--space-2)',
                flexDirection: 'column',
              }}
            >
              <button
                onClick={createSmartWallet}
                className="w-full transition-all flex items-center justify-center"
                style={{
                  gap: 'var(--space-1)',
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '20px',
                  backgroundColor: 'rgb(87, 139, 250)',
                  color: 'white',
                  borderRadius: '12px',
                  border: '0px solid rgb(225, 226, 230)',
                  cursor: 'pointer',
                  minHeight: '32px',
                  fontFamily: 'Inter, "Inter Fallback", ui-sans-serif, system-ui, -apple-system, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.88';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span>Create Wallet</span>
              </button>

              <button
                onClick={onClose}
                className="w-full rounded transition-all duration-base"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--fs-label-1)',
                  fontWeight: 'var(--fw-label)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Creating Step */}
        {step === 'creating' && (
          <div className="text-center">
            <div
              className="flex justify-center"
              style={{ marginBottom: 'var(--space-4)' }}
            >
              <Loader2
                className="animate-spin"
                style={{
                  width: 'var(--avatar-xl)',
                  height: 'var(--avatar-xl)',
                  color: 'rgb(87, 139, 250)',
                }}
              />
            </div>
            <h3
              className="font-medium"
              style={{
                fontSize: 'var(--fs-title-4)',
                lineHeight: 'var(--lh-title-4)',
                fontWeight: 'var(--fw-title-heavy)',
                color: 'var(--text)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Creating your wallet...
            </h3>
            <p
              style={{
                fontSize: 'var(--fs-label-2)',
                lineHeight: 'var(--lh-label)',
                color: 'var(--text-muted)',
              }}
            >
              This will only take a moment
            </p>
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <>
            <div className="text-center" style={{ marginBottom: 'var(--space-4)' }}>
              <div
                className="flex justify-center"
                style={{ marginBottom: 'var(--space-3)' }}
              >
                <CheckCircle2
                  style={{
                    width: 'var(--avatar-xl)',
                    height: 'var(--avatar-xl)',
                    color: 'var(--success)',
                  }}
                />
              </div>
              <h3
                className="font-medium"
                style={{
                  fontSize: 'var(--fs-title-4)',
                  lineHeight: 'var(--lh-title-4)',
                  fontWeight: 'var(--fw-title-heavy)',
                  color: 'var(--text)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Wallet Created!
              </h3>
              <p
                style={{
                  fontSize: 'var(--fs-label-2)',
                  lineHeight: 'var(--lh-label)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Your smart wallet is ready to use
              </p>

              {/* Wallet Address */}
              <div
                className="rounded border font-mono text-center"
                style={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border)',
                  padding: 'var(--space-2)',
                  fontSize: 'var(--fs-caption)',
                  color: 'var(--text-muted)',
                  wordBreak: 'break-all',
                }}
              >
                {address}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full transition-all"
              style={{
                padding: '6px 16px',
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '20px',
                backgroundColor: 'rgb(87, 139, 250)',
                color: 'white',
                borderRadius: '12px',
                border: '0px solid rgb(225, 226, 230)',
                cursor: 'pointer',
                minHeight: '32px',
                fontFamily: 'Inter, "Inter Fallback", ui-sans-serif, system-ui, -apple-system, sans-serif',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.88';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              Get Started
            </button>
          </>
        )}

        {/* Error Step */}
        {step === 'error' && (
          <>
            <div className="text-center" style={{ marginBottom: 'var(--space-4)' }}>
              <div
                className="flex justify-center"
                style={{ marginBottom: 'var(--space-3)' }}
              >
                <AlertCircle
                  style={{
                    width: 'var(--avatar-xl)',
                    height: 'var(--avatar-xl)',
                    color: 'var(--danger)',
                  }}
                />
              </div>
              <h3
                className="font-medium"
                style={{
                  fontSize: 'var(--fs-title-4)',
                  lineHeight: 'var(--lh-title-4)',
                  fontWeight: 'var(--fw-title-heavy)',
                  color: 'var(--text)',
                  marginBottom: 'var(--space-1)',
                }}
              >
                Failed to Create Wallet
              </h3>
              <p
                style={{
                  fontSize: 'var(--fs-label-2)',
                  lineHeight: 'var(--lh-label)',
                  color: 'var(--text-muted)',
                }}
              >
                {errorMessage}
              </p>
            </div>

            <div
              className="flex"
              style={{
                gap: 'var(--space-2)',
                flexDirection: 'column',
              }}
            >
              <button
                onClick={() => setStep('intro')}
                className="w-full transition-all"
                style={{
                  padding: '6px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  lineHeight: '20px',
                  backgroundColor: 'rgb(87, 139, 250)',
                  color: 'white',
                  borderRadius: '12px',
                  border: '0px solid rgb(225, 226, 230)',
                  cursor: 'pointer',
                  minHeight: '32px',
                  fontFamily: 'Inter, "Inter Fallback", ui-sans-serif, system-ui, -apple-system, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.88';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Try Again
              </button>

              <button
                onClick={onClose}
                className="w-full rounded transition-all duration-base"
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  fontSize: 'var(--fs-label-1)',
                  fontWeight: 'var(--fw-label)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
