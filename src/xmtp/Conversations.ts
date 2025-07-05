// XMTP Conversations - Mirror of official Browser SDK
// Remove unused import
import type { 
  DecodedMessage, 
  SendOptions, 
  StreamOptions, 
  StreamCallback,
  AsyncStream,
  ListOptions,
  ConversationMetadata,
} from './types';
import { Client } from './Client';
import { ErrorFactory } from './errors';
import { PerformanceUtils } from './utils';

// Simple conversation wrapper for V3 SDK compatibility
class ConversationWrapper {
  private _client: Client;
  private _wasmConversation: unknown;

  constructor(client: Client, wasmConversation: unknown) {
    this._client = client;
    this._wasmConversation = wasmConversation;
  }

  get id(): string {
    return (this._wasmConversation as { id: string }).id;
  }

  get topic(): string {
    const conv = this._wasmConversation as { topic?: string; id: string };
    return conv.topic || conv.id;
  }

  get conversationType(): string {
    return (this._wasmConversation as { conversationType: string }).conversationType;
  }

  get createdAt(): Date {
    return new Date((this._wasmConversation as { createdNs: number }).createdNs / 1000000);
  }

  get isActive(): boolean {
    return (this._wasmConversation as { isActive: boolean }).isActive;
  }

  async send(content: any, options?: SendOptions): Promise<string> {
    return await (this._wasmConversation as { send: (content: any, options?: SendOptions) => Promise<string> }).send(content, options);
  }

  async messages(options?: ListOptions): Promise<DecodedMessage[]> {
    const wasmMessages = await (this._wasmConversation as { messages: (options?: ListOptions) => Promise<any[]> }).messages(options);
    return wasmMessages.map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderInboxId: msg.senderInboxId,
      sentAt: new Date(msg.sentNs / 1000000),
      contentType: msg.contentType,
      content: msg.content,
      fallback: msg.fallback,
      deliveryStatus: msg.deliveryStatus,
      kind: msg.kind,
    }));
  }

  async streamMessages(_callback?: StreamCallback<DecodedMessage>): Promise<AsyncStream<DecodedMessage>> {
    // For now, return an empty stream to avoid API compatibility issues
    const stream: AsyncStream<DecodedMessage> = {
      [Symbol.asyncIterator](): AsyncIterator<DecodedMessage> {
        return {
          next(): Promise<IteratorResult<DecodedMessage>> {
            return Promise.resolve({ done: true, value: undefined });
          }
        };
      },
      stop: () => {
        // No cleanup needed for empty stream
      },
    };

    return stream;
  }

  async sync(): Promise<void> {
    await (this._wasmConversation as { sync: () => Promise<void> }).sync();
  }
}

export class Conversations {
  private _client: Client;
  private _activeStreams: Set<AsyncStream<any>> = new Set();

  constructor(client: Client) {
    this._client = client;
  }

  // V3 SDK Methods - Using official XMTP browser-sdk API with type assertions
  async newConversation(
    peerAddress: string,
    context?: { conversationId?: string; metadata?: ConversationMetadata }
  ): Promise<ConversationWrapper> {
    try {
      PerformanceUtils.startMeasurement('new-conversation');

      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmConversation = await (wasmClient.conversations as any).newConversation(
        peerAddress,
        context
      );

      const conversation = new ConversationWrapper(this._client, wasmConversation);
      
      const duration = PerformanceUtils.endMeasurement('new-conversation');
      if (duration) {
        PerformanceUtils.logPerformance('New Conversation', duration);
      }

      return conversation;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async listConversations(options?: ListOptions): Promise<ConversationWrapper[]> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmConversations = await (wasmClient.conversations as any).list(options);
      
      return wasmConversations.map((wasmConv: any) => 
        new ConversationWrapper(this._client, wasmConv)
      );
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async listMessages(
    conversationId: string,
    options?: ListOptions
  ): Promise<DecodedMessage[]> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmMessages = await (wasmClient.conversations as any).listMessages(conversationId, options);
      
      return wasmMessages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderInboxId: msg.senderInboxId,
        sentAt: new Date(msg.sentNs / 1000000),
        contentType: msg.contentType,
        content: msg.content,
        fallback: msg.fallback,
        deliveryStatus: msg.deliveryStatus,
        kind: msg.kind,
      }));
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async sendMessage(
    conversationId: string,
    content: any,
    options?: SendOptions
  ): Promise<DecodedMessage> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmMessage = await (wasmClient.conversations as any).sendMessage(
        conversationId,
        content,
        options
      );

      return {
        id: wasmMessage.id,
        conversationId: wasmMessage.conversationId,
        senderInboxId: wasmMessage.senderInboxId,
        sentAt: new Date(wasmMessage.sentNs / 1000000),
        contentType: wasmMessage.contentType,
        content: wasmMessage.content,
        fallback: wasmMessage.fallback,
        deliveryStatus: wasmMessage.deliveryStatus,
        kind: wasmMessage.kind,
      };
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Streaming methods using type assertions for SDK compatibility
  async streamConversations(
    callback: StreamCallback<ConversationWrapper>,
    options?: StreamOptions
  ): Promise<AsyncStream<ConversationWrapper>> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmStream = await (wasmClient.conversations as any).stream(callback, options);
      
      const stream: AsyncStream<ConversationWrapper> = {
        [Symbol.asyncIterator](): AsyncIterator<ConversationWrapper> {
          return {
            next(): Promise<IteratorResult<ConversationWrapper>> {
              return Promise.resolve({ done: true, value: undefined });
            }
          };
        },
        stop: () => {
          (wasmStream as any).stop();
          this._activeStreams.delete(stream);
        },
      };

      this._activeStreams.add(stream);
      return stream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async streamMessages(
    conversationId: string,
    callback: StreamCallback<DecodedMessage>,
    options?: StreamOptions
  ): Promise<AsyncStream<DecodedMessage>> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      const wasmStream = await (wasmClient.conversations as any).streamAllMessages(conversationId, callback, options);
      
      const stream: AsyncStream<DecodedMessage> = {
        [Symbol.asyncIterator](): AsyncIterator<DecodedMessage> {
          return {
            next(): Promise<IteratorResult<DecodedMessage>> {
              return Promise.resolve({ done: true, value: undefined });
            }
          };
        },
        stop: () => {
          (wasmStream as any).stop();
          this._activeStreams.delete(stream);
        },
      };

      this._activeStreams.add(stream);
      return stream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async sync(): Promise<void> {
    try {
      const wasmClient = this._client.getWasmClient();
      // Use type assertion to access the actual SDK methods
      await (wasmClient.conversations as any).sync();
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Utility methods
  async getConversation(conversationId: string): Promise<ConversationWrapper | null> {
    try {
      const conversations = await this.listConversations();
      return conversations.find(conv => conv.topic === conversationId) || null;
    } catch (error) {
      console.warn('[XMTP Conversations] Failed to get conversation:', error);
      return null;
    }
  }

  async canMessage(peerAddress: string): Promise<boolean> {
    try {
      const canMessageMap = await Client.canMessage(
        [{ identifier: peerAddress, identifierKind: 'Ethereum' }],
        this._client.environment as any
      );
      return canMessageMap.get(peerAddress) || false;
    } catch (error) {
      console.warn('[XMTP Conversations] Failed to check if can message:', error);
      return false;
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Stop all active streams
    for (const stream of this._activeStreams) {
      try {
        stream.stop();
      } catch (error) {
        console.warn('[XMTP Conversations] Failed to stop stream:', error);
      }
    }
    this._activeStreams.clear();
  }

  // Getters
  get client(): Client {
    return this._client;
  }
}