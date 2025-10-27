import React from 'react';
import { Activity } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = React.memo(({ onGetStarted }) => {
  return (
    <>
      {/* Header */}
      <header className="border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-medium">10K</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-light tracking-tight leading-tight">
              Move. Earn. Connect.
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              An inclusive wellness platform that rewards your daily movement with tokens and connects you with a community of movers.
            </p>
          </div>

          <div className="flex justify-center px-4">
            <button
              onClick={onGetStarted}
              className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full hover:bg-gray-800 transition-colors cursor-pointer font-medium flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>Get Started</span>
            </button>
          </div>

          <div className="pt-8 sm:pt-12 text-sm text-gray-500">
            Powered by Base Chain • Low fees • Fast transactions
          </div>
        </div>
      </main>
    </>
  );
});

LandingPage.displayName = 'LandingPage';
