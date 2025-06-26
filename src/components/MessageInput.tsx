import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

interface MessageInputProps {
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ disabled = false }) => {
  const { sendMessage, selectedConversation } = useXMTP();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || !selectedConversation || isSending) return;

    try {
      setIsSending(true);
      await sendMessage(message.trim(), selectedConversation);
      setMessage('');
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
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedConversation ? "Type a message..." : "Select a conversation to start messaging"}
            disabled={disabled || !selectedConversation}
            className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            rows={1}
            maxLength={1000}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {message.length}/1000
          </div>
        </div>
        <button
          onClick={handleSend}
          disabled={isDisabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput; 