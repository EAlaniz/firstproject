// XMTP Utilities - Mirror of official SDK
import type { 
  AsyncStream, 
  StreamCallback, 
  ConsentState,
  Signer,
  ContentTypeId,
  InstallationInfo,
  NetworkStatus
} from '../types';
import { ErrorHandler, XMTPBaseError } from '../errors';

// Stream Implementation
export class AsyncStreamImpl<T> implements AsyncStream<T> {
  private stopped = false;
  private controller?: ReadableStreamDefaultController<T>;
  private reader?: ReadableStreamDefaultReader<T>;

  constructor(private source: ReadableStream<T> | AsyncIterable<T>) {}

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    if (this.stopped) return;

    if ('getReader' in this.source) {
      // ReadableStream
      this.reader = this.source.getReader();
      try {
        while (!this.stopped) {
          const { done, value } = await this.reader.read();
          if (done) break;
          yield value;
        }
      } finally {
        this.reader?.releaseLock();
      }
    } else {
      // AsyncIterable
      for await (const value of this.source) {
        if (this.stopped) break;
        yield value;
      }
    }
  }

  stop(): void {
    this.stopped = true;
    this.reader?.cancel();
  }
}

// Subscription Manager
export class SubscriptionManager {
  private subscriptions = new Set<() => void>();

