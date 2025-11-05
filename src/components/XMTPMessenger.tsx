import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search, Loader2 } from 'lucide-react';
import { useIsBaseMiniApp } from '../hooks/useIsBaseMiniApp';
import { useAccount } from 'wagmi';

interface XMTPMessengerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * XMTP Messenger Modal
 *
 * Provides secure messaging between Move10K users via XMTP protocol
 * Features:
 * - XMTP client initialization with wallet signer
 * - Conversation list with recent messages
 * - Search users by wallet address
 * - Send/receive encrypted messages
 */
export const XMTPMessenger: React.FC<XMTPMessengerProps> = ({ isOpen, onClose }) => {
  const { isMiniApp } = useIsBaseMiniApp();
  const { address } = useAccount();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [messageText, setMessageText] = useState('');

  // Initialize XMTP client on mount
  useEffect(() => {
    if (isOpen && address && !isReady && !isInitializing) {
      initializeXMTP();
    }
  }, [isOpen, address, isReady, isInitializing]);

  const initializeXMTP = async () => {
    setIsInitializing(true);
    try {
      // TODO: Initialize XMTP client with wallet signer
      // Based on XMTP docs: https://docs.xmtp.org/
      console.log('🔄 Initializing XMTP client for:', address);

      // Placeholder - will implement full XMTP integration
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize XMTP:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !searchAddress) return;

    try {
      console.log('📤 Sending message to:', searchAddress, messageText);
      // TODO: Implement XMTP send message
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStartConversation = async () => {
    if (!searchAddress.trim()) return;

    try {
      console.log('💬 Starting conversation with:', searchAddress);
      // TODO: Implement XMTP conversation creation
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50"
            onClick={onClose}
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-50 border-2 border-black rounded-xl bg-[var(--surface-elevated)] overflow-hidden"
            style={{
              top: isMiniApp ? 'var(--space-4)' : '50%',
              left: isMiniApp ? 'var(--space-2)' : '50%',
              right: isMiniApp ? 'var(--space-2)' : 'auto',
              bottom: isMiniApp ? 'var(--space-4)' : 'auto',
              transform: isMiniApp ? 'none' : 'translate(-50%, -50%)',
              width: isMiniApp ? 'auto' : '600px',
              maxHeight: isMiniApp ? 'auto' : '700px',
              boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.9)',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b-2 border-black"
              style={{
                padding: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                backgroundColor: 'var(--bg)',
              }}
            >
              <h2
                className="font-bold uppercase tracking-tight text-[var(--text)]"
                style={{
                  fontSize: isMiniApp ? 'var(--fs-label-1)' : 'var(--fs-title-4)',
                  fontWeight: 'var(--fw-label-heavy)',
                }}
              >
                XMTP Messenger
              </h2>
              <button
                onClick={onClose}
                className="rounded border-2 border-black flex items-center justify-center transition-all hover:translate-y-[-1px] active:translate-y-[1px]"
                style={{
                  width: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                  height: isMiniApp ? 'var(--avatar-m)' : 'var(--avatar-l)',
                  backgroundColor: 'var(--surface-elevated-2)',
                  boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.8)',
                }}
              >
                <X style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} className="text-[var(--text)]" />
              </button>
            </div>

            {/* Content */}
            <div
              style={{
                padding: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
                maxHeight: isMiniApp ? '60vh' : '550px',
                overflowY: 'auto',
              }}
            >
              {/* Initializing State */}
              {isInitializing && (
                <div className="flex flex-col items-center justify-center" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
                  <Loader2
                    className="animate-spin text-[rgb(59,130,246)]"
                    style={{ width: 'var(--icon-l)', height: 'var(--icon-l)', marginBottom: 'var(--space-2)' }}
                  />
                  <p className="text-[var(--text-muted)]" style={{ fontSize: 'var(--fs-caption)' }}>
                    Initializing secure messaging...
                  </p>
                </div>
              )}

              {/* Ready State */}
              {!isInitializing && isReady && (
                <>
                  {/* Search/Start Conversation */}
                  <div
                    className="border-2 border-black rounded-lg bg-[var(--bg)]"
                    style={{
                      padding: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                      marginBottom: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
                      boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <label
                      className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
                      style={{
                        fontSize: 'var(--fs-caption)',
                        fontWeight: 'var(--fw-caption)',
                        marginBottom: 'var(--space-1)',
                        display: 'block',
                      }}
                    >
                      Start Conversation
                    </label>
                    <div className="flex" style={{ gap: 'var(--space-1)' }}>
                      <div className="flex-1 flex items-center border-2 border-black rounded bg-[var(--surface-elevated)]" style={{ padding: 'var(--space-1)' }}>
                        <Search style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} className="text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={searchAddress}
                          onChange={(e) => setSearchAddress(e.target.value)}
                          placeholder="Enter wallet address (0x...)"
                          className="flex-1 bg-transparent text-[var(--text)] outline-none"
                          style={{
                            fontSize: 'var(--fs-caption)',
                            paddingLeft: 'var(--space-1)',
                          }}
                        />
                      </div>
                      <button
                        onClick={handleStartConversation}
                        disabled={!searchAddress.trim()}
                        className="border-2 border-black rounded font-bold uppercase tracking-tight transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          padding: isMiniApp ? 'var(--space-1) var(--space-2)' : 'var(--space-1-5) var(--space-3)',
                          fontSize: 'var(--fs-caption)',
                          fontWeight: 'var(--fw-caption)',
                          background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                          color: 'white',
                          boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                        }}
                      >
                        Start
                      </button>
                    </div>
                  </div>

                  {/* Conversations List - Coming Soon */}
                  <div
                    className="border-2 border-black rounded-lg bg-[var(--bg-secondary)] text-center"
                    style={{
                      padding: isMiniApp ? 'var(--space-4)' : 'var(--space-6)',
                      boxShadow: 'inset 1px 1px 3px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <p
                      className="font-bold uppercase tracking-tight text-[var(--text-secondary)]"
                      style={{
                        fontSize: isMiniApp ? 'var(--fs-label-2)' : 'var(--fs-label-1)',
                        fontWeight: 'var(--fw-label-heavy)',
                        marginBottom: 'var(--space-0-5)',
                      }}
                    >
                      No Conversations Yet
                    </p>
                    <p
                      className="text-[var(--text-muted)]"
                      style={{ fontSize: 'var(--fs-caption)' }}
                    >
                      Start a conversation by entering a wallet address above
                    </p>
                  </div>

                  {/* Message Input - Coming Soon */}
                  {searchAddress && (
                    <div
                      className="border-2 border-black rounded-lg bg-[var(--bg)]"
                      style={{
                        padding: isMiniApp ? 'var(--space-2)' : 'var(--space-3)',
                        marginTop: isMiniApp ? 'var(--space-3)' : 'var(--space-4)',
                        boxShadow: 'inset 1px 1px 2px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      <div className="flex" style={{ gap: 'var(--space-1)' }}>
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Type your message..."
                          className="flex-1 border-2 border-black rounded bg-[var(--surface-elevated)] text-[var(--text)] outline-none"
                          style={{
                            fontSize: 'var(--fs-caption)',
                            padding: isMiniApp ? 'var(--space-1)' : 'var(--space-1-5)',
                          }}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim()}
                          className="border-2 border-black rounded flex items-center justify-center transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            width: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                            height: isMiniApp ? 'var(--avatar-l)' : 'var(--avatar-xl)',
                            background: 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 100%)',
                            boxShadow: '2px 2px 0px rgba(0, 0, 0, 0.9)',
                          }}
                        >
                          <Send style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} color="white" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
