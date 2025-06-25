import { useEffect, useRef, useState } from "react";
import type { Client, Conversation, DecodedMessage } from "@xmtp/browser-sdk";

export function useMessageStream(client: Client | null, peer: string) {
  const [messages, setMessages] = useState<DecodedMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const stop = useRef<() => void>();

  useEffect(() => {
    if (!client || !peer) return;
    let active = true;

    async function stream() {
      try {
        // @ts-expect-error XMTP SDK type mismatch
        const convo = await client.conversations.newConversation(peer);
        setConversation(convo);
        
        // Load existing messages
        const existingMessages = await convo.messages();
        if (active) {
          setMessages(existingMessages);
        }

        // Stream new messages
        const msgStream = await convo.streamMessages();
        stop.current = () => msgStream.return?.();
        
        for await (const m of msgStream) {
          if (!active) break;
          setMessages((prev) => [...prev, m]);
        }
      } catch (error) {
        console.error('Error in message stream:', error);
      }
    }
    
    stream();
    
    return () => {
      active = false;
      stop.current?.();
    };
  }, [client, peer]);

  const sendMessage = async (content: string) => {
    if (!conversation) return;
    try {
      await conversation.send(content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage, conversation };
} 