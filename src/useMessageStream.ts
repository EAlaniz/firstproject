import { useEffect, useRef, useState } from "react";
import type { Client, Conversation, DecodedMessage } from "@xmtp/browser-sdk";

export function useMessageStream(client: Client | null, peerAddress: string) {
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const stopRef = useRef<() => void>();

  useEffect(() => {
    if (!client || !peerAddress) return;
    
    let active = true;

    async function startStream() {
      try {
        console.log('Starting message stream for peer:', peerAddress);
        
        // @ts-expect-error XMTP SDK type mismatch
        const convo = await client.conversations.newConversation(peerAddress);
        setConversation(convo);
        
        // Load existing messages
        const existingMessages = await convo.messages();
        if (active) {
          setMessages(existingMessages);
        }

        // Stream new messages
        const stream = await convo.streamMessages();
        stopRef.current = () => stream.return?.();
        
        for await (const msg of stream) {
          if (!active) break;
          console.log(`[${(msg as any).senderAddress}] ${(msg as any).content}`);
          setMessages((prev) => [...prev, msg]);
        }
      } catch (error) {
        console.error('Error in message stream:', error);
      }
    }

    startStream();

    return () => {
      active = false;
      stopRef.current?.();
    };
  }, [client, peerAddress]);

  const sendMessage = async (content: string) => {
    if (!conversation) return;
    try {
      await conversation.send(content);
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage, conversation };
} 