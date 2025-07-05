// XMTP Conversation Base Class - Mirror of official Browser SDK
import type {
  ConversationType,
  Dm as WasmDm,
  Group as WasmGroup,
} from '@xmtp/browser-sdk';

import type {
  DecodedMessage,
  SendOptions,
  MessageListOptions,
  AsyncStream,
  StreamCallback,
  ConversationMetadata,
} from './types';
import type { Client } from './Client';
import {
  ErrorFactory,
  MessageSendError,
  MessageNotFoundError,
  UnsupportedContentTypeError,
  MessageEncodeError,
} from './errors';
import {
  AsyncStreamImpl,
  SubscriptionManager,
  PerformanceUtils,
  ContentTypeUtils,
} from './utils';
import { ContentTypes, TextContent } from './content-types';

export abstract class Conversation {
  protected wasmConversation: WasmDm | WasmGroup;
  protected client: Client;
  protected subscriptionManager = new SubscriptionManager();

  constructor(wasmConversation: WasmDm | WasmGroup, client: Client) {
    this.wasmConversation = wasmConversation;
    this.client = client;
  }

  // Basic properties
  get id(): string {
    return this.wasmConversation.id;
  }

  get createdAt(): Date {
    return new Date((this.wasmConversation as { createdNs: number }).createdNs / 1000000); // Convert from nanoseconds
  }

  get conversationType(): ConversationType {
    return this.wasmConversation.conversationType;
  }

  get isActive(): boolean {
    return this.wasmConversation.isActive;
  }

  // Abstract methods to be implemented by subclasses
  abstract get name(): string | undefined;
  abstract get description(): string | undefined;

