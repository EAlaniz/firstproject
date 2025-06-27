import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled = false }) => {
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!text.trim() || isSending || disabled) return;
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

  return (
    <div className="message-input-container flex items-center gap-2 p-2 border-t bg-white">
      <textarea
        className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[40px] max-h-32"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your message..."
        disabled={isSending || disabled}
        rows={1}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
        onClick={handleSend}
        disabled={isSending || disabled || !text.trim()}
      >
        {isSending ? 'Sending...' : 'Send'}
      </button>
      {error && <div className="text-red-500 text-xs ml-2">{error}</div>}
    </div>
  );
};

export default MessageInput; 