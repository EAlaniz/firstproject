/**
 * XMTP Stream Manager - Official Implementation Pattern
 * 
 * Based on official XMTP documentation:
 * - https://docs.xmtp.org/inboxes/stream
 * - https://docs.xmtp.org/inboxes/sync-and-syncall
 * - https://docs.xmtp.org/inboxes/sync-preferences
 * 
 * Essential patterns implemented:
 * 1. Sync before stream pattern with comprehensive sync strategy
 * 2. Consent state filtering with configurable states
 * 3. Enhanced error handling with recovery mechanisms
 * 4. Proper stream lifecycle management with cleanup
 * 5. Welcome message handling via sync operations
 * 6. Conversation context retrieval using getConversationById
 * 7. Content type validation with fallback handling
 * 8. Own message filtering using senderInboxId
 * 9. Memory-efficient conversation caching
 */

import { Client, DecodedMessage, ConsentState, Dm, Group } from '@xmtp/browser-sdk';

export interface StreamState {
  isActive: boolean;
  error: Error | null;
  messageCount: number;
  lastActivity: number;
}

export interface StreamConfig {
  consentStates: ConsentState[];
  enableAutoRestart: boolean;
  restartDelay: number;
  enableConversationContext: boolean;
  enableContentTypeValidation: boolean;
  filterOwnMessages: boolean;
}

type XMTPConversation = Dm<any> | Group<any>;
type MessageHandler = (message: DecodedMessage<string>, conversation?: XMTPConversation) => void;
type ErrorHandler = (error: Error) => void;
type StateHandler = (state: StreamState) => void;

export class XMTPStreamManager {
  private client: Client | null = null;
  private stream: any = null;
  private abortController: AbortController | null = null;
  private isDestroyed = false;
  
  private state: StreamState = {
    isActive: false,
    error: null,
    messageCount: 0,
    lastActivity: Date.now(),
  };

  private config: StreamConfig = {
    consentStates: [ConsentState.Allowed, ConsentState.Unknown], // Per XMTP docs: default behavior streams allowed and unknown
    enableAutoRestart: true,
    restartDelay: 5000,
    enableConversationContext: true,
    enableContentTypeValidation: true,
    filterOwnMessages: true
  };

  private messageHandlers: MessageHandler[] = [];
  private errorHandlers: ErrorHandler[] = [];
  private stateChangeHandlers: StateHandler[] = [];
  private conversationCache = new Map<string, XMTPConversation>();

  constructor(client: Client, config?: Partial<StreamConfig>) {
    this.client = client;
    if (config) {
      this.config = { ...this.config, ...config };
    }
    console.log('[StreamManager] Initialized with official XMTP patterns');
  }

