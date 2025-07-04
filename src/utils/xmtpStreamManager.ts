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

import { Client, DecodedMessage } from '@xmtp/browser-sdk';
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

// Message processing state for duplicate detection
interface MessageProcessingState {
  processedMessageIds: Set<string>;
  welcomeMessageCache: Map<string, number>; // messageId -> processingCount
  lastEpochMismatchTime: number;
  consecutiveDecryptionFailures: number;
}

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
  
  // Enhanced message processing state to prevent duplicate processing loops
  private messageProcessingState: MessageProcessingState = {
    processedMessageIds: new Set(),
    welcomeMessageCache: new Map(),
    lastEpochMismatchTime: 0,
    consecutiveDecryptionFailures: 0
  };
  
  // Constants for duplicate detection
  private readonly MAX_WELCOME_MESSAGE_PROCESSING = 3;
  private readonly MESSAGE_CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes
  private readonly MAX_CONSECUTIVE_DECRYPTION_FAILURES = 5;
  private readonly EPOCH_MISMATCH_COOLDOWN = 30000; // 30 seconds

  constructor(config?: Partial<StreamManagerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Monitor network changes
    networkManager.onNetworkStatusChange(this.handleNetworkChange);
    
    // Set up periodic cleanup of message processing cache
    setInterval(() => this.cleanupMessageProcessingCache(), this.MESSAGE_CACHE_CLEANUP_INTERVAL);
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

      // Use for-await-of which works with XMTP's AsyncStream
      for await (const message of this.stream as any) {
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
      // Enhanced duplicate detection and welcome message loop prevention
      const messageId = message.id;
      const isWelcomeMessage = this.isWelcomeMessage(message);
      
      // Check for duplicate message processing
      if (this.messageProcessingState.processedMessageIds.has(messageId)) {
        console.log(`[StreamManager] 🔄 Skipping duplicate message processing: ${messageId}`);
        return;
      }
      
      // Enhanced welcome message duplicate detection
      if (isWelcomeMessage) {
        const processingCount = this.messageProcessingState.welcomeMessageCache.get(messageId) || 0;
        
        if (processingCount >= this.MAX_WELCOME_MESSAGE_PROCESSING) {
          console.warn(`[StreamManager] ⚠️ Blocking repeated welcome message processing: ${messageId} (processed ${processingCount} times)`);
          return;
        }
        
        this.messageProcessingState.welcomeMessageCache.set(messageId, processingCount + 1);
        console.log(`[StreamManager] 📨 Processing welcome message ${messageId} (attempt ${processingCount + 1}/${this.MAX_WELCOME_MESSAGE_PROCESSING})`);
      }
      
      // Mark message as processed to prevent duplicates
      this.messageProcessingState.processedMessageIds.add(messageId);
      
      // Enhanced error detection for epoch mismatches and decryption failures
      const hasEpochMismatch = this.detectEpochMismatch(message);
      const hasDecryptionFailure = this.detectDecryptionFailure(message);
      
      if (hasEpochMismatch) {
        console.warn(`[StreamManager] ⚠️ Epoch mismatch detected for message ${messageId}`);
        this.handleEpochMismatch(message);
        return;
      }
      
      if (hasDecryptionFailure) {
        console.warn(`[StreamManager] ⚠️ AEAD decryption failure detected for message ${messageId}`);
        this.handleDecryptionFailure(message);
        return;
      }
      
      // Reset consecutive decryption failures on successful processing
      this.messageProcessingState.consecutiveDecryptionFailures = 0;
      
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
    
    // Enhanced detection for group sync related errors
    const isGroupSyncError = /welcome.*message|group.*epoch|membership.*change/i.test(errorMessage);
    const isDecryptionError = /AEAD.*decryption|decryption.*failed/i.test(errorMessage);
    
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
    
    // Reset message processing state on critical errors
    if (isGroupSyncError || isDecryptionError || consecutiveErrors >= 3) {
      console.log('[StreamManager] 🔄 Resetting message processing state due to critical error');
      this.messageProcessingState.processedMessageIds.clear();
      this.messageProcessingState.welcomeMessageCache.clear();
      this.messageProcessingState.consecutiveDecryptionFailures = 0;
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
                                          isBorrowMutError ? 'BORROW_MUT_ERROR' :
                                          isGroupSyncError ? 'GROUP_SYNC_ERROR' :
                                          isDecryptionError ? 'DECRYPTION_ERROR' : 'STREAM_ERROR';
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

  /**
   * Enhanced message processing helpers for duplicate detection and error handling
   */
  private isWelcomeMessage(message: DecodedMessage<string>): boolean {
    // Detect welcome messages based on content patterns or metadata
    const content = String(message.content || '').toLowerCase();
    const isWelcomeContent = content.includes('welcome') || 
                           content.includes('joined') || 
                           content.includes('added to group');
    
    // Additional detection based on message metadata if available
    const messageData = message as any;
    const isSystemMessage = messageData.messageType === 'system' || 
                           messageData.isSystemMessage ||
                           messageData.type === 'membership_change';
    
    return isWelcomeContent || isSystemMessage;
  }
  
  private detectEpochMismatch(message: DecodedMessage<string>): boolean {
    // Check for epoch mismatch indicators in message content or errors
    const messageStr = JSON.stringify(message);
    return /epoch.*differs.*group.*epoch|group.*epoch.*mismatch/i.test(messageStr);
  }
  
  private detectDecryptionFailure(message: DecodedMessage<string>): boolean {
    // Check for AEAD decryption failure indicators
    const messageStr = JSON.stringify(message);
    return /AEAD.*decryption.*failed|decryption.*error|invalid.*ciphertext/i.test(messageStr);
  }
  
  private handleEpochMismatch(message: DecodedMessage<string>): void {
    const now = Date.now();
    
    // Rate limit epoch mismatch handling to prevent spam
    if (now - this.messageProcessingState.lastEpochMismatchTime < this.EPOCH_MISMATCH_COOLDOWN) {
      console.log('[StreamManager] 🕐 Epoch mismatch cooldown active, skipping handling');
      return;
    }
    
    this.messageProcessingState.lastEpochMismatchTime = now;
    
    console.warn('[StreamManager] 🔄 Handling epoch mismatch - triggering group sync recovery');
    
    // Trigger group sync recovery mechanism
    this.triggerGroupSyncRecovery(message.conversationId);
  }
  
  private handleDecryptionFailure(_message: DecodedMessage<string>): void {
    this.messageProcessingState.consecutiveDecryptionFailures++;
    
    console.warn(`[StreamManager] ⚠️ Decryption failure ${this.messageProcessingState.consecutiveDecryptionFailures}/${this.MAX_CONSECUTIVE_DECRYPTION_FAILURES}`);
    
    if (this.messageProcessingState.consecutiveDecryptionFailures >= this.MAX_CONSECUTIVE_DECRYPTION_FAILURES) {
      console.error('[StreamManager] 🚨 Too many consecutive decryption failures - triggering stream recovery');
      this.handleStreamError(new Error('Too many consecutive AEAD decryption failures'));
    }
  }
  
  private async triggerGroupSyncRecovery(conversationId: string): Promise<void> {
    try {
      console.log(`[StreamManager] 🔄 Attempting group sync recovery for conversation: ${conversationId}`);
      
      if (!this.client) {
        console.warn('[StreamManager] No client available for group sync recovery');
        return;
      }
      
      // Try to find and sync the specific conversation
      const conversations = await this.client.conversations.list();
      const targetConversation = conversations.find(conv => conv.id === conversationId);
      
      if (targetConversation) {
        console.log(`[StreamManager] 🔄 Found conversation ${conversationId}, attempting sync...`);
        await targetConversation.sync();
        console.log(`[StreamManager] ✅ Group sync recovery completed for ${conversationId}`);
      } else {
        console.warn(`[StreamManager] ⚠️ Conversation ${conversationId} not found for sync recovery`);
      }
      
    } catch (error) {
      console.error('[StreamManager] ❌ Group sync recovery failed:', error);
    }
  }
  
  private cleanupMessageProcessingCache(): void {
    const now = Date.now();
    const oldestAllowed = now - this.MESSAGE_CACHE_CLEANUP_INTERVAL;
    
    // Keep only recent message IDs (prevent memory bloat)
    const recentMessages = new Set<string>();
    this.messageBuffer.forEach(message => {
      if ((message as any).timestamp > oldestAllowed) {
        recentMessages.add(message.id);
      }
    });
    
    this.messageProcessingState.processedMessageIds = recentMessages;
    
    // Clean up welcome message cache (keep only recent ones)
    const recentWelcomeMessages = new Map<string, number>();
    for (const [messageId, count] of this.messageProcessingState.welcomeMessageCache) {
      if (recentMessages.has(messageId)) {
        recentWelcomeMessages.set(messageId, count);
      }
    }
    this.messageProcessingState.welcomeMessageCache = recentWelcomeMessages;
    
    console.log(`[StreamManager] 🧹 Cleaned message processing cache: ${recentMessages.size} recent messages`);
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
    
    // Clear message processing state
    this.messageProcessingState.processedMessageIds.clear();
    this.messageProcessingState.welcomeMessageCache.clear();

    // Remove network listener
    networkManager.offNetworkStatusChange(this.handleNetworkChange);

    console.log('[StreamManager] Stream manager destroyed');
  }
}