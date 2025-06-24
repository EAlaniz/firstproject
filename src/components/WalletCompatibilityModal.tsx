import React from 'react';
import { X, ExternalLink, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { checkXMTPCompatibility, getWalletGuidance } from '../utils/walletCompatibility';

interface WalletCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export const WalletCompatibilityModal: React.FC<WalletCompatibilityModalProps> = ({
  isOpen,
  onClose,
  onRetry
}) => {
  if (!isOpen) return null;

  const compatibility = checkXMTPCompatibility();
  const guidance = getWalletGuidance();

  const handleActionClick = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {compatibility.isXMTPCompatible ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            )}
            <h2 className="text-xl font-semibold">{guidance.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message */}
        <p className="text-gray-600 leading-relaxed">
          {guidance.message}
        </p>

        {/* Wallet Type Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Current Wallet Type:</div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              compatibility.isXMTPCompatible ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm font-medium">
              {compatibility.walletType === 'smart-wallet' && 'Coinbase Smart Wallet'}
              {compatibility.walletType === 'extension-wallet' && 'Browser Extension Wallet'}
              {compatibility.walletType === 'mobile-wallet' && 'Mobile Wallet'}
              {compatibility.walletType === 'unknown' && 'No Wallet Detected'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {compatibility.isXMTPCompatible ? '✅ XMTP Compatible' : '❌ Not XMTP Compatible'}
          </div>
        </div>

        {/* Actions */}
        {guidance.actions.length > 0 && (
          <div className="space-y-3">
            {guidance.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.url)}
                className={`w-full flex items-center justify-center space-x-2 p-3 rounded-lg border transition-colors ${
                  action.type === 'primary'
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{action.label}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            ))}
          </div>
        )}

        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="w-full p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Check Again
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}; 