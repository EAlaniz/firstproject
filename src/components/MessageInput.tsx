import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
  canSend?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false, canSend = true }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!text.trim() || isSending || disabled || !canSend) return;
    setIsSending(true);
    setError(null);
    try {
      await onSend(text.trim());
      setText('');
    } catch {
      setError('Failed to send message. Please try again.');
    }
    setIsSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          disabled={isSending || disabled || !canSend}
          onKeyDown={handleKeyDown}
          className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none resize-none transition-colors bg-gray-50 focus:bg-white"
          rows={1}
          style={{ minHeight: '44px', maxHeight: '120px' }}
        />
        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
      <button
        onClick={handleSend}
        disabled={isSending || disabled || !canSend || !text.trim()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
      >
        {isSending ? '⏳' : '→'}
      </button>
    </div>
  );
};

export default MessageInput; 