  // Sync operations
  async sync(): Promise<void> {
    try {
      await this.wasmConversation.sync();
      console.log(`[XMTP Conversation] Synced conversation: ${this.id}`);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Message operations
  async send<T = unknown>(
    content: T,
    options: SendOptions = {}
  ): Promise<string> {
    try {
      PerformanceUtils.startMeasurement(`send-message-${this.id}`);
      
      let encodedContent: Uint8Array;
      let contentType = options.contentType;

      if (!contentType) {
        // Default to text content type
        contentType = ContentTypes.Text;
        
        // Ensure content is in text format
        if (typeof content === 'string') {
          content = { text: content } as T;
        }
      }

      // Find codec for content type
      const codec = this.client.codecFor(contentType);
      if (!codec) {
        throw new UnsupportedContentTypeError(ContentTypeUtils.toString(contentType));
      }

      try {
        encodedContent = codec.encode(content);
      } catch (error) {
        throw new MessageEncodeError(
          `Failed to encode content: ${error instanceof Error ? error.message : 'Unknown error'}`,
          { contentType, content, originalError: error }
        );
      }

      // Send the message
      const messageId = await this.wasmConversation.send(encodedContent, contentType);
      
      const duration = PerformanceUtils.endMeasurement(`send-message-${this.id}`);
      if (duration) {
        PerformanceUtils.logPerformance('Send Message', duration);
      }

      console.log(`[XMTP Conversation] Message sent: ${messageId}`);
      return messageId;
    } catch (error) {
      if (error instanceof MessageEncodeError || error instanceof UnsupportedContentTypeError) {
        throw error;
      }
      throw new MessageSendError(
        `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { content, options, originalError: error }
      );
    }
  }

  // Convenience method for sending text
  async sendText(text: string): Promise<string> {
    return this.send({ text } as TextContent, {
      contentType: ContentTypes.Text,
    });
  }

  // Message retrieval
  async messages(options: MessageListOptions = {}): Promise<DecodedMessage[]> {
    try {
      PerformanceUtils.startMeasurement(`load-messages-${this.id}`);
      
      // Sync before loading messages
      await this.sync();
      
      const wasmMessages = await this.wasmConversation.messages({
        ...(options.limit && { limit: BigInt(options.limit) }),
        ...(options.order && { order: options.order }),
        ...(options.deliveryStatus && { deliveryStatus: options.deliveryStatus }),
      });

      // Process messages with content decoding
      const messages = wasmMessages.map(msg => this.processMessage(msg));
      
      const duration = PerformanceUtils.endMeasurement(`load-messages-${this.id}`);
      if (duration) {
        PerformanceUtils.logPerformance('Load Messages', duration);
      }

      console.log(`[XMTP Conversation] Loaded ${messages.length} messages`);
      return messages;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async findMessage(messageId: string): Promise<DecodedMessage | null> {
    try {
      const wasmMessage = await this.wasmConversation.findMessage(messageId);
      return wasmMessage ? this.processMessage(wasmMessage) : null;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async getMessage(messageId: string): Promise<DecodedMessage> {
    const message = await this.findMessage(messageId);
    if (!message) {
      throw new MessageNotFoundError(messageId);
    }
    return message;
  }

  // Message streaming
  async streamMessages(
    callback?: StreamCallback<DecodedMessage>
  ): Promise<AsyncStream<DecodedMessage>> {
    try {
      // Sync before streaming
      await this.sync();
      
      const wasmStream = await this.wasmConversation.streamMessages();
      
      // Transform the WASM stream
      const transformedStream = new ReadableStream<DecodedMessage>({
        async start(controller) {
          try {
            for await (const wasmMessage of wasmStream) {
              // Filter own messages
              if (wasmMessage.senderInboxId === this.client.inboxId) {
                continue;
              }
              
              const message = this.processMessage(wasmMessage);
              controller.enqueue(message);
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      const asyncStream = new AsyncStreamImpl(transformedStream);
      
      if (callback) {
        this.subscriptionManager.subscribe(asyncStream, callback);
      }

      console.log(`[XMTP Conversation] Started streaming messages for: ${this.id}`);
      return asyncStream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Message processing with content decoding
  protected processMessage(wasmMessage: unknown): DecodedMessage {
    try {
      // Try to decode the message content
      const codec = this.client.codecFor(wasmMessage.contentType);
      let decodedContent = wasmMessage.content;
      
      if (codec) {
        try {
          decodedContent = codec.decode(wasmMessage.content);
        } catch (decodeError) {
          console.warn(`[XMTP Conversation] Failed to decode message content:`, decodeError);
          // Use fallback if available
          if (codec.fallback) {
            decodedContent = codec.fallback(wasmMessage.content);
          }
        }
      }

      return {
        id: wasmMessage.id,
        conversationId: this.id,
        senderInboxId: wasmMessage.senderInboxId,
        sentAt: new Date((wasmMessage as { sentAtNs: number }).sentAtNs / 1000000), // Convert from nanoseconds
        contentType: wasmMessage.contentType,
        content: decodedContent,
        fallback: wasmMessage.fallback,
        deliveryStatus: wasmMessage.deliveryStatus,
        kind: wasmMessage.kind,
      };
    } catch (error) {
      console.error(`[XMTP Conversation] Error processing message:`, error);
      
      // Return raw message as fallback
      return {
        id: wasmMessage.id || 'unknown',
        conversationId: this.id,
        senderInboxId: wasmMessage.senderInboxId || 'unknown',
        sentAt: new Date(),
        contentType: wasmMessage.contentType || ContentTypes.Text,
        content: wasmMessage.fallback || 'Error loading message',
        fallback: wasmMessage.fallback,
        deliveryStatus: wasmMessage.deliveryStatus || 'UNKNOWN',
        kind: wasmMessage.kind || 'APPLICATION',
      };
    }
  }

  // Utility methods
  async getMessageCount(): Promise<number> {
    try {
      const messages = await this.messages({ limit: 1000 }); // Reasonable limit for counting
      return messages.length;
    } catch (error) {
      console.warn(`[XMTP Conversation] Failed to get message count:`, error);
      return 0;
    }
  }

  async getLastMessage(): Promise<DecodedMessage | null> {
    try {
      const messages = await this.messages({ limit: 1, order: 'desc' });
      return messages.length > 0 ? messages[0] : null;
    } catch (error) {
      console.warn(`[XMTP Conversation] Failed to get last message:`, error);
      return null;
    }
  }

  async hasUnreadMessages(): Promise<boolean> {
    try {
      // This is a simplified implementation
      // In a real app, you'd track read status separately
      const lastMessage = await this.getLastMessage();
      return lastMessage ? lastMessage.senderInboxId !== this.client.inboxId : false;
    } catch (error) {
      console.warn(`[XMTP Conversation] Failed to check unread status:`, error);
      return false;
    }
  }

  // Search messages in conversation
  async searchMessages(query: string, limit = 50): Promise<DecodedMessage[]> {
    try {
      const messages = await this.messages({ limit });
      const lowerQuery = query.toLowerCase();
      
      return messages.filter(message => {
        if (typeof message.content === 'string') {
          return message.content.toLowerCase().includes(lowerQuery);
        }
        
        if (message.content && typeof message.content === 'object') {
          const contentStr = JSON.stringify(message.content).toLowerCase();
          return contentStr.includes(lowerQuery);
        }
        
        return false;
      });
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Metadata (to be overridden by subclasses)
  async getMetadata(): Promise<ConversationMetadata> {
    return {
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.createdAt, // Default to created date
    };
  }

  // Export conversation data
  async export(): Promise<{
    id: string;
    type: ConversationType;
    createdAt: string;
    metadata: ConversationMetadata;
    messages: DecodedMessage[];
  }> {
    const [metadata, messages] = await Promise.all([
      this.getMetadata(),
      this.messages(),
    ]);

    return {
      id: this.id,
      type: this.conversationType,
      createdAt: this.createdAt.toISOString(),
      metadata,
      messages,
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.subscriptionManager.unsubscribeAll();
  }

  // String representation
  toString(): string {
    return `${this.constructor.name}(id=${this.id}, type=${this.conversationType})`;
  }
}

export default Conversation;