import React, { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, AlertCircle, ArrowRight, Settings, Smartphone } from 'lucide-react';

interface WearableSetupGuideProps {
  deviceType: 'whoop' | 'fitbit' | 'garmin' | 'oura';
  onClose: () => void;
}

const deviceConfig = {
  whoop: {
    name: 'WHOOP',
    icon: '💪',
    color: 'red',
    developerUrl: 'https://developer.whoop.com',
    scopes: 'read:recovery read:cycles read:workout read:sleep read:profile',
    envVars: ['VITE_WHOOP_CLIENT_ID', 'VITE_WHOOP_CLIENT_SECRET']
  },
  fitbit: {
    name: 'Fitbit',
    icon: '⌚',
    color: 'blue',
    developerUrl: 'https://dev.fitbit.com',
    scopes: 'activity heartrate location nutrition profile settings sleep social weight',
    envVars: ['VITE_FITBIT_CLIENT_ID', 'VITE_FITBIT_CLIENT_SECRET']
  },
  garmin: {
    name: 'Garmin',
    icon: '🏃',
    color: 'green',
    developerUrl: 'https://developer.garmin.com',
    scopes: 'read:activities read:health',
    envVars: ['VITE_GARMIN_CONSUMER_KEY', 'VITE_GARMIN_CONSUMER_SECRET']
  },
  oura: {
    name: 'Oura',
    icon: '💍',
    color: 'purple',
    developerUrl: 'https://cloud.ouraring.com/docs',
    scopes: 'email personal daily',
    envVars: ['VITE_OURA_CLIENT_ID', 'VITE_OURA_CLIENT_SECRET']
  }
};

export default function WearableSetupGuide({ deviceType, onClose }: WearableSetupGuideProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [copiedEnv, setCopiedEnv] = useState(false);
  
  const device = deviceConfig[deviceType];
  const colorClasses = {
    red: 'bg-red-100 text-red-600 border-red-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200'
  };

  const copyEnvVars = () => {
    const envText = device.envVars.map(varName => `${varName}=your_${varName.toLowerCase().replace('vite_', '').replace('_', '_')}_here`).join('\n');
    navigator.clipboard.writeText(envText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const steps = [
    {
      title: `Create ${device.name} Developer Account`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            First, you'll need to register as a {device.name} developer to get API access.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Visit {device.name} Developer Portal</p>
                <a 
                  href={device.developerUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>{device.developerUrl.replace('https://', '')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Sign up with your {device.name} account</p>
                <p className="text-xs text-gray-500">Use the same email as your {device.name} membership</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">3</span>
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
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Go to "Applications" in developer dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Click "Create New Application"</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Fill in application details:</p>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                  <div><strong>Name:</strong> 10K Fitness Tracker</div>
                  <div><strong>Description:</strong> Step tracking and wellness app</div>
                  <div><strong>Redirect URI:</strong> {window.location.origin}/auth/{deviceType}</div>
                  <div><strong>Scopes:</strong> {device.scopes}</div>
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
            Add your {device.name} API credentials to your environment configuration.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Copy your Client ID and Client Secret</p>
                <p className="text-xs text-gray-500">From your {device.name} application dashboard</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add to your .env file:</p>
                <div className="mt-2 p-3 bg-gray-900 rounded-lg text-xs text-green-400 font-mono">
                  {device.envVars.map(varName => (
                    <div key={varName}>{varName}=your_{varName.toLowerCase().replace('vite_', '').replace('_', '_')}_here</div>
                  ))}
                </div>
                <button
                  onClick={copyEnvVars}
                  className="mt-2 flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  {copiedEnv ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEnv ? 'Copied!' : 'Copy to clipboard'}</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">3</span>
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
      title: `Connect Your ${device.name}`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You're all set! Now you can connect your {device.name} device.
          </p>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Click "Connect" on the {device.name} device</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Authorize the app in the popup window</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className={`w-6 h-6 ${colorClasses[device.color]} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <span className="text-xs font-medium">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Your {device.name} data will sync automatically</p>
              </div>
            </div>
          </div>
          
          <div className={`p-3 ${colorClasses[device.color]} rounded-lg`}>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Ready to Connect!</span>
            </div>
            <p className="text-xs mt-1">
              Your {device.name} will provide real-time health and fitness data.
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
              <div className={`w-10 h-10 ${colorClasses[device.color]} rounded-full flex items-center justify-center`}>
                <span className="text-xl">{device.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-medium">Connect Your {device.name}</h2>
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
                    index + 1 <= currentStep ? `bg-${device.color}-600` : 'bg-gray-200'
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
                className={`flex items-center space-x-2 px-4 py-2 bg-${device.color}-600 text-white rounded-lg hover:bg-${device.color}-700 transition-colors text-sm`}
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className={`px-4 py-2 bg-${device.color}-600 text-white rounded-lg hover:bg-${device.color}-700 transition-colors text-sm`}
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