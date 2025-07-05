// XMTP Direct Message - Mirror of official Browser SDK
import type { Dm as WasmDm } from '@xmtp/browser-sdk';
import type { Client } from './Client';
import { Conversation } from './Conversation';
// Remove unused import

export class Dm extends Conversation {
  protected wasmDm: WasmDm;

  constructor(wasmDm: WasmDm, client: Client) {
    super(wasmDm, client);
    this.wasmDm = wasmDm;
  }

  // DM-specific properties
  get peerInboxId(): string {
    return this.wasmDm.peerInboxId;
  }

  // DMs don't have explicit names, use peer inbox ID
  get name(): string | undefined {
    return `DM with ${this.peerInboxId.substring(0, 8)}...`;
  }

  // DMs don't have descriptions
  get description(): string | undefined {
    return undefined;
  }

  // Get peer information
  async getPeerAddress(): Promise<string | null> {
    try {
      // Try to resolve inbox ID back to address
      // Note: This is a reverse lookup that may not always be possible
      // In a real implementation, you might cache address mappings
      console.warn('[XMTP DM] Reverse address lookup not implemented in Browser SDK');
      return null;
    } catch (error) {
      console.warn('[XMTP DM] Failed to get peer address:', error);
      return null;
    }
  }

  // Check if this DM is with a specific inbox ID
  isPeerInboxId(inboxId: string): boolean {
    return this.peerInboxId === inboxId;
  }

  // Check if this DM is with a specific address
  async isPeerAddress(address: string): Promise<boolean> {
    try {
      const inboxId = await this.client.findInboxIdByIdentifier({
        identifier: address.toLowerCase().trim(),
        identifierKind: 'Ethereum',
      });
      
      return inboxId === this.peerInboxId;
    } catch (error) {
      console.warn('[XMTP DM] Failed to check peer address:', error);
      return false;
    }
  }

  // DM-specific metadata
  async getMetadata() {
    const baseMetadata = await super.getMetadata();
    
    return {
      ...baseMetadata,
      name: this.name,
      peerInboxId: this.peerInboxId,
      type: 'dm' as const,
    };
  }

  // String representation
  toString(): string {
    return `Dm(id=${this.id}, peer=${this.peerInboxId.substring(0, 8)}...)`;
  }
}

export default Dm;