/**
 * Enhanced XMTP Stream Manager - Prevents race conditions and BorrowMutError
 * 
 * Addresses critical V3 stability issues (SDK v3.0.3+):
 * - Stream errors: "BorrowMutError" and "unreachable" runtime errors
 * - Race conditions in stream management and concurrent access
 * - Memory management issues in WASM with proper cleanup
 * - Safe stream lifecycle management with mutex-like protection
 * - Stream resurrection after WASM panics
 * - Network-aware stream management with fallback strategies
 */

import { Client, DecodedMessage, XMTPConversation } from '@xmtp/browser-sdk';
import { networkManager, networkAwareDelay, isNetworkSuitableForXMTP } from './networkConnectivity';

export interface StreamState {
  isActive: boolean;
  error: Error | null;
  lastActivity: number;
  messageCount: number;
  restartCount: number;
  wasmPanicDetected: boolean;
  borrowMutErrorDetected: boolean;
  consecutiveErrors: number;
  streamGeneration: number; // Track stream recreation cycles
}

export interface StreamManagerConfig {
  maxRestarts: number;
  restartDelay: number;
  healthCheckInterval: number;
  staleTimeout: number;
  maxMessageBuffer: number;
  borrowMutErrorCooldown: number;
  wasmPanicRecoveryDelay: number;
  maxConsecutiveErrors: number;
  streamRecreationThreshold: number;
}

type MessageHandler = (message: DecodedMessage<string>) => void;
type ErrorHandler = (error: Error) => void;
type StateChangeHandler = (state: StreamState) => void;

/**
 * Safe XMTP stream manager that prevents BorrowMutError and race conditions
 */
export class XMTPStreamManager {
  private client: Client | null = null;
  private stream: AsyncIterator<DecodedMessage<string>> | null = null;
  private streamPromise: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  
  private state: StreamState = {
    isActive: false,
    error: null,
    lastActivity: Date.now(),
    messageCount: 0,
    restartCount: 0,
    wasmPanicDetected: false,
    borrowMutErrorDetected: false,
    consecutiveErrors: 0,
    streamGeneration: 0
  };

  private config: StreamManagerConfig = {
    maxRestarts: 5,
    restartDelay: 2000,
    healthCheckInterval: 30000,
    staleTimeout: 120000, // 2 minutes
    maxMessageBuffer: 1000,
    borrowMutErrorCooldown: 5000, // 5 seconds cooldown after BorrowMutError
    wasmPanicRecoveryDelay: 10000, // 10 seconds recovery delay after WASM panic
    maxConsecutiveErrors: 3,
    streamRecreationThreshold: 2 // Recreate stream after 2 consecutive errors
  };

  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private stateChangeHandlers: StateChangeHandler[] = [];

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private messageBuffer: DecodedMessage<string>[] = [];
  private isDestroyed = false;
  private streamLock = false;
  private borrowMutLock = false; // Additional protection against BorrowMutError
  private lastBorrowMutError = 0;
  private lastWasmPanic = 0;
  private streamRecreationInProgress = false;

  constructor(config?: Partial<StreamManagerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Monitor network changes
    networkManager.onNetworkStatusChange(this.handleNetworkChange);
  }

  private handleNetworkChange = async (networkStatus: any) => {
    if (!networkStatus.isOnline && this.state.isActive) {
      console.log('[StreamManager] Network went offline, pausing stream');
      await this.pauseStream();
    } else if (networkStatus.isOnline && !this.state.isActive && this.client) {
      console.log('[StreamManager] Network restored, resuming stream');
      await networkAwareDelay(1000);
      this.startStream();
    }
  };

