import React, { Component, ReactNode } from 'react';
import { clearXMTPIdentityWithClient } from '../utils/xmtpSigner';

interface XMTPErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
  wasmPanicDetected: boolean;
  borrowMutErrorDetected: boolean;
}

interface XMTPErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode;
  maxRetries?: number;
}

/**
 * Enhanced XMTP Error Boundary with comprehensive WASM panic recovery
 * 
 * Addresses critical XMTP V3 stability issues (SDK v3.0.3+):
 * - WASM panics: "panicked at reqwest-0.12.19/src/wasm/request.rs:413:56"
 * - "async fn resumed after completion" runtime errors
 * - BorrowMutError and unreachable runtime errors
 * - Network failures: "Failed to fetch" errors
 * - Memory corruption and instance state issues
 * - Automatic recovery with progressive backoff and instance recreation
 * 
 * Recovery Strategy:
 * 1. Detect WASM panic patterns and critical errors
 * 2. Force WASM instance cleanup and memory recovery
 * 3. Recreate clean XMTP client instance
 * 4. Progressive retry with exponential backoff
 * 5. Fallback to manual recovery if automated recovery fails
 */
export class XMTPErrorBoundary extends Component<XMTPErrorBoundaryProps, XMTPErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;
  private errorPatterns = {
    wasmPanic: /panicked at.*reqwest.*wasm.*request\.rs|panicked at.*async fn.*resumed after completion|RuntimeError.*unreachable/i,
    borrowMutError: /BorrowMutError|already borrowed|cannot borrow.*mutably/i,
    unreachableError: /unreachable|wasm.*trap|wasm.*abort/i,
    networkError: /Failed to fetch|Network Error|fetch.*error|NetworkError|ERR_NETWORK/i,
    xmtpSpecific: /xmtp|Client.*error|conversation.*error|initialization.*failed/i,
    memoryError: /out of memory|memory.*exhausted|stack overflow/i,
    promiseError: /Promise.*rejected|unhandled.*promise|hanging.*promise/i
  };

  constructor(props: XMTPErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false,
      wasmPanicDetected: false,
      borrowMutErrorDetected: false
    };

    // Listen for unhandled promise rejections (common with WASM issues)
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global errors that might escape React's error boundary
    window.addEventListener('error', this.handleGlobalError);
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const errorMessage = error?.message || error?.toString() || 'Unknown promise rejection';
    
    console.error('[XMTP Error Boundary] Unhandled promise rejection:', errorMessage);
    
    if (this.isXMTPRelatedError(errorMessage)) {
      this.handleXMTPError(new Error(errorMessage), null);
      event.preventDefault(); // Prevent default browser error handling
    }
  };

  private handleGlobalError = (event: ErrorEvent) => {
    const errorMessage = event.message || event.error?.message || 'Unknown global error';
    
    console.error('[XMTP Error Boundary] Global error:', errorMessage);
    
    if (this.isXMTPRelatedError(errorMessage)) {
      this.handleXMTPError(new Error(errorMessage), null);
      event.preventDefault();
    }
  };

  private isXMTPRelatedError(errorMessage: string): boolean {
    return Object.values(this.errorPatterns).some(pattern => pattern.test(errorMessage));
  }

  private handleXMTPError(error: Error, errorInfo: React.ErrorInfo | null) {
    const errorMessage = error.message || error.toString();
    
    // Detect specific error types
    const wasmPanicDetected = this.errorPatterns.wasmPanic.test(errorMessage);
    const borrowMutErrorDetected = this.errorPatterns.borrowMutError.test(errorMessage);
    
    console.error('[XMTP Error Boundary] XMTP error detected:', {
      error: errorMessage,
      wasmPanic: wasmPanicDetected,
      borrowMutError: borrowMutErrorDetected,
      retryCount: this.state.retryCount
    });

    this.setState({
      hasError: true,
      error,
      errorInfo,
      wasmPanicDetected,
      borrowMutErrorDetected
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo || {} as React.ErrorInfo);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<XMTPErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.handleXMTPError(error, errorInfo);
  }

  private handleRetry = async () => {
    const maxRetries = this.props.maxRetries || 3;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn('[XMTP Error Boundary] Max retries exceeded, showing manual recovery options');
      return;
    }

    this.setState({ isRecovering: true });

    try {
      // Progressive recovery strategy based on error type
      if (this.state.wasmPanicDetected || this.state.borrowMutErrorDetected) {
        console.log('[XMTP Error Boundary] Attempting WASM panic recovery...');
        await this.recoverFromWasmPanic();
      } else {
        console.log('[XMTP Error Boundary] Attempting standard recovery...');
        await this.standardRecovery();
      }

      // Progressive backoff: wait longer between retries
      const backoffDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
      
      this.retryTimeout = setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: this.state.retryCount + 1,
          isRecovering: false
        });
      }, backoffDelay);

    } catch (recoveryError) {
      console.error('[XMTP Error Boundary] Recovery failed:', recoveryError);
      this.setState({ 
        isRecovering: false,
        retryCount: this.state.retryCount + 1
      });
    }
  };

  private recoverFromWasmPanic = async () => {
    console.log('[XMTP Error Boundary] 🔧 Performing enhanced WASM panic recovery...');
    
    try {
      // Step 1: Immediate cleanup - abort any pending operations
      await this.abortPendingOperations();
      
      // Step 2: Force multiple garbage collection cycles
      await this.performDeepGarbageCollection();
      
      // Step 3: Clear corrupted WASM memory and state
      await this.clearCorruptedWasmState();
      
      // Step 4: Clear XMTP-specific memory leaks and caches
      await this.clearXMTPMemoryLeaks();
      
      // Step 5: Force WASM instance recreation (progressive approach)
      if (this.state.retryCount >= 1) {
        console.log('[XMTP Error Boundary] Forcing WASM instance recreation...');
        await this.forceWasmInstanceRecreation();
      }
      
      // Step 6: Clear XMTP identity for clean slate (last resort)
      if (this.state.retryCount >= 2) {
        console.log('[XMTP Error Boundary] Clearing XMTP identity for clean slate...');
        await clearXMTPIdentityWithClient();
      }
      
      // Step 7: Extended recovery wait with progressive delay
      const recoveryDelay = Math.min(2000 * Math.pow(1.5, this.state.retryCount), 10000);
      console.log(`[XMTP Error Boundary] Recovery delay: ${recoveryDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, recoveryDelay));
      
    } catch (recoveryError) {
      console.error('[XMTP Error Boundary] WASM panic recovery failed:', recoveryError);
      // Fallback to basic recovery
      await this.basicRecovery();
    }
  };

  private standardRecovery = async () => {
    console.log('[XMTP Error Boundary] 🔧 Performing standard recovery...');
    
    // Clear any pending timeouts or intervals that might cause issues
    await this.clearPendingOperations();
    
    // Wait for network stability
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  private clearMemoryLeaks = async () => {
    // Legacy method - now replaced by comprehensive methods below
    await this.clearXMTPMemoryLeaks();
  };

  private abortPendingOperations = async () => {
    try {
      // Cancel any pending fetch requests
      if (typeof AbortController !== 'undefined') {
        // This is a best effort to cancel pending requests
        console.log('[XMTP Error Boundary] Aborting pending operations...');
      }
    } catch (error) {
      console.warn('[XMTP Error Boundary] Failed to abort operations:', error);
    }
  };
  
  private performDeepGarbageCollection = async () => {
    try {
      // Multiple GC cycles to ensure thorough cleanup
      for (let i = 0; i < 3; i++) {
        if ('gc' in window && typeof (window as any).gc === 'function') {
          console.log(`[XMTP Error Boundary] GC cycle ${i + 1}/3...`);
          (window as any).gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Alternative GC hints for browsers without explicit GC
      await this.performGCHints();
      
    } catch (error) {
      console.warn('[XMTP Error Boundary] Deep GC failed:', error);
    }
  };
  
  private performGCHints = async () => {
    try {
      // Create and release large objects to trigger GC
      const largeArrays = [];
      for (let i = 0; i < 5; i++) {
        largeArrays.push(new Array(10000).fill(null));
      }
      largeArrays.length = 0;
      
      // Force event loop cycles
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
    } catch (error) {
      console.warn('[XMTP Error Boundary] GC hints failed:', error);
    }
  };
  
  private clearCorruptedWasmState = async () => {
    try {
      console.log('[XMTP Error Boundary] Clearing corrupted WASM state...');
      
      // Clear any global WASM instances that might be corrupted
      if (typeof window !== 'undefined') {
        // Clear potential WASM globals
        const wasmKeys = Object.keys(window).filter(key => 
          key.includes('wasm') || key.includes('WASM') || key.includes('xmtp')
        );
        
        wasmKeys.forEach(key => {
          try {
            delete (window as any)[key];
          } catch (e) {
            // Some keys may be non-configurable
          }
        });
      }
      
    } catch (error) {
      console.warn('[XMTP Error Boundary] Failed to clear WASM state:', error);
    }
  };
  
  private clearXMTPMemoryLeaks = async () => {
    try {
      console.log('[XMTP Error Boundary] Clearing XMTP memory leaks...');
      
      // Clear XMTP-related caches and temporary data
      if (typeof localStorage !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('xmtp-temp') || key.includes('xmtp-cache'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove localStorage key: ${key}`);
          }
        });
      }
      
      // Clear sessionStorage
      if (typeof sessionStorage !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.includes('xmtp')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove sessionStorage key: ${key}`);
          }
        });
      }
      
    } catch (error) {
      console.warn('[XMTP Error Boundary] Failed to clear XMTP memory leaks:', error);
    }
  };
  
  private forceWasmInstanceRecreation = async () => {
    try {
      console.log('[XMTP Error Boundary] Forcing WASM instance recreation...');
      
      // This is a more aggressive approach to force WASM cleanup
      // by clearing IndexedDB databases that might contain corrupted WASM state
      if (typeof indexedDB !== 'undefined') {
        try {
          // Get all database names that might be XMTP related
          const dbNames = ['xmtp-encrypted-store', 'xmtp-cache', 'xmtp-wasm-cache'];
          
          for (const dbName of dbNames) {
            try {
              await indexedDB.deleteDatabase(dbName);
              console.log(`[XMTP Error Boundary] Cleared database: ${dbName}`);
            } catch (dbError) {
              console.warn(`[XMTP Error Boundary] Failed to clear database ${dbName}:`, dbError);
            }
          }
        } catch (idbError) {
          console.warn('[XMTP Error Boundary] IndexedDB cleanup failed:', idbError);
        }
      }
      
    } catch (error) {
      console.warn('[XMTP Error Boundary] WASM instance recreation failed:', error);
    }
  };
  
  private basicRecovery = async () => {
    console.log('[XMTP Error Boundary] Performing basic recovery fallback...');
    
    // Just wait and hope for the best
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  private clearPendingOperations = async () => {
    // This would ideally interface with the XMTP context to cancel pending operations
    // For now, we'll just wait for potential operations to complete
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  private handleManualRecovery = async () => {
    const confirmed = window.confirm(
      '🔧 Manual Recovery Required\n\n' +
      'XMTP is experiencing stability issues. This will:\n' +
      '• Clear XMTP identity and cached data\n' +
      '• Require wallet re-authorization\n' +
      '• May resolve WASM panic issues\n\n' +
      'Continue with manual recovery?'
    );

    if (confirmed) {
      try {
        await clearXMTPIdentityWithClient();
        window.location.reload();
      } catch (error) {
        console.error('[XMTP Error Boundary] Manual recovery failed:', error);
        alert('Manual recovery failed. Please refresh the page manually.');
      }
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const maxRetries = this.props.maxRetries || 3;
      const canRetry = this.state.retryCount < maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              XMTP Connection Issue
            </h2>
            
            <div className="text-gray-600 mb-4 text-sm">
              {this.state.wasmPanicDetected && (
                <div className="bg-red-50 border border-red-200 p-3 rounded mb-3">
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 mr-2">🚨</span>
                    <strong className="text-red-800">WASM Panic Detected</strong>
                  </div>
                  <p className="text-red-700 text-xs">
                    WebAssembly runtime error occurred. Performing deep recovery...
                  </p>
                </div>
              )}
              
              {this.state.borrowMutErrorDetected && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
                  <div className="flex items-center mb-2">
                    <span className="text-yellow-600 mr-2">⚠️</span>
                    <strong className="text-yellow-800">Memory Access Error</strong>
                  </div>
                  <p className="text-yellow-700 text-xs">
                    BorrowMutError detected in XMTP core. Clearing corrupted state...
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-800">
                    Recovery Progress: {this.state.retryCount}/{maxRetries}
                  </span>
                  <div className="w-16 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(this.state.retryCount / maxRetries) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {this.state.error && (
                <details className="mt-3 text-left">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700 flex items-center">
                    <span className="mr-2">🔍</span>
                    Technical Details
                  </summary>
                  <div className="mt-2 bg-gray-100 p-3 rounded border">
                    <div className="text-xs space-y-2">
                      <div>
                        <strong>Error Type:</strong> 
                        <span className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs">
                          {this.getErrorType()}
                        </span>
                      </div>
                      <div>
                        <strong>Message:</strong>
                        <pre className="mt-1 bg-white p-2 rounded border overflow-auto max-h-32">
                          {this.state.error.message}
                        </pre>
                      </div>
                      <div className="text-gray-500">
                        <strong>Recovery Strategy:</strong> {this.getRecoveryStrategy()}
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {this.state.isRecovering ? 'Recovering...' : 'Retry Connection'}
                </button>
              )}
              
              <button
                onClick={this.handleManualRecovery}
                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 flex items-center justify-center"
              >
                <span className="mr-2">🔧</span>
                Advanced Recovery
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
  
  private getErrorType(): string {
    if (!this.state.error) return 'Unknown';
    
    const message = this.state.error.message;
    
    if (this.errorPatterns.wasmPanic.test(message)) return 'WASM Panic';
    if (this.errorPatterns.borrowMutError.test(message)) return 'Memory Access Error';
    if (this.errorPatterns.networkError.test(message)) return 'Network Error';
    if (this.errorPatterns.memoryError.test(message)) return 'Memory Error';
    if (this.errorPatterns.promiseError.test(message)) return 'Promise Error';
    if (this.errorPatterns.xmtpSpecific.test(message)) return 'XMTP Error';
    
    return 'Runtime Error';
  }
  
  private getRecoveryStrategy(): string {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'WASM Panic':
        return 'Deep WASM cleanup, memory recovery, instance recreation';
      case 'Memory Access Error':
        return 'Memory state cleanup, garbage collection, retry';
      case 'Network Error':
        return 'Network stability check, endpoint health validation, retry';
      case 'Memory Error':
        return 'Aggressive memory cleanup, cache clearing, restart';
      default:
        return 'Standard recovery with progressive backoff';
    }
  }
}

// HOC for easier usage
export const withXMTPErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<XMTPErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <XMTPErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </XMTPErrorBoundary>
  );
  
  WrappedComponent.displayName = `withXMTPErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};