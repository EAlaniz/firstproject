import React, { useState } from 'react';
import { X, UserPlus, Copy } from 'lucide-react';
import { useXMTP } from '../contexts/XMTPContext';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewConversationModal: React.FC<NewConversationModalProps> = ({ isOpen, onClose }) => {
  const { createConversation, selectConversation } = useXMTP();
  const [address, setAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);

  const handleCreate = async () => {
    if (!isValidAddress || isCreating) return;

    try {
      setIsCreating(true);
      setError('');
      
      const conversation = await createConversation(address);
      if (conversation) {
        selectConversation(conversation);
        setAddress('');
        onClose();
      } else {
        setError('Failed to create conversation. Please check the address and try again.');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValidAddress && !isCreating) {
      handleCreate();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text);
      setError('');
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
            New Conversation
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Recipient Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="0x..."
                className="w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[44px] pr-12"
                disabled={isCreating}
              />
              <button
                onClick={handlePaste}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded transition-colors"
                title="Paste from clipboard"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            {!isValidAddress && address && (
              <p className="text-sm text-red-500 mt-2">
                Please enter a valid Ethereum address
              </p>
            )}
            <p className="text-xs sm:text-sm text-gray-500 mt-2">
              Enter the wallet address of the person you want to message
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleCreate}
              disabled={!isValidAddress || isCreating}
              className="flex-1 bg-blue-600 text-white py-3 sm:py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium min-h-[44px]"
            >
              {isCreating ? 'Creating...' : 'Create Conversation'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 sm:py-4 text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base font-medium min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewConversationModal; 