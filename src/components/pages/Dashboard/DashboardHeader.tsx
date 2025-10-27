import React from 'react';
import { Activity, MessageCircle, Menu, User } from 'lucide-react';

interface DashboardHeaderProps {
  address: string | undefined;
  activeView: 'dashboard' | 'messages';
  isInitialized: boolean;
  isInitializing: boolean;
  onMenuClick: () => void;
  onMessagesClick: () => void;
  onWalletClick: () => void;
  onInitializeXMTP: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({
  address,
  activeView,
  isInitialized,
  isInitializing,
  onMenuClick,
  onMessagesClick,
  onWalletClick,
  onInitializeXMTP,
}) => {
  return (
    <header className="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-medium">10K</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-2">
          {isInitialized ? (
            <button
              onClick={onMessagesClick}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeView === 'messages'
                  ? 'bg-gray-100 text-black'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Messages</span>
            </button>
          ) : (
            <button
              onClick={onInitializeXMTP}
              disabled={isInitializing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isInitializing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isInitializing ? 'Initializing...' : 'Enable Messages'}</span>
            </button>
          )}
          <button
            onClick={onWalletClick}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="sm:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';
