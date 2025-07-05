// XMTP Content Types - Official SDK Patterns
import type { ContentTypeId, ContentTypeCodec } from '../types';

// Standard Content Types
export const ContentTypes = {
  Text: {
    authorityId: 'xmtp.org',
    typeId: 'text',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
  
  Reaction: {
    authorityId: 'xmtp.org',
    typeId: 'reaction',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
  
  Reply: {
    authorityId: 'xmtp.org',
    typeId: 'reply',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
  
  ReadReceipt: {
    authorityId: 'xmtp.org',
    typeId: 'readReceipt',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
  
  Attachment: {
    authorityId: 'xmtp.org',
    typeId: 'attachment',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
  
  RemoteAttachment: {
    authorityId: 'xmtp.org',
    typeId: 'remoteStaticAttachment',
    versionMajor: 1,
    versionMinor: 0,
  } as ContentTypeId,
} as const;

// Content Type Interfaces
export interface TextContent {
  text: string;
}

export interface ReactionContent {
  reference: string; // Message ID being reacted to
  action: 'added' | 'removed';
  content: string; // Emoji or reaction text
  schema: 'unicode' | 'shortcode' | 'custom';
}

export interface ReplyContent {
  reference: string; // Message ID being replied to
  content: unknown; // The actual reply content
  contentType: ContentTypeId;
}

export interface ReadReceiptContent {
  reference: string; // Message ID being acknowledged
}

export interface AttachmentContent {
  filename: string;
  mimeType: string;
  data: Uint8Array;
}

export interface RemoteAttachmentContent {
  url: string;
  contentDigest: string;
  salt: Uint8Array;
  nonce: Uint8Array;
  secret: Uint8Array;
  scheme: 'https://' | 'ipfs://';
  filename?: string;
  contentLength?: number;
}

// Text Codec
export class TextCodec implements ContentTypeCodec<TextContent> {
  contentType = ContentTypes.Text;

  encode(content: TextContent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(content));
  }

  decode(bytes: Uint8Array): TextContent {
    const text = new TextDecoder().decode(bytes);
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }

  fallback(content: TextContent): string {
    return content.text;
  }
}

// Reaction Codec
export class ReactionCodec implements ContentTypeCodec<ReactionContent> {
  contentType = ContentTypes.Reaction;

  encode(content: ReactionContent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(content));
  }

  decode(bytes: Uint8Array): ReactionContent {
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  }

  fallback(content: ReactionContent): string {
    return `${content.action === 'added' ? '👍' : '👎'} ${content.content}`;
  }
}

// Reply Codec
export class ReplyCodec implements ContentTypeCodec<ReplyContent> {
  contentType = ContentTypes.Reply;

  encode(content: ReplyContent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(content));
  }

  decode(bytes: Uint8Array): ReplyContent {
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  }

  fallback(content: ReplyContent): string {
    return `Replied: ${JSON.stringify(content.content)}`;
  }
}

// Read Receipt Codec
export class ReadReceiptCodec implements ContentTypeCodec<ReadReceiptContent> {
  contentType = ContentTypes.ReadReceipt;

  encode(content: ReadReceiptContent): Uint8Array {
    return new TextEncoder().encode(JSON.stringify(content));
  }

  decode(bytes: Uint8Array): ReadReceiptContent {
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text);
  }

  fallback(content: ReadReceiptContent): string {
    return '✓ Read';
  }
}

// Attachment Codec
export class AttachmentCodec implements ContentTypeCodec<AttachmentContent> {
  contentType = ContentTypes.Attachment;

  encode(content: AttachmentContent): Uint8Array {
    const metadata = {
      filename: content.filename,
      mimeType: content.mimeType,
      data: Array.from(content.data),
    };
    return new TextEncoder().encode(JSON.stringify(metadata));
  }

  decode(bytes: Uint8Array): AttachmentContent {
    const text = new TextDecoder().decode(bytes);
    const metadata = JSON.parse(text);
    return {
      filename: metadata.filename,
      mimeType: metadata.mimeType,
      data: new Uint8Array(metadata.data),
    };
  }

  fallback(content: AttachmentContent): string {
    return `📎 ${content.filename}`;
  }
}

// Remote Attachment Codec
export class RemoteAttachmentCodec implements ContentTypeCodec<RemoteAttachmentContent> {
  contentType = ContentTypes.RemoteAttachment;

  encode(content: RemoteAttachmentContent): Uint8Array {
    const metadata = {
      url: content.url,
      contentDigest: content.contentDigest,
      salt: Array.from(content.salt),
      nonce: Array.from(content.nonce),
      secret: Array.from(content.secret),
      scheme: content.scheme,
      filename: content.filename,
      contentLength: content.contentLength,
    };
    return new TextEncoder().encode(JSON.stringify(metadata));
  }

  decode(bytes: Uint8Array): RemoteAttachmentContent {
    const text = new TextDecoder().decode(bytes);
    const metadata = JSON.parse(text);
    return {
      url: metadata.url,
      contentDigest: metadata.contentDigest,
      salt: new Uint8Array(metadata.salt),
      nonce: new Uint8Array(metadata.nonce),
      secret: new Uint8Array(metadata.secret),
      scheme: metadata.scheme,
      filename: metadata.filename,
      contentLength: metadata.contentLength,
    };
  }

  fallback(content: RemoteAttachmentContent): string {
    return `🔗 ${content.filename || 'Attachment'}`;
  }
}

// Default Codecs Registry
export const defaultCodecs: ContentTypeCodec[] = [
  new TextCodec(),
  new ReactionCodec(),
  new ReplyCodec(),
  new ReadReceiptCodec(),
  new AttachmentCodec(),
  new RemoteAttachmentCodec(),
];

// Codec Registry
export class CodecRegistry {
  private codecs = new Map<string, ContentTypeCodec>();

  constructor(codecs: ContentTypeCodec[] = defaultCodecs) {
    codecs.forEach(codec => this.register(codec));
  }

  register(codec: ContentTypeCodec): void {
    const key = this.getContentTypeKey(codec.contentType);
    this.codecs.set(key, codec);
  }

  unregister(contentType: ContentTypeId): void {
    const key = this.getContentTypeKey(contentType);
    this.codecs.delete(key);
  }

  codecFor(contentType: ContentTypeId): ContentTypeCodec | undefined {
    const key = this.getContentTypeKey(contentType);
    return this.codecs.get(key);
  }

  private getContentTypeKey(contentType: ContentTypeId): string {
    return `${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}`;
  }

  getAllCodecs(): ContentTypeCodec[] {
    return Array.from(this.codecs.values());
  }
}

// Content Type Utilities
export function contentTypeEquals(a: ContentTypeId, b: ContentTypeId): boolean {
  return (
    a.authorityId === b.authorityId &&
    a.typeId === b.typeId &&
    a.versionMajor === b.versionMajor &&
    a.versionMinor === b.versionMinor
  );
}

export function contentTypeToString(contentType: ContentTypeId): string {
  return `${contentType.authorityId}/${contentType.typeId}:${contentType.versionMajor}.${contentType.versionMinor}`;
}

export function parseContentType(contentTypeString: string): ContentTypeId | null {
  const match = contentTypeString.match(/^(.+)\/(.+):(\d+)\.(\d+)$/);
  if (!match) return null;

  return {
    authorityId: match[1],
    typeId: match[2],
    versionMajor: parseInt(match[3], 10),
    versionMinor: parseInt(match[4], 10),
  };
}