import React, { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, ExternalLink, Copy, ArrowRight } from 'lucide-react';

interface WearableQuickStartProps {
  onClose: () => void;
  onShowDeviceGuide: (deviceType: 'whoop' | 'fitbit' | 'garmin' | 'oura') => void;
}

export default function WearableQuickStart({ onClose, onShowDeviceGuide }: WearableQuickStartProps) {
  const [copiedEnv, setCopiedEnv] = useState(false);

  const copyEnvTemplate = () => {
    const envTemplate = `# WHOOP API Configuration
VITE_WHOOP_CLIENT_ID=your_whoop_client_id_here
VITE_WHOOP_CLIENT_SECRET=your_whoop_client_secret_here

# Fitbit API Configuration  
VITE_FITBIT_CLIENT_ID=your_fitbit_client_id_here
VITE_FITBIT_CLIENT_SECRET=your_fitbit_client_secret_here

# Garmin API Configuration
VITE_GARMIN_CONSUMER_KEY=your_garmin_consumer_key_here
VITE_GARMIN_CONSUMER_SECRET=your_garmin_consumer_secret_here

# Oura API Configuration
VITE_OURA_CLIENT_ID=your_oura_client_id_here
VITE_OURA_CLIENT_SECRET=your_oura_client_secret_here`;

    navigator.clipboard.writeText(envTemplate);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const devices = [
    {
      id: 'whoop' as const,
      name: 'WHOOP',
      icon: '💪',
      description: 'Recovery, strain, and sleep tracking',
      difficulty: 'Medium',
      timeToSetup: '10-15 min',
      features: ['Recovery Score', 'Heart Rate', 'Sleep Analysis', 'Strain Tracking']
    },
    {
      id: 'fitbit' as const,
      name: 'Fitbit',
      icon: '⌚',
      description: 'Steps, heart rate, and activity tracking',
      difficulty: 'Easy',
      timeToSetup: '5-10 min',
      features: ['Steps', 'Heart Rate', 'Active Minutes', 'Sleep Tracking']
    },
    {
      id: 'garmin' as const,
      name: 'Garmin',
      icon: '🏃',
      description: 'Advanced fitness and GPS tracking',
      difficulty: 'Medium',
      timeToSetup: '10-15 min',
      features: ['GPS Activities', 'Heart Rate', 'Training Metrics', 'Recovery']
    },
    {
      id: 'oura' as const,
      name: 'Oura Ring',
      icon: '💍',
      description: 'Sleep, recovery, and readiness tracking',
      difficulty: 'Easy',
      timeToSetup: '5-10 min',
      features: ['Sleep Score', 'Readiness', 'Temperature', 'Heart Rate']
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Connect Your Wearable Device</h2>
                <p className="text-sm text-gray-600">Choose a device to get real fitness data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-800 text-sm">Currently Using Demo Data</span>
            </div>
            <p className="text-sm text-amber-700">
              Your app is showing simulated step data. Connect a real device to get your actual fitness metrics!
            </p>
          </div>

          {/* Quick Setup */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Quick Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <span>Get developer credentials</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <span>Add to .env file</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <span>Connect & sync</span>
              </div>
            </div>
          </div>

          {/* Environment Template */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Environment Variables Template</h4>
              <button
                onClick={copyEnvTemplate}
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {copiedEnv ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEnv ? 'Copied!' : 'Copy template'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              Add these to your .env file (replace with your actual credentials):
            </p>
            <div className="bg-gray-900 rounded p-2 text-xs text-green-400 font-mono overflow-x-auto">
              <div># Choose one or more devices to integrate</div>
              <div>VITE_WHOOP_CLIENT_ID=your_credentials_here</div>
              <div>VITE_FITBIT_CLIENT_ID=your_credentials_here</div>
              <div>VITE_GARMIN_CONSUMER_KEY=your_credentials_here</div>
              <div>VITE_OURA_CLIENT_ID=your_credentials_here</div>
            </div>
          </div>

          {/* Device Options */}
          <div>
            <h3 className="text-lg font-medium mb-4">Choose Your Device</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="text-2xl">{device.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-medium text-base">{device.name}</h4>
                      <p className="text-sm text-gray-600">{device.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Setup difficulty:</span>
                      <span className={`font-medium ${
                        device.difficulty === 'Easy' ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {device.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Time to setup:</span>
                      <span className="font-medium">{device.timeToSetup}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {device.features.map((feature) => (
                        <span
                          key={feature}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onShowDeviceGuide(device.id)}
                    className="w-full flex items-center justify-center space-x-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                  >
                    <span>Setup {device.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2 text-sm">Need Help?</h4>
            <div className="space-y-2 text-xs text-blue-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>Each device has a step-by-step setup guide</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>Demo data works without any setup</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3" />
                <span>You can connect multiple devices</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Continue with Demo Data
          </button>
          
          <div className="text-xs text-gray-500 flex items-center">
            <span>💡 Tip: Start with demo data, add real devices later</span>
          </div>
        </div>
      </div>
    </div>
  );
}