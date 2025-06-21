import React, { useState } from 'react';
import { AlertCircle, ExternalLink, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface WearableConnectionStatusProps {
  deviceType: string;
  isSimulated: boolean;
  onShowSetupGuide: () => void;
}

export default function WearableConnectionStatus({ 
  deviceType, 
  isSimulated, 
  onShowSetupGuide 
}: WearableConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isSimulated) {
    return null; // Real connection - no warning needed
  }

  return (
    <div className="mt-4 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-amber-800 text-sm">
              Simulated Connection
            </h4>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-amber-700 hover:text-amber-900 underline"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          <p className="text-sm text-amber-700 mt-1">
            This is demo data. To connect your real {deviceType}, you need to set up the API integration.
          </p>

          {showDetails && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-amber-700">
                <strong>What you're seeing:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Simulated step counts that update automatically</li>
                  <li>Mock heart rate and activity data</li>
                  <li>Fake sync status and battery levels</li>
                </ul>
              </div>
              
              <div className="text-xs text-amber-700">
                <strong>To connect your real {deviceType}:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Set up {deviceType} developer account</li>
                  <li>Configure API credentials</li>
                  <li>Grant health data permissions</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex space-x-2 mt-3">
            <button
              onClick={onShowSetupGuide}
              className="flex items-center space-x-1 text-xs bg-amber-600 text-white px-3 py-1 rounded-md hover:bg-amber-700 transition-colors"
            >
              <Settings className="w-3 h-3" />
              <span>Setup Real Connection</span>
            </button>
            
            <a
              href="https://developer.whoop.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-xs text-amber-700 hover:text-amber-900"
            >
              <ExternalLink className="w-3 h-3" />
              <span>WHOOP Developer Portal</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}