  // Event handlers
  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  public onError(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  public onStateChange(handler: StateHandler): void {
    this.stateChangeHandlers.push(handler);
  }

  public async startStream(): Promise<void> {
    if (this.isDestroyed || !this.client) {
      console.warn('[StreamManager] Cannot start - destroyed or no client');
      return;
    }

    if (this.state.isActive) {
      console.log('[StreamManager] Stream already active');
      return;
    }

    console.log('[StreamManager] Starting XMTP stream with official pattern...');

    try {
      // Step 1: Sync conversations first (per official docs)
      // This handles welcome messages and ensures we have latest state
      await this.syncConversations();

      // Step 2: Create abort controller for clean shutdown (per docs: streams are infinite)
      this.abortController = new AbortController();

      // Step 3: Create stream with consent filtering (official pattern)
      console.log('[StreamManager] Creating infinite message stream...');
      this.stream = await this.client.conversations.streamAllMessages(
        undefined, // callback
        undefined, // conversationType 
        this.config.consentStates // consentStates (allowed + unknown)
      );
      
      this.updateState({ isActive: true, error: null });
      console.log('[StreamManager] ✅ Infinite stream started successfully');

      // Step 4: Start processing messages (official pattern)
      // Note: This is an infinite stream that requires explicit termination
      this.processMessages();

    } catch (error) {
      console.error('[StreamManager] Failed to start stream:', error);
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async syncConversations(): Promise<void> {
    if (!this.client) return;

    try {
      console.log('[StreamManager] Syncing conversations (official pattern)...');
      
      // Per XMTP docs: "sync the client to get the latest messages"
      await this.client.conversations.sync();
      
      // Optional: Also sync all conversations, messages, and preferences
      // This handles welcome messages properly per docs
      await this.client.conversations.syncAll(this.config.consentStates);
      
      console.log('[StreamManager] ✅ Conversations synced successfully');
    } catch (error) {
      console.warn('[StreamManager] Sync failed, continuing with stream:', error);
      // Don't throw - let stream attempt to work without sync
    }
  }

  private async processMessages(): Promise<void> {
    if (!this.stream || !this.abortController) {
      return;
    }

    const signal = this.abortController.signal;

    try {
      console.log('[StreamManager] Starting infinite message processing loop...');

      // Official XMTP pattern: simple for await loop on infinite stream
      for await (const message of this.stream) {
        // Explicit termination check (per docs: infinite streams require explicit termination)
        if (signal.aborted || this.isDestroyed) {
          console.log('[StreamManager] Infinite stream explicitly terminated');
          break; // Explicit termination as per XMTP docs
        }

        try {
          // Enhanced: Filter own messages using senderInboxId (official pattern)
          if (this.config.filterOwnMessages && message.senderInboxId === this.client?.inboxId) {
            continue; // Skip own messages
          }

          // Enhanced: Process message with advanced context
          const conversation = await this.getConversationContext(message);
          
          // Enhanced: Validate content type
          const isValidContent = this.validateContentType(message);
          if (!isValidContent) {
            console.warn('[StreamManager] Invalid or unsupported content type, skipping message');
            continue;
          }

          // Update state
          this.updateState({ 
            messageCount: this.state.messageCount + 1,
            lastActivity: Date.now()
          });

          // Process message with all handlers (now with conversation context)
          this.messageHandlers.forEach(handler => {
            try {
              handler(message, conversation);
            } catch (handlerError) {
              console.error('[StreamManager] Message handler error:', handlerError);
            }
          });

        } catch (messageError) {
          console.error('[StreamManager] Error processing message:', messageError);
          // Continue processing other messages per XMTP docs
        }
      }

    } catch (error) {
      // Only handle errors if not explicitly aborted or destroyed
      if (!signal.aborted && !this.isDestroyed) {
        console.error('[StreamManager] Infinite stream error:', error);
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    }

    console.log('[StreamManager] Infinite message processing loop ended');
  }

  private handleError(error: Error): void {
    console.error('[StreamManager] Handling error:', error.message);
    
    this.updateState({ 
      error,
      isActive: false 
    });

    // Notify error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('[StreamManager] Error handler failed:', handlerError);
      }
    });

    // Simple auto-restart (per XMTP docs - streams can be restarted)
    if (this.config.enableAutoRestart && !this.isDestroyed) {
      console.log(`[StreamManager] Scheduling restart in ${this.config.restartDelay}ms...`);
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.startStream();
        }
      }, this.config.restartDelay);
    }
  }

  private updateState(updates: Partial<StreamState>): void {
    this.state = { ...this.state, ...updates };
    
    // Notify state change handlers
    this.stateChangeHandlers.forEach(handler => {
      try {
        handler(this.state);
      } catch (handlerError) {
        console.error('[StreamManager] State handler error:', handlerError);
      }
    });
  }

  public async stopStream(): Promise<void> {
    console.log('[StreamManager] Stopping stream...');
    
    // Abort the stream processing
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Clear stream reference
    this.stream = null;
    
    this.updateState({ isActive: false });
    console.log('[StreamManager] ✅ Stream stopped');
  }

  public async destroy(): Promise<void> {
    console.log('[StreamManager] Destroying stream manager...');
    this.isDestroyed = true;

    // Stop the stream
    await this.stopStream();

    // Clear all handlers
    this.messageHandlers.length = 0;
    this.errorHandlers.length = 0;
    this.stateChangeHandlers.length = 0;

    // Enhanced: Clear caches for memory management
    this.clearCaches();

    // Clear client reference
    this.client = null;
    
    console.log('[StreamManager] ✅ Stream manager destroyed');
  }

  // Utility methods
  public getState(): StreamState {
    return { ...this.state };
  }

  public isActive(): boolean {
    return this.state.isActive && !this.isDestroyed;
  }

  public getMessageCount(): number {
    return this.state.messageCount;
  }

  public getLastError(): Error | null {
    return this.state.error;
  }

  public updateConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[StreamManager] Config updated:', this.config);
  }

  // Enhanced Methods for Advanced Patterns


  /**
   * Get conversation context for message routing (official pattern)
   */
  private async getConversationContext(message: DecodedMessage<string>): Promise<XMTPConversation | undefined> {
    if (!this.config.enableConversationContext || !this.client) {
      return undefined;
    }

    try {
      // Check cache first
      if (this.conversationCache.has(message.conversationId)) {
        return this.conversationCache.get(message.conversationId);
      }

      // Get conversation by ID (official pattern)
      const conversation = await this.client.conversations.getConversationById(
        message.conversationId
      );
      
      // Cache for future use
      if (conversation) {
        this.conversationCache.set(message.conversationId, conversation as XMTPConversation);
      }
      
      return conversation as XMTPConversation | undefined;
    } catch (error) {
      console.warn('[StreamManager] Failed to get conversation context:', error);
      return undefined;
    }
  }


  /**
   * Validate content type with fallback handling (official pattern)
   */
  private validateContentType(message: DecodedMessage<string>): boolean {
    if (!this.config.enableContentTypeValidation || !this.client) {
      return true;
    }

    try {
      // Check if client has codec for this content type
      const codec = this.client.codecFor(message.contentType);
      if (!codec) {
        // Check for fallback content (official pattern)
        if (message.fallback !== undefined) {
          console.log('[StreamManager] Using fallback content for unsupported type');
          return true;
        }
        
        // Skip content types that shouldn't be displayed (like ReadReceipts)
        console.warn(`[StreamManager] Unsupported content type: ${message.contentType}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('[StreamManager] Content type validation failed:', error);
      return true; // Default to allowing if validation fails
    }
  }




  /**
   * Get detailed stream statistics
   */
  public getDetailedStats(): {
    state: StreamState;
    conversationCacheSize: number;
    config: StreamConfig;
  } {
    return {
      state: { ...this.state },
      conversationCacheSize: this.conversationCache.size,
      config: { ...this.config }
    };
  }

  /**
   * Clear all caches for memory management
   */
  public clearCaches(): void {
    this.conversationCache.clear();
    console.log('[StreamManager] ✅ All caches cleared');
  }
}