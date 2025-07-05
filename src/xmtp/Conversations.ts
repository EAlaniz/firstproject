// XMTP Conversations - Mirror of official Browser SDK
import { 
  ConsentState,
  ConversationType,
  Dm as WasmDm,
  Group as WasmGroup,
} from '@xmtp/browser-sdk';

import type {
  ListOptions,
  AsyncStream,
  StreamCallback,
  StreamOptions,
  DecodedMessage,
  SendOptions,
} from './types';
import type { Client } from './Client';
import { Conversation } from './Conversation';
import { Dm } from './Dm';
import { Group } from './Group';
import {
  ErrorFactory,
  ConversationCreationError,
  ConversationNotFoundError,
  ValidationError,
} from './errors';
import {
  AddressValidator,
  AsyncStreamImpl,
  SubscriptionManager,
  PerformanceUtils,
} from './utils';

export type XMTPConversation = Dm | Group;

export class Conversations {
  private client: Client;
  private subscriptionManager = new SubscriptionManager();

  constructor(client: Client) {
    this.client = client;
  }

  // Sync operations
  async sync(): Promise<void> {
    try {
      const wasmClient = this.client.getWasmClient();
      await wasmClient.conversations.sync();
      console.log('[XMTP Conversations] Sync completed');
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async syncAll(consentStates?: ConsentState[]): Promise<void> {
    try {
      const wasmClient = this.client.getWasmClient();
      if (consentStates) {
        await wasmClient.conversations.syncAll(consentStates);
      } else {
        await wasmClient.conversations.syncAll();
      }
      console.log('[XMTP Conversations] Sync all completed');
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // List conversations
  async list(options: ListOptions = {}): Promise<XMTPConversation[]> {
    try {
      PerformanceUtils.startMeasurement('conversations-list');
      
      const wasmClient = this.client.getWasmClient();
      
      // Sync before listing
      await this.sync();
      
      const wasmConversations = await wasmClient.conversations.list({
        ...(options.limit && { limit: BigInt(options.limit) }),
        ...(options.order && { order: options.order }),
      });

      const conversations = wasmConversations.map(conv => this.wrapConversation(conv));
      
      const duration = PerformanceUtils.endMeasurement('conversations-list');
      if (duration) {
        PerformanceUtils.logPerformance('List Conversations', duration);
      }

      console.log(`[XMTP Conversations] Listed ${conversations.length} conversations`);
      return conversations;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async listDms(options: ListOptions = {}): Promise<Dm[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before listing
      await this.sync();
      
      const wasmDms = await wasmClient.conversations.listDms({
        ...(options.limit && { limit: BigInt(options.limit) }),
        ...(options.order && { order: options.order }),
      });

      const dms = wasmDms.map(dm => new Dm(dm, this.client));
      
      console.log(`[XMTP Conversations] Listed ${dms.length} DMs`);
      return dms;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async listGroups(options: ListOptions = {}): Promise<Group[]> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before listing
      await this.sync();
      
      const wasmGroups = await wasmClient.conversations.listGroups({
        ...(options.limit && { limit: BigInt(options.limit) }),
        ...(options.order && { order: options.order }),
      });

      const groups = wasmGroups.map(group => new Group(group, this.client));
      
      console.log(`[XMTP Conversations] Listed ${groups.length} groups`);
      return groups;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Create conversations
  async newDm(inboxId: string): Promise<Dm> {
    try {
      PerformanceUtils.startMeasurement('create-dm');
      
      const wasmClient = this.client.getWasmClient();
      
      // Validate inbox ID format
      if (!/^[a-f0-9]{64}$/.test(inboxId)) {
        throw new ValidationError(`Invalid inbox ID format: ${inboxId}`);
      }

      console.log(`[XMTP Conversations] Creating DM with inbox ID: ${inboxId}`);
      
      const wasmDm = await wasmClient.conversations.newDm(inboxId);
      const dm = new Dm(wasmDm, this.client);
      
      const duration = PerformanceUtils.endMeasurement('create-dm');
      if (duration) {
        PerformanceUtils.logPerformance('Create DM', duration);
      }

      console.log(`[XMTP Conversations] DM created successfully: ${dm.id}`);
      return dm;
    } catch (error) {
      throw new ConversationCreationError(
        `Failed to create DM: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inboxId, originalError: error }
      );
    }
  }

  async newGroup(inboxIds: string[]): Promise<Group> {
    try {
      PerformanceUtils.startMeasurement('create-group');
      
      const wasmClient = this.client.getWasmClient();
      
      // Validate inbox IDs
      if (inboxIds.length === 0) {
        throw new ValidationError('At least one inbox ID is required to create a group');
      }

      for (const inboxId of inboxIds) {
        if (!/^[a-f0-9]{64}$/.test(inboxId)) {
          throw new ValidationError(`Invalid inbox ID format: ${inboxId}`);
        }
      }

      console.log(`[XMTP Conversations] Creating group with ${inboxIds.length} members`);
      
      const wasmGroup = await wasmClient.conversations.newGroup(inboxIds);
      const group = new Group(wasmGroup, this.client);
      
      const duration = PerformanceUtils.endMeasurement('create-group');
      if (duration) {
        PerformanceUtils.logPerformance('Create Group', duration);
      }

      console.log(`[XMTP Conversations] Group created successfully: ${group.id}`);
      return group;
    } catch (error) {
      throw new ConversationCreationError(
        `Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inboxIds, originalError: error }
      );
    }
  }

  // Create conversation by address (convenience method)
  async newConversationByAddress(address: string): Promise<Dm> {
    try {
      // Validate and normalize address
      const normalizedAddress = AddressValidator.validateAndNormalize(address);
      
      // Check if the address can receive messages
      const canMessage = await this.client.constructor.canMessage([{
        identifier: normalizedAddress,
        identifierKind: 'Ethereum',
      }], this.client.environment as any);

      if (!canMessage.get(normalizedAddress)) {
        throw new ConversationCreationError(
          `Address ${address} is not registered with XMTP and cannot receive messages`
        );
      }

      // Resolve address to inbox ID
      const inboxId = await this.client.findInboxIdByIdentifier({
        identifier: normalizedAddress,
        identifierKind: 'Ethereum',
      });

      if (!inboxId) {
        throw new ConversationCreationError(
          `Could not resolve address ${address} to inbox ID`
        );
      }

      return await this.newDm(inboxId);
    } catch (error) {
      if (error instanceof ConversationCreationError) {
        throw error;
      }
      throw new ConversationCreationError(
        `Failed to create conversation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { address, originalError: error }
      );
    }
  }

  // Find conversations
  async findByConversationId(conversationId: string): Promise<XMTPConversation | null> {
    try {
      const conversations = await this.list();
      return conversations.find(conv => conv.id === conversationId) || null;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async findDmByInboxId(inboxId: string): Promise<Dm | null> {
    try {
      const dms = await this.listDms();
      return dms.find(dm => dm.peerInboxId === inboxId) || null;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async findGroupById(groupId: string): Promise<Group | null> {
    try {
      const groups = await this.listGroups();
      return groups.find(group => group.id === groupId) || null;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Streaming
  async streamConversations(
    callback?: StreamCallback<XMTPConversation>,
    options: StreamOptions = {}
  ): Promise<AsyncStream<XMTPConversation>> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before streaming
      await this.sync();
      
      const wasmStream = await wasmClient.conversations.stream();
      
      // Transform the WASM stream
      const transformedStream = new ReadableStream<XMTPConversation>({
        async start(controller) {
          try {
            for await (const wasmConv of wasmStream) {
              const conversation = this.wrapConversation(wasmConv);
              
              // Apply filtering based on options
              if (options.includeGroups === false && conversation instanceof Group) {
                continue;
              }
              if (options.includeDms === false && conversation instanceof Dm) {
                continue;
              }
              
              controller.enqueue(conversation);
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

      console.log('[XMTP Conversations] Started streaming conversations');
      return asyncStream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async streamAllMessages(
    callback?: StreamCallback<DecodedMessage>,
    options: StreamOptions = {}
  ): Promise<AsyncStream<DecodedMessage>> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before streaming
      await this.sync();
      
      const consentStates = options.consentStates || [ConsentState.Allowed];
      const wasmStream = await wasmClient.conversations.streamAllMessages(
        undefined, // conversation ID filter
        undefined, // message ID cursor
        consentStates
      );
      
      // Transform the WASM stream
      const transformedStream = new ReadableStream<DecodedMessage>({
        async start(controller) {
          try {
            for await (const wasmMessage of wasmStream) {
              // Filter own messages
              if (wasmMessage.senderInboxId === this.client.inboxId) {
                continue;
              }
              
              controller.enqueue(wasmMessage);
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

      console.log('[XMTP Conversations] Started streaming all messages');
      return asyncStream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async streamGroupMessages(
    callback?: StreamCallback<DecodedMessage>,
    options: StreamOptions = {}
  ): Promise<AsyncStream<DecodedMessage>> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before streaming
      await this.sync();
      
      const consentStates = options.consentStates || [ConsentState.Allowed];
      const wasmStream = await wasmClient.conversations.streamGroupMessages(consentStates);
      
      // Transform the WASM stream
      const transformedStream = new ReadableStream<DecodedMessage>({
        async start(controller) {
          try {
            for await (const wasmMessage of wasmStream) {
              // Filter own messages
              if (wasmMessage.senderInboxId === this.client.inboxId) {
                continue;
              }
              
              controller.enqueue(wasmMessage);
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

      console.log('[XMTP Conversations] Started streaming group messages');
      return asyncStream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async streamDmMessages(
    callback?: StreamCallback<DecodedMessage>,
    options: StreamOptions = {}
  ): Promise<AsyncStream<DecodedMessage>> {
    try {
      const wasmClient = this.client.getWasmClient();
      
      // Sync before streaming
      await this.sync();
      
      const consentStates = options.consentStates || [ConsentState.Allowed];
      const wasmStream = await wasmClient.conversations.streamDmMessages(consentStates);
      
      // Transform the WASM stream
      const transformedStream = new ReadableStream<DecodedMessage>({
        async start(controller) {
          try {
            for await (const wasmMessage of wasmStream) {
              // Filter own messages
              if (wasmMessage.senderInboxId === this.client.inboxId) {
                continue;
              }
              
              controller.enqueue(wasmMessage);
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

      console.log('[XMTP Conversations] Started streaming DM messages');
      return asyncStream;
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Utility methods
  async getConversationById(id: string): Promise<XMTPConversation> {
    const conversation = await this.findByConversationId(id);
    if (!conversation) {
      throw new ConversationNotFoundError(id);
    }
    return conversation;
  }

  async getConversationCount(): Promise<{
    total: number;
    dms: number;
    groups: number;
  }> {
    try {
      const [dms, groups] = await Promise.all([
        this.listDms(),
        this.listGroups(),
      ]);

      return {
        total: dms.length + groups.length,
        dms: dms.length,
        groups: groups.length,
      };
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Search conversations
  async searchConversations(query: string): Promise<XMTPConversation[]> {
    try {
      const conversations = await this.list();
      const lowerQuery = query.toLowerCase();
      
      return conversations.filter(conv => {
        // Search by conversation ID
        if (conv.id.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // Search by conversation type
        if (conv.conversationType.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        // For groups, search by name if available
        if (conv instanceof Group && conv.name?.toLowerCase().includes(lowerQuery)) {
          return true;
        }
        
        return false;
      });
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Helper methods
  private wrapConversation(wasmConversation: WasmDm | WasmGroup): XMTPConversation {
    if ('conversationType' in wasmConversation) {
      if (wasmConversation.conversationType === ConversationType.Group) {
        return new Group(wasmConversation as WasmGroup, this.client);
      } else {
        return new Dm(wasmConversation as WasmDm, this.client);
      }
    }
    
    // Fallback: try to determine type from the object structure
    if ('peerInboxId' in wasmConversation) {
      return new Dm(wasmConversation as WasmDm, this.client);
    } else {
      return new Group(wasmConversation as WasmGroup, this.client);
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.subscriptionManager.unsubscribeAll();
  }
}

export default Conversations;