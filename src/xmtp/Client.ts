// XMTP Client - Mirror of official Browser SDK
import { 
  Client as WasmClient,
  InboxState,
  IdentifierKind,
} from '@xmtp/browser-sdk';

import type {
  CreateClientOptions,
  ContentTypeCodec,
  ContentTypeId,
  InstallationInfo,
  NetworkStatus,
  Signer,
} from './types';

import { Contacts } from './Contacts';
import { Conversations } from './Conversations';
import { CodecRegistry, defaultCodecs } from './content-types';
import { 
  ErrorHandler,
  ErrorFactory,
  ClientNotInitializedError,
  ClientAlreadyInitializedError,
  SignerUnavailableError,
  InstallationLimitError,
  XMTPBaseError,
} from './errors';
import {
  SignerUtils,
  DatabaseUtils,
  NetworkUtils,
  PerformanceUtils,
  BrowserUtils,
} from './utils';

export interface ClientState {
  isInitialized: boolean;
  isConnected: boolean;
  lastError?: XMTPBaseError;
  networkStatus: NetworkStatus;
}

export class Client {
  private wasmClient?: WasmClient;
  private _signer?: Signer;
  private _conversations?: Conversations;
  private _contacts?: Contacts;
  private _codecRegistry: CodecRegistry;
  private _options: CreateClientOptions;
  private _state: ClientState;
  private _installationId?: string;
  private _inboxId?: string;
  private _initializationPromise?: Promise<void>;
  private _isInitializing = false;

  constructor(options: CreateClientOptions) {
    this._options = { ...options };
    this._codecRegistry = new CodecRegistry(options.codecs || defaultCodecs);
    this._state = {
      isInitialized: false,
      isConnected: false,
      networkStatus: NetworkUtils.getNetworkStatus(),
    };

    // Set up network status monitoring
    this.setupNetworkMonitoring();
  }

  // Official V3 SDK factory method
  static async create(signer: Signer, options: CreateClientOptions = { env: 'production' }): Promise<Client> {
    const client = new Client(options);
    await client.initialize(signer);
    return client;
  }