  subscribe<T>(stream: AsyncStream<T>, callback: StreamCallback<T>): () => void {
    let isActive = true;
    
    const unsubscribe = () => {
      isActive = false;
      stream.stop();
      this.subscriptions.delete(unsubscribe);
    };

    this.subscriptions.add(unsubscribe);

    // Start consuming the stream
    (async () => {
      try {
        for await (const value of stream) {
          if (!isActive) break;
          await callback(value);
        }
      } catch (error) {
        ErrorHandler.logError(
          error instanceof XMTPBaseError ? error : new XMTPBaseError('Stream error', 'STREAM_ERROR', error),
          'SubscriptionManager'
        );
      }
    })();

    return unsubscribe;
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

// Address Validation
export class AddressValidator {
  private static readonly ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
  private static readonly INBOX_ID_REGEX = /^[a-f0-9]{64}$/;

  static isValidEthereumAddress(address: string): boolean {
    return this.ETH_ADDRESS_REGEX.test(address);
  }

  static isValidInboxId(inboxId: string): boolean {
    return this.INBOX_ID_REGEX.test(inboxId);
  }

  static normalizeAddress(address: string): string {
    if (!this.isValidEthereumAddress(address)) {
      throw new Error(`Invalid Ethereum address: ${address}`);
    }
    return address.toLowerCase();
  }

  static validateAndNormalize(address: string): string {
    const normalized = address.toLowerCase().trim();
    if (!this.isValidEthereumAddress(normalized)) {
      throw new Error(`Invalid Ethereum address format: ${address}`);
    }
    return normalized;
  }
}

// Content Type Utilities
export class ContentTypeUtils {
  static equals(a: ContentTypeId, b: ContentTypeId): boolean {
    return (
      a.authorityId === b.authorityId &&
      a.typeId === b.typeId &&
      a.versionMajor === b.versionMajor &&
      a.versionMinor === b.versionMinor
    );
  }

  static toString(contentType: ContentTypeId): string {
    return `${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}`;
  }

  static fromString(contentTypeString: string): ContentTypeId | null {
    const match = contentTypeString.match(/^(.+)\/(.+):(\d+)\.(\d+)$/);
    if (!match) return null;

    return {
      authorityId: match[1],
      typeId: match[2],
      versionMajor: parseInt(match[3], 10),
      versionMinor: parseInt(match[4], 10),
    };
  }

  static isCompatible(required: ContentTypeId, available: ContentTypeId): boolean {
    return (
      required.authorityId === available.authorityId &&
      required.typeId === available.typeId &&
      required.versionMajor === available.versionMajor &&
      required.versionMinor <= available.versionMinor
    );
  }
}

// Consent Utilities
export class ConsentUtils {
  static isAllowed(state: ConsentState): boolean {
    return state === 'Allowed';
  }

  static isDenied(state: ConsentState): boolean {
    return state === 'Denied';
  }

  static isUnknown(state: ConsentState): boolean {
    return state === 'Unknown';
  }

  static fromString(value: string): ConsentState {
    switch (value.toLowerCase()) {
      case 'allowed':
        return 'Allowed';
      case 'denied':
        return 'Denied';
      default:
        return 'Unknown';
    }
  }

  static toString(state: ConsentState): string {
    return state.toLowerCase();
  }
}

// Signer Utilities
export class SignerUtils {
  static async validateSigner(signer: Signer): Promise<void> {
    try {
      const identifier = signer.getIdentifier();
      if (!identifier) {
        throw new Error('Signer must provide an identifier');
      }

      // Test signing capability
      const testMessage = 'XMTP signer validation';
      const signature = await signer.signMessage(testMessage);
      if (!signature || signature.length === 0) {
        throw new Error('Signer failed to produce a valid signature');
      }
    } catch (error) {
      throw new Error(`Invalid signer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async getSignerInfo(signer: Signer): Promise<{
    identifier: string;
    type: 'EOA' | 'SCW';
    chainId?: bigint;
    blockNumber?: bigint;
  }> {
    const identifier = signer.getIdentifier();
    const type = signer.type;
    
    let chainId: bigint | undefined;
    let blockNumber: bigint | undefined;

    try {
      if (signer.getChainId) {
        chainId = await signer.getChainId();
      }
    } catch (error) {
      console.warn('Failed to get chain ID from signer:', error);
    }

    try {
      if (signer.getBlockNumber) {
        blockNumber = await signer.getBlockNumber();
      }
    } catch (error) {
      console.warn('Failed to get block number from signer:', error);
    }

    return {
      identifier,
      type,
      chainId,
      blockNumber,
    };
  }
}

// Installation Utilities
export class InstallationUtils {
  static generateInstallationId(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateInstallationId(id: string): boolean {
    return /^[a-f0-9]{64}$/.test(id);
  }

  static formatInstallationInfo(installation: InstallationInfo): string {
    const status = installation.isActive ? 'Active' : 'Inactive';
    const created = installation.createdAt.toISOString();
    return `Installation ${installation.id} (${status}, created: ${created})`;
  }
}

// Network Utilities
export class NetworkUtils {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRIES = 3;

  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = this.DEFAULT_TIMEOUT
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      ),
    ]);
  }

  static async checkConnectivity(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD', 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return false;
    }
  }

  static getNetworkStatus(): NetworkStatus {
    return {
      isConnected: navigator.onLine,
      lastSeen: navigator.onLine ? new Date() : undefined,
      retryCount: 0,
    };
  }

  static async waitForConnection(
    maxWaitMs: number = 10000,
    checkIntervalMs: number = 1000
  ): Promise<boolean> {
    if (navigator.onLine) return true;

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkConnection = () => {
        if (navigator.onLine) {
          resolve(true);
          return;
        }
        
        if (Date.now() - startTime >= maxWaitMs) {
          resolve(false);
          return;
        }
        
        setTimeout(checkConnection, checkIntervalMs);
      };
      
      checkConnection();
    });
  }
}

// Database Utilities
export class DatabaseUtils {
  static async clearIndexedDB(databaseNames: string[]): Promise<void> {
    const promises = databaseNames.map(dbName => {
      return new Promise<void>((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => reject(deleteReq.error);
        deleteReq.onblocked = () => {
          console.warn(`Database ${dbName} delete blocked, continuing...`);
          setTimeout(resolve, 2000);
        };
      });
    });

    await Promise.allSettled(promises);
  }

  static clearStorage(keyPrefixes: string[]): void {
    // Clear localStorage
    const localKeysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && keyPrefixes.some(prefix => key.startsWith(prefix))) {
        localKeysToRemove.push(key);
      }
    }
    localKeysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && keyPrefixes.some(prefix => key.startsWith(prefix))) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  static async clearXMTPData(address: string): Promise<void> {
    // Database names to clear
    const databaseNames = [
      `xmtp-${address}`,
      `xmtp-${address.toLowerCase()}`,
      'xmtp-encrypted-store',
      'xmtp-cache',
      'xmtp-wasm-cache',
    ];

    // Storage key prefixes to clear
    const keyPrefixes = ['xmtp-', 'xmtp_'];

    await Promise.all([
      this.clearIndexedDB(databaseNames),
      this.clearStorage(keyPrefixes),
    ]);
  }
}

// Performance Utilities
export class PerformanceUtils {
  private static measurements = new Map<string, number>();

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasurement(name: string): number | undefined {
    const startTime = this.measurements.get(name);
    if (startTime === undefined) return undefined;

    const duration = performance.now() - startTime;
    this.measurements.delete(name);
    return duration;
  }

  static async measureAsync<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startMeasurement(name);
    try {
      const result = await operation();
      const duration = this.endMeasurement(name) || 0;
      return { result, duration };
    } catch (error) {
      this.endMeasurement(name);
      throw error;
    }
  }

  static logPerformance(name: string, duration: number): void {
    console.debug(`[XMTP Performance] ${name}: ${duration.toFixed(2)}ms`);
  }
}

// Browser Compatibility
export class BrowserUtils {
  static supportsOPFS(): boolean {
    return 'navigator' in globalThis && 'storage' in navigator && 'getDirectory' in navigator.storage;
  }

  static supportsIndexedDB(): boolean {
    return 'indexedDB' in globalThis;
  }

  static supportsWebAssembly(): boolean {
    return 'WebAssembly' in globalThis;
  }

  static supportsWorkers(): boolean {
    return 'Worker' in globalThis;
  }

  static checkCompatibility(): {
    isSupported: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    if (!this.supportsIndexedDB()) {
      missing.push('IndexedDB');
    }

    if (!this.supportsWebAssembly()) {
      missing.push('WebAssembly');
    }

    if (!this.supportsOPFS()) {
      missing.push('Origin Private File System (OPFS)');
    }

    return {
      isSupported: missing.length === 0,
      missing,
    };
  }
}

// Export all utilities
export {
  AsyncStreamImpl as AsyncStream,
  SubscriptionManager,
  AddressValidator,
  ContentTypeUtils,
  ConsentUtils,
  SignerUtils,
  InstallationUtils,
  NetworkUtils,
  DatabaseUtils,
  PerformanceUtils,
  BrowserUtils,
};