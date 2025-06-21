import React, { useState } from 'react';
import { useWearables } from '../hooks/useWearables';
import { Smartphone, Wifi, WifiOff, RefreshCw, Settings, CheckCircle } from 'lucide-react';

export default function WearableConnections() {
  const { connections, currentData, isLoading, connectWearable, disconnectWearable, syncData } = useWearables();
  const [showSettings, setShowSettings] = useState(false);

  const handleConnect = async (wearableId: string) => {
    try {
      await connectWearable(wearableId);
    } catch (error) {
      console.error('Connection failed:', error);
      // Show user-friendly error message
    }
  };

  const handleSync = async () => {
    try {
      await syncData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (!showSettings) {
    return (
      <div className="bg-gray-900 border-4 border-cyan-400 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-cyan-400 flex items-center space-x-2">
            <Smartphone className="w-5 h-5" />
            <span>WEARABLES</span>
          </h3>
          <button
            onClick={() => setShowSettings(true)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={`border-2 p-3 text-center transition-all ${
                connection.connected
                  ? 'border-green-400 bg-green-400 bg-opacity-10'
                  : 'border-gray-600 opacity-60'
              }`}
            >
              <div className="text-2xl mb-1">{connection.icon}</div>
              <div className="text-xs font-bold text-white">{connection.name}</div>
              {connection.connected && (
                <div className="flex items-center justify-center mt-1">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
              )}
            </div>
          ))}
        </div>

        {currentData && (
          <div className="border-2 border-cyan-400 p-4 bg-cyan-400 bg-opacity-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{currentData.steps.toLocaleString()}</div>
                <div className="text-xs text-gray-400">STEPS</div>
              </div>
              {currentData.heartRate && (
                <div>
                  <div className="text-2xl font-bold text-red-400">{currentData.heartRate}</div>
                  <div className="text-xs text-gray-400">BPM</div>
                </div>
              )}
              {currentData.distance && (
                <div>
                  <div className="text-2xl font-bold text-blue-400">{currentData.distance.toFixed(1)}</div>
                  <div className="text-xs text-gray-400">KM</div>
                </div>
              )}
              {currentData.calories && (
                <div>
                  <div className="text-2xl font-bold text-orange-400">{currentData.calories}</div>
                  <div className="text-xs text-gray-400">CAL</div>
                </div>
              )}
            </div>
            <div className="mt-3 text-xs text-gray-400 text-center">
              Last sync: {currentData.lastSync.toLocaleTimeString()} • Source: {currentData.source}
            </div>
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleSync}
            disabled={isLoading || connections.filter(c => c.connected).length === 0}
            className="flex-1 bg-cyan-400 text-black px-4 py-2 font-bold hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'SYNCING...' : 'SYNC DATA'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-4 border-cyan-400 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cyan-400 flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>WEARABLE SETTINGS</span>
        </h3>
        <button
          onClick={() => setShowSettings(false)}
          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
        >
          BACK
        </button>
      </div>

      <div className="space-y-3">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="border-2 border-gray-600 p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{connection.icon}</div>
              <div>
                <div className="font-bold text-white">{connection.name}</div>
                <div className="text-xs text-gray-400">
                  {connection.connected ? (
                    <span className="text-green-400 flex items-center space-x-1">
                      <Wifi className="w-3 h-3" />
                      <span>Connected</span>
                      {connection.lastSync && (
                        <span>• Last sync: {connection.lastSync.toLocaleTimeString()}</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center space-x-1">
                      <WifiOff className="w-3 h-3" />
                      <span>Not connected</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {connection.connected ? (
                <button
                  onClick={() => disconnectWearable(connection.id)}
                  className="bg-red-600 text-white px-3 py-1 text-sm font-bold hover:bg-red-500 transition-colors"
                >
                  DISCONNECT
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(connection.id)}
                  disabled={isLoading}
                  className="bg-cyan-400 text-black px-3 py-1 text-sm font-bold hover:bg-cyan-300 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'CONNECTING...' : 'CONNECT'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gray-800 border-2 border-gray-600">
        <h4 className="font-bold text-white mb-2">Setup Instructions:</h4>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• <strong>Apple Health:</strong> Enable Health app permissions in iOS Settings</p>
          <p>• <strong>Fitbit:</strong> Authorize via Fitbit Developer Console</p>
          <p>• <strong>Garmin:</strong> Connect through Garmin Connect IQ</p>
          <p>• <strong>WHOOP:</strong> Enable API access in WHOOP app settings</p>
          <p>• <strong>Oura:</strong> Generate API token in Oura Cloud</p>
        </div>
      </div>
    </div>
  );
}