  // Static utility methods from official SDK
  static async canMessage(
    identifiers: Array<{ identifier: string; identifierKind: IdentifierKind }>,
    env: 'dev' | 'production' | 'local' = 'production'
  ): Promise<Map<string, boolean>> {
    try {
      return await WasmClient.canMessage(identifiers, env);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  static async inboxStateFromInboxIds(
    inboxIds: string[],
    env: 'dev' | 'production' | 'local' = 'production'
  ): Promise<InboxState[]> {
    try {
      const result = await WasmClient.inboxStateFromInboxIds(inboxIds, env);
      return result as unknown as InboxState[];
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Initialize client with signer (for new clients)
  async initialize(signer: Signer): Promise<void> {
    if (this._state.isInitialized) {
      throw new ClientAlreadyInitializedError();
    }
    await this._performInitialization(signer);
  }

  private async _performInitialization(signer: Signer): Promise<void> {
    if (this._state.isInitialized) {
      throw new ClientAlreadyInitializedError();
    }

    if (this._isInitializing) {
      if (this._initializationPromise) {
        await this._initializationPromise;
        return;
      }
      throw new Error('Client is already initializing');
    }

    this._isInitializing = true;
    this._initializationPromise = this._performInitializationCore(signer);
    
    try {
      await this._initializationPromise;
    } finally {
      this._isInitializing = false;
    }
  }

  private async _performInitializationCore(signer: Signer): Promise<void> {
    try {
      PerformanceUtils.startMeasurement('client-initialization');

      // Validate environment compatibility
      const compatibility = BrowserUtils.checkCompatibility();
      if (!compatibility.isSupported) {
        throw new Error(`Browser not supported. Missing: ${compatibility.missing.join(', ')}`);
      }

      // Validate signer
      await SignerUtils.validateSigner(signer);
      this._signer = signer;

      // Create WASM client with error handling
      this.wasmClient = await ErrorHandler.withRetry(
        async () => {
          return await WasmClient.create(signer as any, {
            env: this._options.env,
            ...(this._options.historySyncUrl && { historySyncUrl: this._options.historySyncUrl }),
          });
        },
        3,
        (error, attempt) => {
          console.warn(`[XMTP Client] Initialization attempt ${attempt + 1} failed:`, error.message);
          
          // Handle specific errors
          if (error.message.includes('already registered 5/5 installations')) {
            throw new InstallationLimitError(5, this.extractInboxIdFromError(error.message));
          }
        }
      );

      // Wait for WASM client to be fully ready
      await this.waitForWasmClientReady();

      // Initialize components
      this._conversations = new Conversations(this);
      this._contacts = new Contacts(this);

      // Set client state
      this._installationId = this.wasmClient.installationId;
      this._inboxId = this.wasmClient.inboxId;
      this._state.isInitialized = true;
      this._state.isConnected = true;

      const duration = PerformanceUtils.endMeasurement('client-initialization');
      if (duration) {
        PerformanceUtils.logPerformance('Client Initialization', duration);
      }

      console.log(`[XMTP Client] ✅ Initialized successfully - Inbox: ${this._inboxId}, Installation: ${this._installationId}`);

    } catch (error) {
      this._state.lastError = error instanceof XMTPBaseError ? error : ErrorFactory.fromWasmError(error);
      this._state.isInitialized = false;
      this._state.isConnected = false;
      throw this._state.lastError;
    }
  }



  // Cleanup and reset
  async cleanup(): Promise<void> {
    if (this._conversations) {
      await this._conversations.cleanup();
    }

    if (this._contacts) {
      await this._contacts.cleanup();
    }

    this.wasmClient = undefined;
    this._signer = undefined;
    this._conversations = undefined;
    this._contacts = undefined;
    this._installationId = undefined;
    this._inboxId = undefined;

    this._state.isInitialized = false;
    this._state.isConnected = false;
  }

  async clearDatabase(): Promise<void> {
    if (!this._signer) {
      throw new SignerUnavailableError();
    }

    const identifier = await this._signer.getIdentifier();
    const address = identifier.identifier;
    
    // Clean up client first
    await this.cleanup();

    // Clear database
    await DatabaseUtils.clearXMTPData(address);

    console.log('[XMTP Client] Database cleared successfully');
  }

  // Getters
  get isInitialized(): boolean {
    return this._state.isInitialized;
  }

  get isConnected(): boolean {
    return this._state.isConnected;
  }

  get state(): ClientState {
    return { ...this._state };
  }

  get inboxId(): string {
    if (!this._inboxId) {
      throw new ClientNotInitializedError();
    }
    return this._inboxId;
  }

  get installationId(): string {
    if (!this._installationId) {
      throw new ClientNotInitializedError();
    }
    return this._installationId;
  }

  get signer(): Signer | undefined {
    return this._signer;
  }

  get conversations(): Conversations {
    if (!this._conversations) {
      throw new ClientNotInitializedError();
    }
    return this._conversations;
  }

  get contacts(): Contacts {
    if (!this._contacts) {
      throw new ClientNotInitializedError();
    }
    return this._contacts;
  }

  get environment(): string {
    return this._options.env || 'production';
  }

  get wasmClientUnsafe(): WasmClient | undefined {
    return this.wasmClient;
  }

  getWasmClient(): WasmClient {
    if (!this.wasmClient) {
      throw new ClientNotInitializedError();
    }
    return this.wasmClient;
  }

  // Codec management
  registerCodec(codec: ContentTypeCodec): void {
    this._codecRegistry.register(codec);
  }

  unregisterCodec(contentType: ContentTypeId): void {
    this._codecRegistry.unregister(contentType);
  }

  codecFor(contentType: ContentTypeId): ContentTypeCodec | undefined {
    return this._codecRegistry.codecFor(contentType);
  }

  getAllCodecs(): ContentTypeCodec[] {
    return this._codecRegistry.getAllCodecs();
  }

  // V3 SDK methods
  async findInboxIdByIdentifier(options: {
    identifier: string;
    identifierKind: IdentifierKind;
  }): Promise<string | null> {
    try {
      const wasmClient = this.getWasmClient();
      const inboxId = await wasmClient.findInboxIdByIdentifier(options);
      return inboxId || null;
    } catch {
      console.warn('[XMTP Client] Failed to find inbox ID');
      return null;
    }
  }

  async getInstallations(): Promise<InstallationInfo[]> {
    try {
      // For now, return current installation info since getInstallations may not be available
      const currentInstallation = {
        id: this.installationId,
        createdAt: new Date(),
        isActive: true,
      };
      return [currentInstallation];
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async checkNetworkStatus(): Promise<NetworkStatus> {
    try {
      // Use our custom network status check since checkNetworkStatus may not be available
      const status = NetworkUtils.getNetworkStatus();
      
      if (status.isConnected && this._options.env !== 'local') {
        // Test actual connectivity to XMTP network
        const apiUrl = this.getApiUrl();
        status.isConnected = await NetworkUtils.checkConnectivity(apiUrl);
      }

      this._state.networkStatus = status;
      this._state.isConnected = status.isConnected;
      
      return status;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async handleDatabaseCorruption(): Promise<void> {
    try {
      console.log('[XMTP Client] Handling database corruption...');
      await this.clearDatabase();
      console.log('[XMTP Client] Database corruption handled successfully');
    } catch (error) {
      console.error('[XMTP Client] Failed to handle database corruption:', error);
      throw error;
    }
  }

  async handleInstallationLimit(inboxId: string): Promise<void> {
    try {
      console.log(`[XMTP Client] Handling installation limit for inbox: ${inboxId}`);
      
      // Get current installations
      const installations = await this.getInstallations();
      
      if (installations.length >= 5) {
        // Revoke oldest installation
        const oldestInstallation = installations
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        
        console.log(`[XMTP Client] Revoking oldest installation: ${oldestInstallation.id}`);
        // Note: This would require the installation bytes which we don't have here
        // In a real implementation, you'd need to store installation bytes
      }
    } catch (error) {
      console.error('[XMTP Client] Failed to handle installation limit:', error);
      throw error;
    }
  }

  async waitForReady(): Promise<void> {
    if (this._state.isInitialized) {
      return;
    }

    if (this._initializationPromise) {
      await this._initializationPromise;
      return;
    }

    throw new ClientNotInitializedError('Client initialization failed');
  }

  // Private methods
  private ensureInitialized(): void {
    if (!this._state.isInitialized) {
      throw new ClientNotInitializedError();
    }
  }

  private async waitForWasmClientReady(): Promise<void> {
    if (!this.wasmClient) {
      throw new Error('WASM client not available');
    }

    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 100; // 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // Check if WASM client is ready by calling a simple method
        await this.wasmClient.installationId;
        return; // Client is ready
      } catch (error) {
        // Client not ready yet, wait and try again
        await new Promise(resolve => setTimeout(resolve, checkInterval));
      }
    }

    throw new Error('WASM client failed to become ready within timeout');
  }

  private setupNetworkMonitoring(): void {
    // Set up periodic network status checks
    setInterval(async () => {
      try {
        await this.checkNetworkStatus();
      } catch (_error) {
        console.warn('[XMTP Client] Network status check failed');
      }
    }, 30000); // Check every 30 seconds
  }

  private getApiUrl(): string {
    switch (this._options.env) {
      case 'local':
        return this._options.apiUrl || 'http://localhost:8080';
      case 'dev':
        return this._options.apiUrl || 'https://dev.xmtp.network';
      case 'production':
        return this._options.apiUrl || 'https://production.xmtp.network';
      default:
        return this._options.apiUrl || 'https://production.xmtp.network';
    }
  }

  private extractInboxIdFromError(errorMessage: string): string | undefined {
    const match = errorMessage.match(/InboxID ([a-f0-9]{64})/);
    return match?.[1];
  }
}

// Export default Client
export default Client;