  public async initialize(client: Client): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('StreamManager has been destroyed');
    }

    console.log('[StreamManager] Initializing with XMTP client');
    this.client = client;
    
    // Start health monitoring
    this.startHealthCheck();
  }

  public async startStream(): Promise<void> {
    if (this.isDestroyed || !this.client) {
      console.warn('[StreamManager] Cannot start stream: destroyed or no client');
      return;
    }

    // Prevent concurrent stream starts (race condition protection)
    if (this.streamLock) {
      console.log('[StreamManager] Stream start already in progress, skipping');
      return;
    }

    if (this.state.isActive) {
      console.log('[StreamManager] Stream already active');
      return;
    }

    // Check network suitability
    if (!isNetworkSuitableForXMTP()) {
      console.log('[StreamManager] Network not suitable for streaming, deferring');
      setTimeout(() => this.startStream(), 5000);
      return;
    }

    this.streamLock = true;

    try {
      console.log('[StreamManager] 🔄 Starting message stream...');
      
      // Clean up any existing stream first
      await this.cleanupStream();

      // Create new abort controller for this stream
      this.abortController = new AbortController();

      // Reset error state
      this.updateState({ error: null });

      // Create the stream with error handling
      this.stream = await this.createSafeStream();
      
      if (!this.stream) {
        throw new Error('Failed to create message stream');
      }

      // Start processing messages
      this.streamPromise = this.processMessages();
      
      this.updateState({ 
        isActive: true, 
        lastActivity: Date.now() 
      });

      console.log('[StreamManager] ✅ Message stream started successfully');

    } catch (error) {
      console.error('[StreamManager] ❌ Failed to start stream:', error);
      this.handleStreamError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.streamLock = false;
    }
  }

  private async createSafeStream(): Promise<AsyncIterator<DecodedMessage<string>> | null> {
    if (!this.client) return null;

    try {
      // Check for recent BorrowMutError and apply cooldown
      const now = Date.now();
      if (this.borrowMutLock || (now - this.lastBorrowMutError < this.config.borrowMutErrorCooldown)) {
        console.log('[StreamManager] BorrowMutError cooldown active, deferring stream creation...');
        await new Promise(resolve => setTimeout(resolve, this.config.borrowMutErrorCooldown));
      }

      // Check for recent WASM panic and apply extended recovery delay
      if (now - this.lastWasmPanic < this.config.wasmPanicRecoveryDelay) {
        console.log('[StreamManager] WASM panic recovery delay active, waiting...');
        await new Promise(resolve => setTimeout(resolve, this.config.wasmPanicRecoveryDelay));
      }

      console.log(`[StreamManager] Creating stream (generation ${this.state.streamGeneration + 1})...`);
      
      // Enhanced stream creation with multiple safety layers
      const streamPromise = this.createStreamWithRetry();
      
      // Add timeout protection with progressive timeout based on errors
      const timeoutMs = Math.min(30000 + (this.state.consecutiveErrors * 5000), 60000);
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Stream creation timeout after ${timeoutMs}ms`));
        }, timeoutMs);

        // Clear timeout if abort signal is triggered
        this.abortController?.signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Stream creation aborted'));
        });
      });

      const stream = await Promise.race([streamPromise, timeoutPromise]);
      
      // Reset consecutive errors on successful stream creation
      this.updateState({ 
        consecutiveErrors: 0,
        streamGeneration: this.state.streamGeneration + 1
      });
      
      return stream;
      
    } catch (error) {
      console.error('[StreamManager] Stream creation failed:', error);
      this.handleStreamCreationError(error);
      return null;
    }
  }

  private async createStreamWithRetry(): Promise<AsyncIterator<DecodedMessage<string>>> {
    let attempt = 0;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`[StreamManager] Stream creation attempt ${attempt}/${maxAttempts}`);
        
        // Progressive delay between attempts
        if (attempt > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
        
        return await this.client!.conversations.streamAllMessages();
        
      } catch (error) {
        console.warn(`[StreamManager] Stream creation attempt ${attempt} failed:`, error);
        
        // Detect specific error types
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (this.isBorrowMutError(errorMessage)) {
          console.log('[StreamManager] BorrowMutError detected in stream creation');
          this.lastBorrowMutError = Date.now();
          this.borrowMutLock = true;
          
          // Extended cooldown for BorrowMutError
          await new Promise(resolve => setTimeout(resolve, this.config.borrowMutErrorCooldown));
          this.borrowMutLock = false;
        }
        
        if (this.isWasmPanic(errorMessage)) {
          console.log('[StreamManager] WASM panic detected in stream creation');
          this.lastWasmPanic = Date.now();
          
          // Extended recovery for WASM panic
          await new Promise(resolve => setTimeout(resolve, this.config.wasmPanicRecoveryDelay));
        }
        
        if (attempt === maxAttempts) {
          throw error;
        }
      }
    }
    
    throw new Error('All stream creation attempts failed');
  }

  private handleStreamCreationError(error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this.updateState({ 
      consecutiveErrors: this.state.consecutiveErrors + 1,
      wasmPanicDetected: this.isWasmPanic(errorMessage),
      borrowMutErrorDetected: this.isBorrowMutError(errorMessage)
    });
  }

  private isBorrowMutError(errorMessage: string): boolean {
    return /BorrowMutError|already borrowed|cannot borrow.*mutably/i.test(errorMessage);
  }

  private isWasmPanic(errorMessage: string): boolean {
    return /panicked at.*wasm|RuntimeError.*unreachable|wasm.*trap|wasm.*abort/i.test(errorMessage);
  }

  private async processMessages(): Promise<void> {
    if (!this.stream || !this.abortController) {
      return;
    }

    const signal = this.abortController.signal;

    try {
      console.log('[StreamManager] Starting message processing loop');

      for await (const message of this.stream) {
        // Check if we should abort
        if (signal.aborted) {
          console.log('[StreamManager] Message processing aborted');
          break;
        }

        // Check if stream manager is destroyed
        if (this.isDestroyed) {
          console.log('[StreamManager] Stream manager destroyed, stopping processing');
          break;
        }

        try {
          await this.handleMessage(message);
        } catch (messageError) {
          console.error('[StreamManager] Error handling message:', messageError);
          // Continue processing other messages
        }

        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
      }

    } catch (error) {
      if (!signal.aborted && !this.isDestroyed) {
        console.error('[StreamManager] Message processing error:', error);
        this.handleStreamError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    console.log('[StreamManager] Message processing loop ended');
  }

  private async handleMessage(message: DecodedMessage<string>): Promise<void> {
    try {
      // Buffer management to prevent memory issues
      this.messageBuffer.push(message);
      if (this.messageBuffer.length > this.config.maxMessageBuffer) {
        this.messageBuffer.shift(); // Remove oldest message
      }

      // Update activity timestamp
      this.updateState({ 
        lastActivity: Date.now(),
        messageCount: this.state.messageCount + 1
      });

      // Notify handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (handlerError) {
          console.error('[StreamManager] Message handler error:', handlerError);
        }
      });

    } catch (error) {
      console.error('[StreamManager] Error in handleMessage:', error);
      throw error;
    }
  }

  private handleStreamError(error: Error): void {
    const errorMessage = error.message;
    console.error('[StreamManager] Stream error:', errorMessage);
    
    // Detect specific error types and apply appropriate handling
    const isBorrowMutError = this.isBorrowMutError(errorMessage);
    const isWasmPanic = this.isWasmPanic(errorMessage);
    const consecutiveErrors = this.state.consecutiveErrors + 1;
    
    // Update last error timestamps
    if (isBorrowMutError) {
      this.lastBorrowMutError = Date.now();
      this.borrowMutLock = true;
    }
    
    if (isWasmPanic) {
      this.lastWasmPanic = Date.now();
    }
    
    this.updateState({ 
      error,
      isActive: false,
      consecutiveErrors,
      wasmPanicDetected: isWasmPanic,
      borrowMutErrorDetected: isBorrowMutError
    });

    // Notify error handlers with enhanced error context
    this.errorHandlers.forEach(handler => {
      try {
        // Create enhanced error with context
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).errorType = isWasmPanic ? 'WASM_PANIC' : 
                                          isBorrowMutError ? 'BORROW_MUT_ERROR' : 'STREAM_ERROR';
        (enhancedError as any).consecutiveErrors = consecutiveErrors;
        (enhancedError as any).streamGeneration = this.state.streamGeneration;
        
        handler(enhancedError);
      } catch (handlerError) {
        console.error('[StreamManager] Error handler failed:', handlerError);
      }
    });

    // Determine restart strategy based on error type and frequency
    if (this.shouldAttemptRestart()) {
      if (consecutiveErrors >= this.config.streamRecreationThreshold) {
        console.log('[StreamManager] Multiple consecutive errors detected, triggering stream recreation');
        this.scheduleStreamRecreation();
      } else {
        this.scheduleRestart();
      }
    } else {
      console.error('[StreamManager] Max restarts exceeded or destroyed, not restarting');
    }
    
    // Release BorrowMutError lock after delay
    if (isBorrowMutError) {
      setTimeout(() => {
        this.borrowMutLock = false;
      }, this.config.borrowMutErrorCooldown);
    }
  }

  private shouldAttemptRestart(): boolean {
    return this.state.restartCount < this.config.maxRestarts && 
           !this.isDestroyed && 
           this.state.consecutiveErrors < this.config.maxConsecutiveErrors;
  }

  private scheduleStreamRecreation(): void {
    if (this.streamRecreationInProgress) {
      console.log('[StreamManager] Stream recreation already in progress');
      return;
    }

    this.streamRecreationInProgress = true;
    const recreationDelay = this.config.wasmPanicRecoveryDelay;
    
    console.log(`[StreamManager] Scheduling stream recreation in ${recreationDelay}ms...`);
    
    setTimeout(async () => {
      if (this.isDestroyed) {
        this.streamRecreationInProgress = false;
        return;
      }
      
      try {
        console.log('[StreamManager] Performing stream recreation...');
        
        // Force complete cleanup
        await this.forceStreamCleanup();
        
        // Reset error counters for fresh start
        this.updateState({ 
          consecutiveErrors: 0,
          restartCount: 0,
          error: null
        });
        
        // Wait for network stability before recreation
        await networkAwareDelay(1000);
        
        if (isNetworkSuitableForXMTP()) {
          this.startStream();
        } else {
          console.log('[StreamManager] Network not suitable for recreation, scheduling retry');
          this.scheduleRestart();
        }
        
      } catch (recreationError) {
        console.error('[StreamManager] Stream recreation failed:', recreationError);
        this.scheduleRestart();
      } finally {
        this.streamRecreationInProgress = false;
      }
    }, recreationDelay);
  }

  private async forceStreamCleanup(): Promise<void> {
    console.log('[StreamManager] Performing forced stream cleanup...');
    
    try {
      // More aggressive cleanup for problematic streams
      await this.cleanupStream();
      
      // Additional cleanup for WASM issues
      if (this.state.wasmPanicDetected) {
        // Give WASM time to stabilize
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Force garbage collection hint
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
      }
      
    } catch (error) {
      console.warn('[StreamManager] Forced cleanup had issues:', error);
    }
  }

  private scheduleRestart(): void {
    const delay = this.config.restartDelay * Math.pow(2, this.state.restartCount);
    
    console.log(`[StreamManager] Scheduling restart in ${delay}ms (attempt ${this.state.restartCount + 1})`);
    
    setTimeout(async () => {
      if (this.isDestroyed) return;
      
      this.updateState({ restartCount: this.state.restartCount + 1 });
      
      // Wait for network stability before restart
      await networkAwareDelay(1000);
      
      if (isNetworkSuitableForXMTP()) {
        this.startStream();
      } else {
        console.log('[StreamManager] Network not suitable for restart, deferring');
        this.scheduleRestart();
      }
    }, delay);
  }

  public async pauseStream(): Promise<void> {
    console.log('[StreamManager] Pausing stream');
    await this.cleanupStream();
    this.updateState({ isActive: false });
  }

  public async stopStream(): Promise<void> {
    console.log('[StreamManager] Stopping stream');
    await this.cleanupStream();
    this.updateState({ 
      isActive: false,
      restartCount: 0,
      error: null
    });
  }

  private async cleanupStream(): Promise<void> {
    // Abort current operations
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Wait for stream promise to complete
    if (this.streamPromise) {
      try {
        await Promise.race([
          this.streamPromise,
          new Promise(resolve => setTimeout(resolve, 5000)) // 5s timeout
        ]);
      } catch (error) {
        console.warn('[StreamManager] Stream cleanup timeout/error:', error);
      }
      this.streamPromise = null;
    }

    // Clean up stream reference
    if (this.stream) {
      try {
        // Attempt to properly close the stream if it has a return method
        if ('return' in this.stream && typeof this.stream.return === 'function') {
          await this.stream.return();
        }
      } catch (error) {
        console.warn('[StreamManager] Error closing stream:', error);
      }
      this.stream = null;
    }
  }

  private startHealthCheck(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  private performHealthCheck(): void {
    if (this.isDestroyed) return;

    const now = Date.now();
    const timeSinceActivity = now - this.state.lastActivity;

    // Check if stream is stale
    if (this.state.isActive && timeSinceActivity > this.config.staleTimeout) {
      console.warn('[StreamManager] Stream appears stale, restarting');
      this.handleStreamError(new Error('Stream timeout - no activity'));
    }

    // Log health status
    console.log('[StreamManager] Health check:', {
      isActive: this.state.isActive,
      messageCount: this.state.messageCount,
      timeSinceActivity: timeSinceActivity,
      restartCount: this.state.restartCount
    });
  }

  private updateState(updates: Partial<StreamState>): void {
    this.state = { ...this.state, ...updates };
    
    // Notify state change handlers
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(this.state);
      } catch (error) {
        console.error('[StreamManager] State change handler error:', error);
      }
    });
  }

  // Public API methods
  public getState(): StreamState {
    return { ...this.state };
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      const index = this.messageHandlers.indexOf(handler);
      if (index > -1) {
        this.messageHandlers.splice(index, 1);
      }
    };
  }

  public onError(handler: ErrorHandler): () => void {
    this.errorHandlers.push(handler);
    return () => {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    };
  }

  public onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.push(handler);
    return () => {
      const index = this.stateChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.stateChangeHandlers.splice(index, 1);
      }
    };
  }

  public getRecentMessages(count = 10): DecodedMessage<string>[] {
    return this.messageBuffer.slice(-count);
  }

  public async destroy(): Promise<void> {
    console.log('[StreamManager] Destroying stream manager');
    this.isDestroyed = true;

    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Clean up stream
    await this.cleanupStream();

    // Clear handlers
    this.messageHandlers.length = 0;
    this.errorHandlers.length = 0;
    this.stateChangeHandlers.length = 0;

    // Clear buffer
    this.messageBuffer.length = 0;

    // Remove network listener
    networkManager.offNetworkStatusChange(this.handleNetworkChange);

    console.log('[StreamManager] Stream manager destroyed');
  }
}