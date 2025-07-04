/**
 * XMTP Conversation Discovery Manager
 * 
 * Simple, focused discovery manager following official XMTP patterns:
 * - Basic conversation discovery
 * - Simple retry mechanism
 * - Conversation caching
 */

import { Client, Dm, Group } from '@xmtp/browser-sdk';

export type XMTPConversation = Dm<any> | Group<any>;

export interface DiscoveryResult {
  total: number;
  dms: number;
  groups: number;
  timestamp: number;
}

export interface DiscoveryState {
  isDiscovering: boolean;
  lastResult: DiscoveryResult | null;
  error: Error | null;
}

/**
 * Simple conversation discovery manager for XMTP V3
 */
export class XMTPDiscoveryManager {
  private client: Client | null = null;
  private isDestroyed = false;
  
  private state: DiscoveryState = {
    isDiscovering: false,
    lastResult: null,
    error: null
  };

  private discoveryCache = new Map<string, XMTPConversation>();

  public async initialize(client: Client): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('DiscoveryManager has been destroyed');
    }

    console.log('[DiscoveryManager] Initializing with XMTP client');
    this.client = client;
  }

  /**
   * Discover new incoming conversations
   */
  public async discoverNewIncomingConversations(): Promise<DiscoveryResult> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('[DiscoveryManager] 🆕 Detecting new incoming conversations...');
    
    try {
      // Get fresh conversation list
      const conversations = await this.client.conversations.list();
      const dms = await this.client.conversations.listDms();
      
      console.log('[DiscoveryManager] Fresh conversation check:', {
        total: conversations.length,
        dms: dms.length,
        cached: this.discoveryCache.size
      });
      
      // Check for new conversations not in cache
      const newConversations = conversations.filter(conv => 
        !this.discoveryCache.has(conv.id)
      );
      
      if (newConversations.length > 0) {
        console.log('[DiscoveryManager] 🎉 Found NEW incoming conversations:', newConversations.length);
        
        // Add new conversations to cache
        newConversations.forEach(conv => {
          this.discoveryCache.set(conv.id, conv as XMTPConversation);
        });
      }
      
      // Update cache with all conversations
      conversations.forEach(conv => {
        this.discoveryCache.set(conv.id, conv as XMTPConversation);
      });
      
      const result: DiscoveryResult = {
        total: conversations.length,
        dms: dms.length,
        groups: conversations.length - dms.length,
        timestamp: Date.now()
      };
      
      this.state.lastResult = result;
      console.log('[DiscoveryManager] ✅ New incoming conversation detection completed:', result);
      
      return result;
      
    } catch (error) {
      console.error('[DiscoveryManager] ❌ New incoming conversation detection failed:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Main discovery method with simple retry
   */
  public async discoverConversations(): Promise<DiscoveryResult> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    if (this.state.isDiscovering) {
      console.log('[DiscoveryManager] Discovery already in progress');
      return this.state.lastResult || this.createEmptyResult();
    }

    this.state.isDiscovering = true;
    this.state.error = null;

    try {
      console.log('[DiscoveryManager] 🔍 Starting conversation discovery...');
      
      // Simple sync then list pattern
      await this.client.conversations.sync();
      
      const conversations = await this.client.conversations.list();
      const dms = await this.client.conversations.listDms();
      const groups = await this.client.conversations.listGroups();
      
      // Cache conversations
      conversations.forEach(conv => {
        this.discoveryCache.set(conv.id, conv as XMTPConversation);
      });

      const result: DiscoveryResult = {
        total: conversations.length,
        dms: dms.length,
        groups: groups.length,
        timestamp: Date.now()
      };

      this.state.lastResult = result;
      
      console.log('[DiscoveryManager] ✅ Discovery completed:', result);
      return result;

    } catch (error) {
      const discoveryError = error instanceof Error ? error : new Error(String(error));
      this.state.error = discoveryError;
      
      console.error('[DiscoveryManager] ❌ Discovery failed:', discoveryError.message);
      
      return this.createEmptyResult();
    } finally {
      this.state.isDiscovering = false;
    }
  }

  private createEmptyResult(): DiscoveryResult {
    return {
      total: 0,
      dms: 0,
      groups: 0,
      timestamp: Date.now()
    };
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

  public async destroy(): Promise<void> {
    console.log('[DiscoveryManager] Destroying discovery manager');
    this.isDestroyed = true;
    this.discoveryCache.clear();
  }
}