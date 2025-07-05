// XMTP Client - Mirror of official Browser SDK
import { 
  Client as WasmClient,
  InboxState,
} from '@xmtp/browser-sdk';

import type {
  Signer,
  CreateClientOptions,
  ContentTypeCodec,
  ContentTypeId,
  InstallationInfo,
  NetworkStatus,
} from './types';

import { Conversations } from './Conversations';
import { Contacts } from './Contacts';
import { CodecRegistry, defaultCodecs } from './content-types';
import { 
  ErrorFactory,
  ErrorHandler,
  ClientNotInitializedError,
  ClientAlreadyInitializedError,
  SignerUnavailableError,
  InstallationLimitError,
  XMTPBaseError,
} from './errors';
import {
  SignerUtils,
  AddressValidator,
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

  // Static factory methods
  static async create(signer: Signer, options: CreateClientOptions = { env: 'production' }): Promise<Client> {
    const client = new Client(options);
    await client.initialize(signer);
    return client;
  }

  // Create client with initialization promise pattern
  static createWithPromise(signer: Signer, options: CreateClientOptions = { env: 'production' }): { client: Client; ready: Promise<void> } {
    const client = new Client(options);
    const ready = client.initialize(signer);
    return { client, ready };
  }

  static async build(signer: Signer, options: CreateClientOptions = { env: 'production' }): Promise<Client> {
    return this.create(signer, options);
  }

  // Static utility methods
  static async canMessage(
    identifiers: Array<{ identifier: string; identifierKind: 'Ethereum' | 'Address' }>,
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
      return await WasmClient.inboxStateFromInboxIds(inboxIds, env);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  static async revokeInstallations(
    signer: Signer,
    inboxId: string,
    installationBytes: Uint8Array[],
    env: 'dev' | 'production' | 'local' = 'production'
  ): Promise<void> {
    try {
      await SignerUtils.validateSigner(signer);
      await WasmClient.revokeInstallations(signer, inboxId, installationBytes, env);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Initialization
  async initialize(signer: Signer): Promise<void> {
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
    this._initializationPromise = this._performInitialization(signer);
    
    try {
      await this._initializationPromise;
    } finally {
      this._isInitializing = false;
    }
  }

  private async _performInitialization(signer: Signer): Promise<void> {

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
          return await WasmClient.create(signer, {
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

    const address = await this._signer.getIdentifier();
    
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
    this.ensureInitialized();
    return this._inboxId!;
  }

  get installationId(): string {
    this.ensureInitialized();
    return this._installationId!;
  }

  get signer(): Signer | undefined {
    return this._signer;
  }

  get conversations(): Conversations {
    this.ensureInitialized();
    return this._conversations!;
  }

  get contacts(): Contacts {
    this.ensureInitialized();
    return this._contacts!;
  }

  get environment(): string {
    return this._options.env;
  }

  // Internal WASM client access
  get wasmClientUnsafe(): WasmClient | undefined {
    return this.wasmClient;
  }

  getWasmClient(): WasmClient {
    this.ensureInitialized();
    if (!this.wasmClient) {
      throw new ClientNotInitializedError();
    }
    return this.wasmClient;
  }

  // Content type management
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

  // Address and inbox utilities
  async findInboxIdByIdentifier(options: {
    identifier: string;
    identifierKind: 'Ethereum' | 'Address';
  }): Promise<string | null> {
    this.ensureInitialized();
    
    try {
      // Validate address format
      if (options.identifierKind === 'Ethereum') {
        AddressValidator.validateAndNormalize(options.identifier);
      }

      return await this.getWasmClient().findInboxIdByIdentifier(options);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Installation management
  async getInstallations(): Promise<InstallationInfo[]> {
    this.ensureInitialized();
    
    try {
      // Note: installations() method may not be available in all SDK versions
      // Using installationId as fallback
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

  // Network status
  async checkNetworkStatus(): Promise<NetworkStatus> {
    const status = NetworkUtils.getNetworkStatus();
    
    if (status.isConnected && this._options.env !== 'local') {
      // Test actual connectivity to XMTP network
      const apiUrl = this.getApiUrl();
      status.isConnected = await NetworkUtils.checkConnectivity(apiUrl);
    }

    this._state.networkStatus = status;
    this._state.isConnected = status.isConnected;
    
    return status;
  }

  // Error recovery
  async handleDatabaseCorruption(): Promise<void> {
    console.warn('[XMTP Client] Handling database corruption...');
    
    try {
      await this.clearDatabase();
      
      if (this._signer) {
        await this.initialize(this._signer);
      }
      
      console.log('[XMTP Client] Recovery from database corruption successful');
    } catch (error) {
      const xmtpError = error instanceof XMTPBaseError ? error : ErrorFactory.fromWasmError(error);
      this._state.lastError = xmtpError;
      throw xmtpError;
    }
  }

  async handleInstallationLimit(inboxId: string): Promise<void> {
    console.warn('[XMTP Client] Handling installation limit...');
    
    if (!this._signer) {
      throw new SignerUnavailableError();
    }

    try {
      // Get inbox state and revoke all installations
      const inboxStates = await Client.inboxStateFromInboxIds([inboxId], this._options.env);
      
      if (inboxStates.length === 0) {
        throw new Error('No inbox state found');
      }

      const installationBytes = inboxStates[0].installations.map(i => i.bytes);
      
      if (installationBytes.length > 0) {
        await Client.revokeInstallations(this._signer, inboxId, installationBytes, this._options.env);
        console.log('[XMTP Client] Installation revocation successful');
      }

      // Clear database and reinitialize
      await this.clearDatabase();
      await this.initialize(this._signer);
      
      console.log('[XMTP Client] Recovery from installation limit successful');
    } catch (error) {
      const xmtpError = error instanceof XMTPBaseError ? error : ErrorFactory.fromWasmError(error);
      this._state.lastError = xmtpError;
      throw xmtpError;
    }
  }

  // Wait for initialization to complete
  async waitForReady(): Promise<void> {
    if (this._state.isInitialized) {
      return;
    }

    if (this._initializationPromise) {
      await this._initializationPromise;
      return;
    }

    if (this._isInitializing) {
      // Poll for initialization completion
      while (this._isInitializing && !this._state.isInitialized) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (!this._state.isInitialized) {
        throw new ClientNotInitializedError('Client initialization failed');
      }
      return;
    }

    throw new ClientNotInitializedError('Client is not initialized and no initialization in progress');
  }

  // Private methods
  private ensureInitialized(): void {
    if (!this._state.isInitialized || !this.wasmClient) {
      throw new ClientNotInitializedError();
    }
  }

  private async waitForWasmClientReady(): Promise<void> {
    if (!this.wasmClient) {
      throw new Error('WASM client not available');
    }

    // Wait for WASM client to have required properties
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    while (attempts < maxAttempts) {
      try {
        // Test if the client is ready by accessing required properties
        if (this.wasmClient.installationId && this.wasmClient.inboxId) {
          // Additional ready check - try to access conversations
          await this.wasmClient.conversations.sync();
          return;
        }
      } catch (error) {
        // Client not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    throw new Error('WASM client failed to become ready within timeout');
  }

  private setupNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._state.networkStatus.isConnected = true;
        this._state.networkStatus.lastSeen = new Date();
        this._state.isConnected = true;
      });

      window.addEventListener('offline', () => {
        this._state.networkStatus.isConnected = false;
        this._state.isConnected = false;
      });
    }
  }

  private getApiUrl(): string {
    switch (this._options.env) {
      case 'production':
        return 'https://grpc.production.xmtp.network';
      case 'dev':
        return 'https://grpc.dev.xmtp.network';
      case 'local':
        return 'http://localhost:5556';
      default:
        return 'https://grpc.production.xmtp.network';
    }
  }

  private extractInboxIdFromError(errorMessage: string): string | undefined {
    const match = errorMessage.match(/InboxID ([a-f0-9]{64})/);
    return match?.[1];
  }
}

// Export default Client
export default Client;