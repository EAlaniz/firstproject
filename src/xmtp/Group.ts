// XMTP Group - Mirror of official Browser SDK
import type { 
  Group as WasmGroup,
  GroupPermissionLevel,
} from '@xmtp/browser-sdk';
import type { Client } from './Client';
import type { GroupMember } from './types';
import { Conversation } from './Conversation';
import {
  ErrorFactory,
  GroupMemberError,
  GroupPermissionError,
  ValidationError,
} from './errors';
import { AddressValidator } from './utils';

export class Group extends Conversation {
  protected wasmGroup: WasmGroup;

  constructor(wasmGroup: WasmGroup, client: Client) {
    super(wasmGroup, client);
    this.wasmGroup = wasmGroup;
  }

  // Group-specific properties
  get name(): string | undefined {
    try {
      return this.wasmGroup.groupName;
    } catch {
      return undefined;
    }
  }

  get description(): string | undefined {
    try {
      return this.wasmGroup.groupDescription;
    } catch {
      return undefined;
    }
  }

  get imageUrl(): string | undefined {
    try {
      return this.wasmGroup.groupImageUrlSquare;
    } catch {
      return undefined;
    }
  }

  get pinnedFrameUrl(): string | undefined {
    try {
      return this.wasmGroup.groupPinnedFrameUrl;
    } catch {
      return undefined;
    }
  }

