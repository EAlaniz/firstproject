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
    } catch (err) {
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
    <div className="message-input-container">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your message..."
        disabled={isSending || disabled || !canSend}
        onKeyDown={handleKeyDown}
        className="w-full p-2 rounded border border-gray-300 focus:outline-none"
        rows={2}
      />
      <button
        onClick={handleSend}
        disabled={isSending || disabled || !canSend || !text.trim()}
        className="ml-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      {!canSend && (
        <div className="text-yellow-500 text-xs mt-1">Group membership is still syncing. Please wait…</div>
      )}
    </div>
  );
};

export default MessageInput; 