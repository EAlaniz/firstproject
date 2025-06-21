import React, { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, AlertCircle, ArrowRight, Settings } from 'lucide-react';

interface WhoopConnectionGuideProps {
  onClose: () => void;
}

export default function WhoopConnectionGuide({ onClose }: WhoopConnectionGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedClientId, setCopiedClientId] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClientId(true);
    setTimeout(() => setCopiedClientId(false), 2000);
  };

  const steps = [
    {
      title: "Create WHOOP Developer Account",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            First, you'll need to register as a WHOOP developer to get API access.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Visit WHOOP Developer Portal</p>
                <a 
                  href="https://developer.whoop.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>developer.whoop.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Sign up with your WHOOP account</p>
                <p className="text-xs text-gray-500">Use the same email as your WHOOP membership</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Complete developer verification</p>
                <p className="text-xs text-gray-500">This may take 1-2 business days</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Create OAuth Application",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Once approved, create an OAuth application in the developer dashboard.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-green-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Go to "Applications" in developer dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-green-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Click "Create New Application"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-green-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Fill in application details:</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <div><strong>Name:</strong> 10K Fitness Tracker</div>
                  <div><strong>Description:</strong> Step tracking and wellness app</div>
                  <div><strong>Redirect URI:</strong> {window.location.origin}/auth/whoop</div>
                  <div><strong>Scopes:</strong> read:recovery, read:cycles, read:workout, read:sleep, read:profile</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Configure Environment Variables",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Add your WHOOP API credentials to your environment configuration.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Copy your Client ID and Client Secret</p>
                <p className="text-xs text-gray-500">From your WHOOP application dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add to your .env file:</p>
                <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-green-400 font-mono">
                  <div>VITE_WHOOP_CLIENT_ID=your_client_id_here</div>
                  <div>VITE_WHOOP_CLIENT_SECRET=your_client_secret_here</div>
                </div>
                <button
                  onClick={() => copyToClipboard('VITE_WHOOP_CLIENT_ID=your_client_id_here\nVITE_WHOOP_CLIENT_SECRET=your_client_secret_here')}
                  className="mt-2 flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {copiedClientId ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedClientId ? 'Copied!' : 'Copy to clipboard'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-purple-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Restart your development server</p>
                <p className="text-xs text-gray-500">Run: npm run dev</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your WHOOP",
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're all set! Now you can connect your WHOOP device.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-orange-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Click "Connect" on the WHOOP device</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-orange-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Authorize the app in the popup window</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-orange-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Your WHOOP data will sync automatically</p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Ready to Connect!</span>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Your WHOOP will provide recovery scores, heart rate data, and workout metrics.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-xl">💪</span>
              </div>
              <div>
                <h2 className="text-lg font-medium">Connect Your WHOOP</h2>
                <p className="text-sm text-gray-600">Step {currentStep} of {steps.length}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-2 rounded-full ${
                    index + 1 <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-96">
          <h3 className="text-lg font-medium mb-4">{steps[currentStep - 1].title}</h3>
          {steps[currentStep - 1].content}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Previous
          </button>
          
          <div className="flex space-x-3">
            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Start Connecting
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}