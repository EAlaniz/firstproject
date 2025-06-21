import React, { useState, useEffect } from 'react';
import { Smartphone, Wifi, WifiOff, RefreshCw, Settings, CheckCircle2, X, Heart, Activity, Zap, Clock, AlertCircle, ExternalLink, Battery, Bluetooth, ArrowRight, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useWearables } from '../hooks/useWearables';
import WhoopRealConnectionPanel from './WhoopRealConnectionPanel';
import WearableConnectionStatus from './WearableConnectionStatus';
import WearableSetupGuide from './WearableSetupGuide';
import WearableQuickStart from './WearableQuickStart';

interface WearablesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate?: (data: any) => void;
}

export default function WearablesPanel({ isOpen, onClose, onDataUpdate }: WearablesPanelProps) {
  const { 
    connections, 
    currentData, 
    isLoading, 
    connectWearable, 
    disconnectWearable, 
    syncData,
    healthPermissions,
    requestPermissions
  } = useWearables();

  const [activeTab, setActiveTab] = useState<'devices' | 'data' | 'settings'>('devices');
  const [showPermissions, setShowPermissions] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState<'whoop' | 'fitbit' | 'garmin' | 'oura' | null>(null);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [whoopData, setWhoopData] = useState<any>(null);

  // Get connected device
  const connectedDevice = connections.find(c => c.connected);
  const availableDevices = connections.filter(c => !c.connected);

  // Check if we have real API credentials
  const hasWhoopCredentials = !!(import.meta.env.VITE_WHOOP_CLIENT_ID && import.meta.env.VITE_WHOOP_CLIENT_SECRET);
  const hasFitbitCredentials = !!import.meta.env.VITE_FITBIT_CLIENT_ID;
  const hasGarminCredentials = !!import.meta.env.VITE_GARMIN_CONSUMER_KEY;
  const hasOuraCredentials = !!import.meta.env.VITE_OURA_CLIENT_ID;

  // Update parent component when data changes
  useEffect(() => {
    const dataToSend = whoopData || currentData;
    if (dataToSend && onDataUpdate) {
      onDataUpdate(dataToSend);
    }
  }, [whoopData, currentData, onDataUpdate]);

  const handleConnect = async (wearableId: string) => {
    try {
      // Check if this is a real connection or simulation
      const hasCredentials = getDeviceCredentialStatus(wearableId);
      
      if (!hasCredentials) {
        setShowSetupGuide(wearableId as any);
        return;
      }
      
      await connectWearable(wearableId);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const getDeviceCredentialStatus = (deviceId: string) => {
    switch (deviceId) {
      case 'whoop': return hasWhoopCredentials;
      case 'fitbit': return hasFitbitCredentials;
      case 'garmin': return hasGarminCredentials;
      case 'oura': return hasOuraCredentials;
      case 'apple_health': return true; // Available on iOS
      case 'google_fit': return true; // Available on Android
      case 'samsung_health': return true; // Available on Samsung devices
      default: return false;
    }
  };

  const handleDisconnect = (wearableId: string) => {
    disconnectWearable(wearableId);
  };

  const handleSync = async () => {
    try {
      await syncData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      await requestPermissions();
      setShowPermissions(false);
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-4xl h-[90vh] sm:h-[80vh] flex overflow-hidden sm:rounded-2xl rounded-t-2xl">
        {/* Sidebar */}
        <div className="w-full sm:w-80 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-medium">Wearables</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('devices')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'devices'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Devices
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'data'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Data
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {activeTab === 'devices' && (
              <div className="space-y-4">
                {/* WHOOP Real Connection */}
                <WhoopRealConnectionPanel onDataUpdate={setWhoopData} />
                
                {/* Other Devices */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm text-gray-700">Other Devices</h3>
                  {connections.filter(c => c.id !== 'whoop').map((connection) => (
                    <div
                      key={connection.id}
                      className={`border-2 p-3 sm:p-4 rounded-lg transition-all ${
                        connection.connected
                          ? 'border-green-400 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl sm:text-2xl">{connection.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm sm:text-base">{connection.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600">{connection.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {connection.connected ? (
                                <>
                                  <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                  <span className="text-xs text-green-700">Connected</span>
                                  {connection.lastSync && (
                                    <span className="text-xs text-gray-500">
                                      • {connection.lastSync.toLocaleTimeString()}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                  <span className="text-xs text-gray-500">Not connected</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {connection.connected ? (
                            <button
                              onClick={() => handleDisconnect(connection.id)}
                              className="px-2 sm:px-3 py-1 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm"
                            >
                              Disconnect
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConnect(connection.id)}
                              disabled={isLoading}
                              className="px-2 sm:px-3 py-1 sm:py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-xs sm:text-sm"
                            >
                              {isLoading ? 'Connecting...' : 'Connect'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Connection Status */}
                      <WearableConnectionStatus
                        deviceType={connection.name}
                        isSimulated={!getDeviceCredentialStatus(connection.id)}
                        onShowSetupGuide={() => setShowSetupGuide(connection.id as any)}
                      />
                    </div>
                  ))}
                </div>

                {/* Quick Start Button */}
                <button
                  onClick={() => setShowQuickStart(true)}
                  className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Setup Guide</span>
                </button>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                {(whoopData || currentData) ? (
                  <div className="space-y-4">
                    {/* Current Data Display */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-black">
                          {(whoopData?.steps || currentData?.steps || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Steps</div>
                      </div>
                      
                      {(whoopData?.heartRate || currentData?.heartRate) && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-500">
                            {whoopData?.heartRate || currentData?.heartRate}
                          </div>
                          <div className="text-xs text-gray-600">Heart Rate</div>
                        </div>
                      )}
                      
                      {(whoopData?.distance || currentData?.distance) && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-500">
                            {((whoopData?.distance || currentData?.distance) || 0).toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-600">Distance (km)</div>
                        </div>
                      )}
                      
                      {(whoopData?.calories || currentData?.calories) && (
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-500">
                            {Math.round(whoopData?.calories || currentData?.calories || 0)}
                          </div>
                          <div className="text-xs text-gray-600">Calories</div>
                        </div>
                      )}
                    </div>

                    {/* WHOOP-specific data */}
                    {whoopData && (
                      <div className="space-y-3">
                        <h3 className="font-medium text-sm">WHOOP Metrics</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {whoopData.recoveryScore && (
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                {whoopData.recoveryScore}%
                              </div>
                              <div className="text-xs text-gray-600">Recovery</div>
                            </div>
                          )}
                          
                          {whoopData.strain && (
                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                              <div className="text-2xl font-bold text-orange-600">
                                {whoopData.strain.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-600">Strain</div>
                            </div>
                          )}
                          
                          {whoopData.hrv && (
                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                              <div className="text-2xl font-bold text-purple-600">
                                {whoopData.hrv}
                              </div>
                              <div className="text-xs text-gray-600">HRV (ms)</div>
                            </div>
                          )}
                          
                          {whoopData.spo2 && (
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                {whoopData.spo2}%
                              </div>
                              <div className="text-xs text-gray-600">SpO2</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Last Sync */}
                    <div className="text-center text-xs text-gray-500">
                      Last sync: {(whoopData?.lastSync || currentData?.lastSync)?.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No data available</p>
                    <p className="text-xs text-gray-400">Connect a device to see your metrics</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4">
                {/* Permissions */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Health Permissions</h3>
                  <div className="space-y-2">
                    {Object.entries(healthPermissions).map(([key, granted]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <div className="flex items-center space-x-2">
                          {granted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!healthPermissions.granted && (
                    <button
                      onClick={handleRequestPermissions}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                    >
                      {isLoading ? 'Requesting...' : 'Request Permissions'}
                    </button>
                  )}
                </div>

                {/* Sync Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Sync Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-sync interval</span>
                      <span className="text-sm text-gray-600">5 minutes</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background sync</span>
                      <span className="text-sm text-green-600">Enabled</span>
                    </div>
                  </div>
                </div>

                {/* Manual Sync */}
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="hidden sm:flex flex-1 items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="font-medium mb-2">Wearable Devices</h3>
              <p className="text-sm text-gray-600 max-w-md">
                Connect your fitness trackers and smartwatches to automatically sync your health data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showSetupGuide && (
        <WearableSetupGuide
          deviceType={showSetupGuide}
          onClose={() => setShowSetupGuide(null)}
        />
      )}

      {showQuickStart && (
        <WearableQuickStart
          onClose={() => setShowQuickStart(false)}
          onShowDeviceGuide={(deviceType) => {
            setShowQuickStart(false);
            setShowSetupGuide(deviceType);
          }}
        />
      )}
    </div>
  );
}