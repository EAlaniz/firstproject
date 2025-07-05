// XMTP Contacts - Consent Management
import type { ConsentState } from '@xmtp/browser-sdk';
import type {
  ConsentEntry,
  ConsentListOptions,
  AsyncStream,
  StreamCallback,
} from './types';
import type { Client } from './Client';
import {
  ErrorFactory,
  ConsentError,
  ConsentNotFoundError,
  ClientNotInitializedError,
} from './errors';
import {
  AddressValidator,
  ConsentUtils,
  AsyncStreamImpl,
  SubscriptionManager,
} from './utils';

export class Contacts {
  private client: Client;
  private subscriptionManager = new SubscriptionManager();

  constructor(client: Client) {
    this.client = client;
  }

  // Consent management
  async setConsent(
    identifiers: Array<{ identifier: string; identifierKind: 'Ethereum' | 'Address' }>,
    state: ConsentState
  ): Promise<void> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Validate addresses
      const validatedIdentifiers = identifiers.map(({ identifier, identifierKind }) => {
        if (identifierKind === 'Ethereum') {
          const normalized = AddressValidator.validateAndNormalize(identifier);
          return { identifier: normalized, identifierKind };
        }
        return { identifier, identifierKind };
      });

      await wasmClient.setConsentStates(validatedIdentifiers, state);
      
