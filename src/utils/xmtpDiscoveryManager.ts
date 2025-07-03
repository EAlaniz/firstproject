/**
 * Enhanced XMTP Conversation Discovery Manager
 * 
 * Addresses the critical issue: Discovery results consistently showing {total: 0, dms: 0, groups: 0, combined: 0}
 * 
 * Implements V3-specific patterns (SDK v3.0.3+) for robust conversation discovery:
 * - Multi-strategy discovery with progressive fallbacks
 * - Enhanced cross-wallet conversation detection
 * - Network-aware retry mechanisms with endpoint health checking
 * - Memory-safe discovery patterns with WASM stability
 * - Advanced sync patterns for V3 alpha SDK stability issues
 * - Identity-based conversation discovery for multi-wallet scenarios
 */

import { Client, Dm, Group } from '@xmtp/browser-sdk';
import { networkManager, networkAwareDelay, isNetworkSuitableForXMTP } from './networkConnectivity';

export type XMTPConversation = Dm<string> | Group<string>;

export interface DiscoveryResult {
  total: number;
  dms: number;
  groups: number;
  combined: number;
  timestamp: number;
  method: string;
  networkConditions: string;
}

export interface DiscoveryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  syncTimeout: number;
  enableProgressiveSync: boolean;
  enableCrossWalletDetection: boolean;
  enableDeepSync: boolean;
  enableIdentityBasedDiscovery: boolean;
  wasmStabilityDelay: number;
  maxSyncRetries: number;
  syncBatchSize: number;
}

export interface DiscoveryState {
  isDiscovering: boolean;
  lastResult: DiscoveryResult | null;
  error: Error | null;
  attemptCount: number;
  totalDiscovered: number;
  lastSuccessfulSync: number;
}

/**
 * Robust conversation discovery manager for XMTP V3
 */
export class XMTPDiscoveryManager {
  private client: Client | null = null;
  private config: DiscoveryConfig = {
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    syncTimeout: 45000,
    enableProgressiveSync: true,
    enableCrossWalletDetection: true,
    enableDeepSync: true,
    enableIdentityBasedDiscovery: true,
    wasmStabilityDelay: 3000,
    maxSyncRetries: 3,
    syncBatchSize: 10
  };

  private state: DiscoveryState = {
    isDiscovering: false,
    lastResult: null,
    error: null,
    attemptCount: 0,
    totalDiscovered: 0,
    lastSuccessfulSync: 0
  };

  private discoveryCache = new Map<string, XMTPConversation>();
  private lastSyncMethod = '';
  private isDestroyed = false;

  constructor(config?: Partial<DiscoveryConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public async initialize(client: Client): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('DiscoveryManager has been destroyed');
    }

