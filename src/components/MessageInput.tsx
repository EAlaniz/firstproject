import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

interface MessageInputProps {
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ disabled = false }) => {
  const { sendMessage, selectedConversation } = useXMTP();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(message.trim(), selectedConversation);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isDisabled = disabled || !selectedConversation || !message.trim() || isSending;

  return (
    <div className="border-t bg-white p-3 sm:p-4">
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedConversation ? "Type a message..." : "Select a conversation to start messaging"}
            disabled={disabled || !selectedConversation}
            className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 sm:px-4 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 text-sm sm:text-base min-h-[44px] max-h-[120px]"
            rows={1}
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-400">
              {message.length}/1000
            </div>
            <div className="text-xs text-gray-400 hidden sm:block">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className="px-3 py-2 sm:px-4 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 min-h-[44px] flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">
            {isSending ? 'Sending...' : 'Send'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MessageInput; 