      console.log(`[XMTP Contacts] Set consent to ${state} for ${validatedIdentifiers.length} identifiers`);
    } catch (error) {
      throw new ConsentError(
        `Failed to set consent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { identifiers, state, originalError: error }
      );
    }
  }

  async getConsent(identifier: string, identifierKind: 'Ethereum' | 'Address' = 'Ethereum'): Promise<ConsentState> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Validate address
      const normalizedIdentifier = identifierKind === 'Ethereum' 
        ? AddressValidator.validateAndNormalize(identifier)
        : identifier;

      const consentStates = await wasmClient.getConsentState([{
        identifier: normalizedIdentifier,
        identifierKind,
      }]);

      const consentState = consentStates.get(normalizedIdentifier);
      if (consentState === undefined) {
        return 'Unknown';
      }

      return consentState;
    } catch (error) {
      throw new ConsentError(
        `Failed to get consent: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { identifier, identifierKind, originalError: error }
      );
    }
  }

  async getAllowedList(options: ConsentListOptions = {}): Promise<ConsentEntry[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      const consentList = await wasmClient.getConsentState();
      
      const allowedEntries: ConsentEntry[] = [];
      
      for (const [identifier, state] of consentList.entries()) {
        if (ConsentUtils.isAllowed(state)) {
          // Apply filters if provided
          if (options.identifier && !identifier.includes(options.identifier)) {
            continue;
          }
          
          allowedEntries.push({
            identifier,
            identifierKind: options.identifierKind || 'Ethereum',
            permissionType: state,
          });
        }
      }

      return allowedEntries;
    } catch (error) {
      throw new ConsentError(
        `Failed to get allowed list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { options, originalError: error }
      );
    }
  }

  async getDeniedList(options: ConsentListOptions = {}): Promise<ConsentEntry[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      const consentList = await wasmClient.getConsentState();
      
      const deniedEntries: ConsentEntry[] = [];
      
      for (const [identifier, state] of consentList.entries()) {
        if (ConsentUtils.isDenied(state)) {
          // Apply filters if provided
          if (options.identifier && !identifier.includes(options.identifier)) {
            continue;
          }
          
          deniedEntries.push({
            identifier,
            identifierKind: options.identifierKind || 'Ethereum',
            permissionType: state,
          });
        }
      }

      return deniedEntries;
    } catch (error) {
      throw new ConsentError(
        `Failed to get denied list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { options, originalError: error }
      );
    }
  }

  async getUnknownList(options: ConsentListOptions = {}): Promise<ConsentEntry[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      const consentList = await wasmClient.getConsentState();
      
      const unknownEntries: ConsentEntry[] = [];
      
      for (const [identifier, state] of consentList.entries()) {
        if (ConsentUtils.isUnknown(state)) {
          // Apply filters if provided
          if (options.identifier && !identifier.includes(options.identifier)) {
            continue;
          }
          
          unknownEntries.push({
            identifier,
            identifierKind: options.identifierKind || 'Ethereum',
            permissionType: state,
          });
        }
      }

      return unknownEntries;
    } catch (error) {
      throw new ConsentError(
        `Failed to get unknown list: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { options, originalError: error }
      );
    }
  }

  async getAllConsentEntries(options: ConsentListOptions = {}): Promise<ConsentEntry[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      const consentList = await wasmClient.getConsentState();
      
      const allEntries: ConsentEntry[] = [];
      
      for (const [identifier, state] of consentList.entries()) {
        // Apply filters if provided
        if (options.identifier && !identifier.includes(options.identifier)) {
          continue;
        }
        
        allEntries.push({
          identifier,
          identifierKind: options.identifierKind || 'Ethereum',
          permissionType: state,
        });
      }

      return allEntries;
    } catch (error) {
      throw new ConsentError(
        `Failed to get consent entries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { options, originalError: error }
      );
    }
  }

  // Bulk operations
  async allowContacts(identifiers: string[]): Promise<void> {
    const entries = identifiers.map(identifier => ({
      identifier: AddressValidator.validateAndNormalize(identifier),
      identifierKind: 'Ethereum' as const,
    }));

    await this.setConsent(entries, 'Allowed');
  }

  async denyContacts(identifiers: string[]): Promise<void> {
    const entries = identifiers.map(identifier => ({
      identifier: AddressValidator.validateAndNormalize(identifier),
      identifierKind: 'Ethereum' as const,
    }));

    await this.setConsent(entries, 'Denied');
  }

  async resetConsent(identifiers: string[]): Promise<void> {
    const entries = identifiers.map(identifier => ({
      identifier: AddressValidator.validateAndNormalize(identifier),
      identifierKind: 'Ethereum' as const,
    }));

    await this.setConsent(entries, 'Unknown');
  }

  // Contact utilities
  async isAllowed(identifier: string): Promise<boolean> {
    const consent = await this.getConsent(identifier);
    return ConsentUtils.isAllowed(consent);
  }

  async isDenied(identifier: string): Promise<boolean> {
    const consent = await this.getConsent(identifier);
    return ConsentUtils.isDenied(consent);
  }

  async isUnknown(identifier: string): Promise<boolean> {
    const consent = await this.getConsent(identifier);
    return ConsentUtils.isUnknown(consent);
  }

  // Address validation utilities
  async refreshContactsFromNetwork(): Promise<ConsentEntry[]> {
    try {
      // This would typically sync with the network
      // For now, we'll return the current consent list
      return await this.getAllConsentEntries();
    } catch (error) {
      throw new ConsentError(
        `Failed to refresh contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  // Streaming consent updates
  async streamConsentUpdates(callback?: StreamCallback<ConsentEntry>): Promise<AsyncStream<ConsentEntry>> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Create a readable stream for consent updates
      const stream = new ReadableStream<ConsentEntry>({
        start(controller) {
          // Note: The actual XMTP Browser SDK may not have consent streaming
          // This is a placeholder implementation
          console.warn('[XMTP Contacts] Consent streaming not yet implemented in Browser SDK');
          
          // Close the stream immediately for now
          controller.close();
        },
      });

      const asyncStream = new AsyncStreamImpl(stream);
      
      if (callback) {
        this.subscriptionManager.subscribe(asyncStream, callback);
      }

      return asyncStream;
    } catch (error) {
      throw new ConsentError(
        `Failed to stream consent updates: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  // Search and filtering
  async searchContacts(query: string): Promise<ConsentEntry[]> {
    const allContacts = await this.getAllConsentEntries();
    const lowerQuery = query.toLowerCase();
    
    return allContacts.filter(entry =>
      entry.identifier.toLowerCase().includes(lowerQuery)
    );
  }

  async getContactsByState(state: ConsentState): Promise<ConsentEntry[]> {
    switch (state) {
      case 'Allowed':
        return await this.getAllowedList();
      case 'Denied':
        return await this.getDeniedList();
      case 'Unknown':
        return await this.getUnknownList();
      default:
        return [];
    }
  }

  // Statistics
  async getConsentStatistics(): Promise<{
    allowed: number;
    denied: number;
    unknown: number;
    total: number;
  }> {
    const [allowed, denied, unknown] = await Promise.all([
      this.getAllowedList(),
      this.getDeniedList(),
      this.getUnknownList(),
    ]);

    return {
      allowed: allowed.length,
      denied: denied.length,
      unknown: unknown.length,
      total: allowed.length + denied.length + unknown.length,
    };
  }

  // Export/Import
  async exportContacts(): Promise<{
    timestamp: string;
    entries: ConsentEntry[];
  }> {
    const entries = await this.getAllConsentEntries();
    
    return {
      timestamp: new Date().toISOString(),
      entries,
    };
  }

  async importContacts(data: {
    entries: ConsentEntry[];
  }): Promise<void> {
    try {
      // Group entries by consent state for efficient bulk operations
      const allowedEntries = data.entries
        .filter(entry => ConsentUtils.isAllowed(entry.permissionType))
        .map(entry => ({
          identifier: entry.identifier,
          identifierKind: entry.identifierKind,
        }));

      const deniedEntries = data.entries
        .filter(entry => ConsentUtils.isDenied(entry.permissionType))
        .map(entry => ({
          identifier: entry.identifier,
          identifierKind: entry.identifierKind,
        }));

      const unknownEntries = data.entries
        .filter(entry => ConsentUtils.isUnknown(entry.permissionType))
        .map(entry => ({
          identifier: entry.identifier,
          identifierKind: entry.identifierKind,
        }));

      // Apply consent states in batches
      if (allowedEntries.length > 0) {
        await this.setConsent(allowedEntries, 'Allowed');
      }
      
      if (deniedEntries.length > 0) {
        await this.setConsent(deniedEntries, 'Denied');
      }
      
      if (unknownEntries.length > 0) {
        await this.setConsent(unknownEntries, 'Unknown');
      }

      console.log(`[XMTP Contacts] Imported ${data.entries.length} consent entries`);
    } catch (error) {
      throw new ConsentError(
        `Failed to import contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.subscriptionManager.unsubscribeAll();
  }
}

export default Contacts;