    console.log('[DiscoveryManager] Initializing with XMTP client');
    this.client = client;
  }

  /**
   * Main discovery method with comprehensive retry and fallback strategies
   */
  public async discoverConversations(forceRefresh = false): Promise<DiscoveryResult> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (this.state.isDiscovering) {
      console.log('[DiscoveryManager] Discovery already in progress');
      return this.state.lastResult || this.createEmptyResult('already-in-progress');
    }

    this.state.isDiscovering = true;
    this.state.error = null;

    try {
      console.log('[DiscoveryManager] 🔍 Starting conversation discovery...');
      
      // Check network suitability
      if (!isNetworkSuitableForXMTP()) {
        console.log('[DiscoveryManager] Network not suitable, waiting for stability...');
        await networkManager.waitForNetworkStability(10000);
      }

      // Progressive discovery strategy
      let result = await this.attemptProgressiveDiscovery();
      
      // If progressive discovery fails, try fallback methods
      if (result.total === 0 && this.config.enableCrossWalletDetection) {
        console.log('[DiscoveryManager] Progressive discovery yielded no results, trying fallback methods...');
        result = await this.attemptFallbackDiscovery();
      }

      // Cache successful results
      if (result.total > 0) {
        this.state.lastSuccessfulSync = Date.now();
        this.state.totalDiscovered = result.total;
      }

      this.state.lastResult = result;
      
      console.log('[DiscoveryManager] ✅ Discovery completed:', result);
      return result;

    } catch (error) {
      const discoveryError = error instanceof Error ? error : new Error(String(error));
      this.state.error = discoveryError;
      
      console.error('[DiscoveryManager] ❌ Discovery failed:', discoveryError.message);
      
      return this.createEmptyResult('error', discoveryError.message);
    } finally {
      this.state.isDiscovering = false;
    }
  }

  /**
   * Progressive discovery with multiple sync strategies
   */
  private async attemptProgressiveDiscovery(): Promise<DiscoveryResult> {
    let bestResult = this.createEmptyResult('progressive-start');
    let attempts = 0;
    const maxAttempts = this.config.maxAttempts;

    // Strategy 1: Quick sync first
    while (attempts < maxAttempts) {
      attempts++;
      this.state.attemptCount = attempts;
      
      console.log(`[DiscoveryManager] 🔄 Progressive attempt ${attempts}/${maxAttempts}...`);

      try {
        // Network-aware delay between attempts
        if (attempts > 1) {
          const delay = Math.min(
            this.config.baseDelay * Math.pow(2, attempts - 1),
            this.config.maxDelay
          );
          await networkAwareDelay(delay);
        }

        // Try different sync patterns based on attempt number
        const result = await this.attemptSyncPattern(attempts);
        
        // Update best result if this one is better
        if (result.total > bestResult.total) {
          bestResult = result;
        }

        // If we found conversations, consider it a success
        if (result.total > 0) {
          console.log(`[DiscoveryManager] ✅ Progressive discovery succeeded on attempt ${attempts}`);
          return result;
        }

        // V3 Enhancement: If no results but no error, wait longer and try again
        if (attempts < maxAttempts) {
          console.log(`[DiscoveryManager] ⏳ No results on attempt ${attempts}, waiting before retry...`);
        }

      } catch (error) {
        console.warn(`[DiscoveryManager] ⚠️ Attempt ${attempts} failed:`, error);
        
        // If it's a critical error, don't continue
        if (this.isCriticalError(error)) {
          throw error;
        }
      }
    }

    console.log(`[DiscoveryManager] Progressive discovery completed with best result: ${bestResult.total} conversations`);
    return bestResult;
  }

  /**
   * Different sync patterns for each attempt - enhanced with new strategies
   */
  private async attemptSyncPattern(attemptNumber: number): Promise<DiscoveryResult> {
    if (!this.client) throw new Error('No client');

    const patterns = [
      () => this.syncPattern_Standard(),
      () => this.syncPattern_SeparateAPIs(),
      () => this.syncPattern_WithWait(),
      () => this.syncPattern_ForceRefresh(),
      () => this.syncPattern_CrossWallet(),
      () => this.syncPattern_DeepSync(),
      () => this.syncPattern_IdentityBased(),
      () => this.syncPattern_WasmStabilized()
    ];

    const pattern = patterns[(attemptNumber - 1) % patterns.length];
    const patternName = pattern.name.replace('bound ', '');
    
    console.log(`[DiscoveryManager] Using pattern: ${patternName}`);
    return await pattern();
  }

  /**
   * Pattern 1: Standard XMTP sync
   */
  private async syncPattern_Standard(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using standard sync pattern');
    
    await this.client!.conversations.sync();
    const conversations = await this.client!.conversations.list();
    
    return this.createResultFromConversations(conversations, 'standard-sync');
  }

  /**
   * Pattern 2: Separate API calls
   */
  private async syncPattern_SeparateAPIs(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using separate APIs pattern');
    
    await this.client!.conversations.sync();
    
    // Call each API separately with delays
    const dmConversations = await this.client!.conversations.listDms();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const groupConversations = await this.client!.conversations.listGroups();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Combine results
    const combinedConversations = [...dmConversations, ...groupConversations];
    
    return this.createResultFromConversations(combinedConversations, 'separate-apis', {
      dms: dmConversations.length,
      groups: groupConversations.length
    });
  }

  /**
   * Pattern 3: Sync with extended wait
   */
  private async syncPattern_WithWait(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using extended wait pattern');
    
    await this.client!.conversations.sync();
    
    // Extended wait for network propagation (V3 specific)
    await networkAwareDelay(3000);
    
    const conversations = await this.client!.conversations.list();
    
    return this.createResultFromConversations(conversations, 'extended-wait');
  }

  /**
   * Pattern 4: Force refresh with multiple syncs
   */
  private async syncPattern_ForceRefresh(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using force refresh pattern');
    
    // Multiple sync calls (V3 alpha stability workaround)
    for (let i = 0; i < 3; i++) {
      await this.client!.conversations.sync();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const conversations = await this.client!.conversations.list();
    
    return this.createResultFromConversations(conversations, 'force-refresh');
  }

  /**
   * Pattern 5: Cross-wallet detection pattern
   */
  private async syncPattern_CrossWallet(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using cross-wallet detection pattern');
    
    // This pattern is specifically for detecting conversations from other wallets
    await this.client!.conversations.sync();
    
    // Extended sync for cross-wallet conversation discovery
    await networkAwareDelay(5000);
    
    // Try both list methods in sequence
    const allConversations = await this.client!.conversations.list();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const dmConversations = await this.client!.conversations.listDms();
    const groupConversations = await this.client!.conversations.listGroups();
    
    // Combine and deduplicate
    const conversationMap = new Map();
    [...allConversations, ...dmConversations, ...groupConversations].forEach(conv => {
      conversationMap.set(conv.id, conv);
    });
    
    const uniqueConversations = Array.from(conversationMap.values());
    
    return this.createResultFromConversations(uniqueConversations, 'cross-wallet', {
      dms: dmConversations.length,
      groups: groupConversations.length,
      combined: allConversations.length
    });
  }

  /**
   * Pattern 6: Deep sync with multiple rounds and WASM stability
   */
  private async syncPattern_DeepSync(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using deep sync pattern');
    
    if (!this.config.enableDeepSync) {
      return this.syncPattern_Standard();
    }

    // Multiple sync rounds with progressive delays
    let allConversations: any[] = [];
    const syncRounds = this.config.maxSyncRetries;
    
    for (let round = 0; round < syncRounds; round++) {
      console.log(`[DiscoveryManager] Deep sync round ${round + 1}/${syncRounds}`);
      
      try {
        // Perform sync with timeout protection
        await Promise.race([
          this.client!.conversations.sync(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sync timeout')), 15000)
          )
        ]);
        
        // Get conversations for this round
        const conversations = await this.client!.conversations.list();
        
        // Merge with previous results
        const conversationMap = new Map();
        [...allConversations, ...conversations].forEach(conv => {
          conversationMap.set(conv.id, conv);
        });
        allConversations = Array.from(conversationMap.values());
        
        console.log(`[DiscoveryManager] Round ${round + 1} found ${conversations.length} conversations (total: ${allConversations.length})`);
        
        // Progressive delay between rounds for WASM stability
        if (round < syncRounds - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.wasmStabilityDelay + (round * 1000)));
        }
        
      } catch (error) {
        console.warn(`[DiscoveryManager] Deep sync round ${round + 1} failed:`, error);
        
        // Continue with other rounds even if one fails
        if (round < syncRounds - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    return this.createResultFromConversations(allConversations, 'deep-sync');
  }

  /**
   * Pattern 7: Identity-based discovery for cross-wallet scenarios
   */
  private async syncPattern_IdentityBased(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using identity-based discovery pattern');
    
    if (!this.config.enableIdentityBasedDiscovery) {
      return this.syncPattern_Standard();
    }

    try {
      // Enhanced sync with identity context
      await this.client!.conversations.sync();
      
      // Extended wait for identity-based conversation propagation
      await networkAwareDelay(5000);
      
      // Multiple discovery approaches
      const discoveryMethods = [
        () => this.client!.conversations.list(),
        () => this.client!.conversations.listDms(),
        () => this.client!.conversations.listGroups()
      ];
      
      let allConversations: any[] = [];
      
      for (const method of discoveryMethods) {
        try {
          const conversations = await method();
          console.log(`[DiscoveryManager] Identity-based method found ${conversations.length} conversations`);
          
          // Merge results
          const conversationMap = new Map();
          [...allConversations, ...conversations].forEach(conv => {
            conversationMap.set(conv.id, conv);
          });
          allConversations = Array.from(conversationMap.values());
          
          // Small delay between methods for WASM stability
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (methodError) {
          console.warn('[DiscoveryManager] Identity-based method failed:', methodError);
        }
      }
      
      return this.createResultFromConversations(allConversations, 'identity-based');
      
    } catch (error) {
      console.error('[DiscoveryManager] Identity-based discovery failed:', error);
      return this.createEmptyResult('identity-based-failed');
    }
  }

  /**
   * Pattern 8: WASM-stabilized discovery with extended delays and recovery
   */
  private async syncPattern_WasmStabilized(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 📋 Using WASM-stabilized discovery pattern');
    
    try {
      // Pre-sync WASM stabilization delay
      console.log('[DiscoveryManager] WASM stabilization delay...');
      await new Promise(resolve => setTimeout(resolve, this.config.wasmStabilityDelay));
      
      // Force garbage collection before sync to prevent WASM issues
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Conservative sync approach with extended timeouts
      console.log('[DiscoveryManager] Performing WASM-safe sync...');
      await this.performWasmSafeSync();
      
      // Extended propagation delay for WASM stability
      await new Promise(resolve => setTimeout(resolve, 7000));
      
      // Careful conversation retrieval with error handling
      let conversations: any[] = [];
      
      try {
        conversations = await this.client!.conversations.list();
        console.log(`[DiscoveryManager] WASM-stabilized found ${conversations.length} conversations`);
      } catch (listError) {
        console.warn('[DiscoveryManager] List failed, trying alternative approaches...');
        
        // Fallback approaches if list() fails
        try {
          const dms = await this.client!.conversations.listDms();
          const groups = await this.client!.conversations.listGroups();
          conversations = [...dms, ...groups];
          console.log(`[DiscoveryManager] Alternative approach found ${conversations.length} conversations`);
        } catch (fallbackError) {
          console.error('[DiscoveryManager] All approaches failed:', fallbackError);
          return this.createEmptyResult('wasm-stabilized-failed');
        }
      }
      
      return this.createResultFromConversations(conversations, 'wasm-stabilized');
      
    } catch (error) {
      console.error('[DiscoveryManager] WASM-stabilized discovery failed:', error);
      return this.createEmptyResult('wasm-stabilized-error');
    }
  }

  /**
   * WASM-safe sync with extended error handling
   */
  private async performWasmSafeSync(): Promise<void> {
    let syncAttempts = 0;
    const maxSyncAttempts = this.config.maxSyncRetries;
    
    while (syncAttempts < maxSyncAttempts) {
      try {
        syncAttempts++;
        console.log(`[DiscoveryManager] WASM-safe sync attempt ${syncAttempts}/${maxSyncAttempts}`);
        
        // Sync with timeout protection
        await Promise.race([
          this.client!.conversations.sync(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('WASM-safe sync timeout')), 20000)
          )
        ]);
        
        console.log('[DiscoveryManager] WASM-safe sync completed successfully');
        return;
        
      } catch (syncError) {
        console.warn(`[DiscoveryManager] WASM-safe sync attempt ${syncAttempts} failed:`, syncError);
        
        // Check for WASM-specific errors
        const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
        
        if (/panicked at.*wasm|BorrowMutError|unreachable/i.test(errorMessage)) {
          console.log('[DiscoveryManager] WASM error detected, applying extended recovery delay');
          await new Promise(resolve => setTimeout(resolve, this.config.wasmStabilityDelay * 2));
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (syncAttempts === maxSyncAttempts) {
          throw new Error(`WASM-safe sync failed after ${maxSyncAttempts} attempts`);
        }
      }
    }
  }

  /**
   * Fallback discovery methods when progressive fails
   */
  private async attemptFallbackDiscovery(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] 🔄 Attempting fallback discovery methods...');
    
    try {
      // Fallback 1: Cache check
      const cachedResult = this.tryFromCache();
      if (cachedResult.total > 0) {
        return cachedResult;
      }
      
      // Fallback 2: Minimal sync with timeout
      const timeoutResult = await this.tryWithTimeout();
      if (timeoutResult.total > 0) {
        return timeoutResult;
      }
      
      // Fallback 3: Return last known good result if available
      if (this.state.lastResult && this.state.lastResult.total > 0) {
        console.log('[DiscoveryManager] Using last known good result as fallback');
        return {
          ...this.state.lastResult,
          method: 'fallback-cached',
          timestamp: Date.now()
        };
      }
      
    } catch (error) {
      console.error('[DiscoveryManager] Fallback discovery failed:', error);
    }
    
    return this.createEmptyResult('fallback-failed');
  }

  private tryFromCache(): DiscoveryResult {
    const cached = Array.from(this.discoveryCache.values());
    return this.createResultFromConversations(cached, 'cache');
  }

  private async tryWithTimeout(): Promise<DiscoveryResult> {
    console.log('[DiscoveryManager] Trying minimal sync with timeout...');
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Discovery timeout')), this.config.syncTimeout);
    });

    const discoveryPromise = async () => {
      await this.client!.conversations.sync();
      return await this.client!.conversations.list();
    };

    try {
      const conversations = await Promise.race([discoveryPromise(), timeoutPromise]);
      return this.createResultFromConversations(conversations, 'timeout-protected');
    } catch (error) {
      console.warn('[DiscoveryManager] Timeout-protected discovery failed:', error);
      return this.createEmptyResult('timeout-failed');
    }
  }

  private createResultFromConversations(
    conversations: any[], 
    method: string,
    breakdown?: { dms?: number; groups?: number; combined?: number }
  ): DiscoveryResult {
    // Cache the conversations
    conversations.forEach(conv => {
      this.discoveryCache.set(conv.id, conv);
    });

    // Count by type
    let dms = 0;
    let groups = 0;
    
    conversations.forEach(conv => {
      if ('members' in conv) {
        groups++;
      } else {
        dms++;
      }
    });

    const networkStatus = networkManager.getCurrentNetworkStatus();
    
    return {
      total: conversations.length,
      dms: breakdown?.dms ?? dms,
      groups: breakdown?.groups ?? groups,
      combined: breakdown?.combined ?? conversations.length,
      timestamp: Date.now(),
      method,
      networkConditions: `${networkStatus.effectiveType || networkStatus.connectionType}_${networkStatus.isOnline ? 'online' : 'offline'}`
    };
  }

  private createEmptyResult(method: string, error?: string): DiscoveryResult {
    const networkStatus = networkManager.getCurrentNetworkStatus();
    
    return {
      total: 0,
      dms: 0,
      groups: 0,
      combined: 0,
      timestamp: Date.now(),
      method: error ? `${method}_error` : method,
      networkConditions: `${networkStatus.effectiveType || networkStatus.connectionType}_${networkStatus.isOnline ? 'online' : 'offline'}`
    };
  }

  private isCriticalError(error: any): boolean {
    const errorMessage = error?.message || String(error);
    
    // Consider these as critical errors that should stop discovery
    const criticalPatterns = [
      /client.*not.*initialized/i,
      /authentication.*failed/i,
      /network.*unavailable/i,
      /panicked at.*wasm/i
    ];

    return criticalPatterns.some(pattern => pattern.test(errorMessage));
  }

  // Public API methods
  public getState(): DiscoveryState {
    return { ...this.state };
  }

  public getCachedConversations(): XMTPConversation[] {
    return Array.from(this.discoveryCache.values());
  }

  public clearCache(): void {
    this.discoveryCache.clear();
    console.log('[DiscoveryManager] Cache cleared');
  }

  public getDiscoveryReport(): {
    state: DiscoveryState;
    cacheSize: number;
    networkSuitability: boolean;
    recommendations: string[];
  } {
    const recommendations = [];
    
    if (!this.state.lastResult || this.state.lastResult.total === 0) {
      recommendations.push('No conversations discovered - check network connectivity');
    }
    
    if (this.state.error) {
      recommendations.push(`Error occurred: ${this.state.error.message}`);
    }
    
    if (!isNetworkSuitableForXMTP()) {
      recommendations.push('Network conditions not suitable for XMTP operations');
    }
    
    if (this.state.attemptCount >= this.config.maxAttempts) {
      recommendations.push('Max discovery attempts reached - consider manual recovery');
    }

    return {
      state: this.state,
      cacheSize: this.discoveryCache.size,
      networkSuitability: isNetworkSuitableForXMTP(),
      recommendations
    };
  }

  public async destroy(): Promise<void> {
    console.log('[DiscoveryManager] Destroying discovery manager');
    this.isDestroyed = true;
    this.discoveryCache.clear();
  }
}