  // Member management
  async listMembers(): Promise<GroupMember[]> {
    try {
      const wasmMembers = await this.wasmGroup.listMembers();
      
      return wasmMembers.map(member => ({
        inboxId: member.inboxId,
        accountAddresses: member.accountAddresses,
        permissionLevel: member.permissionLevel,
        joinedAt: member.joinedAtNs ? new Date(member.joinedAtNs / 1000000) : undefined,
      }));
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async addMembers(inboxIds: string[]): Promise<void> {
    try {
      // Validate inbox IDs
      for (const inboxId of inboxIds) {
        if (!/^[a-f0-9]{64}$/.test(inboxId)) {
          throw new ValidationError(`Invalid inbox ID format: ${inboxId}`);
        }
      }

      await this.wasmGroup.addMembers(inboxIds);
      console.log(`[XMTP Group] Added ${inboxIds.length} members to group: ${this.id}`);
    } catch (error) {
      throw new GroupMemberError(
        `Failed to add members: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inboxIds, originalError: error }
      );
    }
  }

  async removeMember(inboxId: string): Promise<void> {
    try {
      // Validate inbox ID
      if (!/^[a-f0-9]{64}$/.test(inboxId)) {
        throw new ValidationError(`Invalid inbox ID format: ${inboxId}`);
      }

      await this.wasmGroup.removeMember(inboxId);
      console.log(`[XMTP Group] Removed member ${inboxId} from group: ${this.id}`);
    } catch (error) {
      throw new GroupMemberError(
        `Failed to remove member: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inboxId, originalError: error }
      );
    }
  }

  async addMembersByAddress(addresses: string[]): Promise<void> {
    try {
      // Validate and resolve addresses to inbox IDs
      const inboxIds: string[] = [];
      
      for (const address of addresses) {
        const normalizedAddress = AddressValidator.validateAndNormalize(address);
        
        // Check if address can receive messages
        const canMessage = await this.client.constructor.canMessage([{
          identifier: normalizedAddress,
          identifierKind: 'Ethereum',
        }], this.client.environment as 'dev' | 'production' | 'local');

        if (!canMessage.get(normalizedAddress)) {
          throw new GroupMemberError(
            `Address ${address} is not registered with XMTP and cannot be added to groups`
          );
        }

        // Resolve to inbox ID
        const inboxId = await this.client.findInboxIdByIdentifier({
          identifier: normalizedAddress,
          identifierKind: 'Ethereum',
        });

        if (!inboxId) {
          throw new GroupMemberError(
            `Could not resolve address ${address} to inbox ID`
          );
        }

        inboxIds.push(inboxId);
      }

      await this.addMembers(inboxIds);
    } catch (error) {
      if (error instanceof GroupMemberError) {
        throw error;
      }
      throw new GroupMemberError(
        `Failed to add members by address: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { addresses, originalError: error }
      );
    }
  }

  // Permission management
  async updatePermission(inboxId: string, permission: GroupPermissionLevel): Promise<void> {
    try {
      // Validate inbox ID
      if (!/^[a-f0-9]{64}$/.test(inboxId)) {
        throw new ValidationError(`Invalid inbox ID format: ${inboxId}`);
      }

      await this.wasmGroup.updatePermission(inboxId, permission);
      console.log(`[XMTP Group] Updated permission for ${inboxId} to ${permission} in group: ${this.id}`);
    } catch (error) {
      throw new GroupPermissionError(
        `Failed to update permission: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { inboxId, permission, originalError: error }
      );
    }
  }

  async getMemberPermission(inboxId: string): Promise<GroupPermissionLevel | null> {
    try {
      const members = await this.listMembers();
      const member = members.find(m => m.inboxId === inboxId);
      return member ? member.permissionLevel : null;
    } catch (error) {
      console.warn(`[XMTP Group] Failed to get member permission:`, error);
      return null;
    }
  }

  async isAdmin(inboxId: string): Promise<boolean> {
    const permission = await this.getMemberPermission(inboxId);
    return permission === 'ADMIN';
  }

  async isSuperAdmin(inboxId: string): Promise<boolean> {
    const permission = await this.getMemberPermission(inboxId);
    return permission === 'SUPER_ADMIN';
  }

  async isMember(inboxId: string): Promise<boolean> {
    const permission = await this.getMemberPermission(inboxId);
    return permission !== null;
  }

  // Group metadata management
  async updateName(name: string): Promise<void> {
    try {
      await this.wasmGroup.updateGroupName(name);
      console.log(`[XMTP Group] Updated group name to: ${name}`);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async updateDescription(description: string): Promise<void> {
    try {
      await this.wasmGroup.updateGroupDescription(description);
      console.log(`[XMTP Group] Updated group description`);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async updateImageUrl(imageUrl: string): Promise<void> {
    try {
      await this.wasmGroup.updateGroupImageUrlSquare(imageUrl);
      console.log(`[XMTP Group] Updated group image URL`);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  async updatePinnedFrameUrl(frameUrl: string): Promise<void> {
    try {
      await this.wasmGroup.updateGroupPinnedFrameUrl(frameUrl);
      console.log(`[XMTP Group] Updated group pinned frame URL`);
    } catch (error) {
      throw ErrorFactory.fromWasmError(error);
    }
  }

  // Group utilities
  async getMemberCount(): Promise<number> {
    try {
      const members = await this.listMembers();
      return members.length;
    } catch (error) {
      console.warn(`[XMTP Group] Failed to get member count:`, error);
      return 0;
    }
  }

  async getAdmins(): Promise<GroupMember[]> {
    try {
      const members = await this.listMembers();
      return members.filter(member => 
        member.permissionLevel === 'ADMIN' || 
        member.permissionLevel === 'SUPER_ADMIN'
      );
    } catch (error) {
      console.warn(`[XMTP Group] Failed to get admins:`, error);
      return [];
    }
  }

  async isUserAdmin(): Promise<boolean> {
    return await this.isAdmin(this.client.inboxId);
  }

  async canUserAddMembers(): Promise<boolean> {
    const permission = await this.getMemberPermission(this.client.inboxId);
    return permission === 'ADMIN' || permission === 'SUPER_ADMIN';
  }

  async canUserRemoveMembers(): Promise<boolean> {
    const permission = await this.getMemberPermission(this.client.inboxId);
    return permission === 'ADMIN' || permission === 'SUPER_ADMIN';
  }

  async canUserUpdateGroup(): Promise<boolean> {
    const permission = await this.getMemberPermission(this.client.inboxId);
    return permission === 'ADMIN' || permission === 'SUPER_ADMIN';
  }

  // Group-specific metadata
  async getMetadata() {
    const baseMetadata = await super.getMetadata();
    
    return {
      ...baseMetadata,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      pinnedFrameUrl: this.pinnedFrameUrl,
      memberCount: await this.getMemberCount(),
      type: 'group' as const,
    };
  }

  // Export group data including members
  async export() {
    const [baseExport, members] = await Promise.all([
      super.export(),
      this.listMembers(),
    ]);

    return {
      ...baseExport,
      members,
      metadata: {
        ...baseExport.metadata,
        memberCount: members.length,
      },
    };
  }

  // String representation
  toString(): string {
    const displayName = this.name || `Group ${this.id.substring(0, 8)}...`;
    return `Group(id=${this.id}, name="${displayName}")`;
  }
}

export default Group;