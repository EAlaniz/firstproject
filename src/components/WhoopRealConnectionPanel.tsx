import React, { useState } from 'react';
import { useWhoopRealConnection } from '../hooks/useWhoopRealConnection';
import { AlertCircle, CheckCircle, RefreshCw, Wifi, WifiOff, Heart, Activity, Zap, TrendingUp, User, Settings } from 'lucide-react';

interface WhoopRealConnectionPanelProps {
  onDataUpdate?: (data: any) => void;
}

export default function WhoopRealConnectionPanel({ onDataUpdate }: WhoopRealConnectionPanelProps) {
  const {
    isConnected,
    isLoading,
    userData,
    recoveryData,
    workoutData,
    connectionError,
    hasRealCredentials,
    connectWhoop,
    disconnectWhoop,
    syncData,
    getStandardizedData
  } = useWhoopRealConnection();

  const [showDetails, setShowDetails] = useState(false);

  // Update parent component when data changes
  React.useEffect(() => {
    const standardizedData = getStandardizedData();
    if (standardizedData && onDataUpdate) {
      onDataUpdate(standardizedData);
    }
  }, [recoveryData, workoutData, onDataUpdate]);

  const handleConnect = async () => {
    try {
      await connectWhoop();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleSync = async () => {
    try {
      await syncData();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  if (!hasRealCredentials) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-800 text-sm mb-2">
              WHOOP Credentials Required
            </h4>
            <p className="text-sm text-amber-700 mb-3">
              To connect your real WHOOP device, you need to add your API credentials to the .env file.
            </p>
            <div className="bg-amber-100 rounded p-2 text-xs font-mono text-amber-800 mb-3">
              <div>VITE_WHOOP_CLIENT_ID=your_actual_client_id</div>
              <div>VITE_WHOOP_CLIENT_SECRET=your_actual_client_secret</div>
            </div>
            <p className="text-xs text-amber-600">
              After adding credentials, restart your development server: <code>npm run dev</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className={`border-2 rounded-lg p-4 ${
        isConnected 
          ? 'border-green-400 bg-green-50' 
          : connectionError 
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">💪</div>
            <div>
              <h3 className="font-medium text-base">WHOOP Device</h3>
              <div className="flex items-center space-x-2 text-sm">
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-green-700">Connected</span>
                    {userData && (
                      <span className="text-gray-500">• {userData.first_name} {userData.last_name}</span>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            {isConnected && (
              <button
                onClick={handleSync}
                disabled={isLoading}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Sync Data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {isConnected ? (
              <button
                onClick={disconnectWhoop}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        </div>

        {/* Connection Error */}
        {connectionError && (
          <div className="p-3 bg-red-100 border border-red-200 rounded-lg mb-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Connection Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{connectionError}</p>
          </div>
        )}

        {/* Data Display */}
        {isConnected && (recoveryData || workoutData.length > 0) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Today's Data</h4>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recoveryData && (
                <>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-green-600">
                      {recoveryData.score?.recovery_score || 'N/A'}%
                    </div>
                    <div className="text-xs text-gray-500">Recovery</div>
                  </div>
                  
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-red-500">
                      {recoveryData.score?.resting_heart_rate || 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">RHR (BPM)</div>
                  </div>
                </>
              )}

              {workoutData.length > 0 && (
                <>
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-orange-500">
                      {workoutData.reduce((max, w) => Math.max(max, w.score?.strain || 0), 0).toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">Max Strain</div>
                  </div>
                  
                  <div className="text-center p-2 bg-white rounded border">
                    <div className="text-lg font-bold text-blue-500">
                      {workoutData.length}
                    </div>
                    <div className="text-xs text-gray-500">Workouts</div>
                  </div>
                </>
              )}
            </div>

            {showDetails && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                {recoveryData && (
                  <div className="p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm mb-2 flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span>Recovery Data</span>
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>HRV: {recoveryData.score?.hrv_rmssd_milli || 'N/A'} ms</div>
                      <div>SpO2: {recoveryData.score?.spo2_percentage || 'N/A'}%</div>
                      <div>Skin Temp: {recoveryData.score?.skin_temp_celsius || 'N/A'}°C</div>
                      <div>State: {recoveryData.score_state}</div>
                    </div>
                  </div>
                )}

                {workoutData.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm mb-2 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      <span>Workout Data</span>
                    </h5>
                    <div className="space-y-2">
                      {workoutData.slice(0, 3).map((workout, index) => (
                        <div key={workout.id} className="text-xs border-l-2 border-blue-400 pl-2">
                          <div className="font-medium">
                            Workout {index + 1} • Strain: {workout.score?.strain || 'N/A'}
                          </div>
                          <div className="text-gray-600">
                            Distance: {((workout.score?.distance_meter || 0) / 1000).toFixed(2)} km • 
                            Calories: {((workout.score?.kilojoule || 0) * 0.239).toFixed(0)} cal
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* No Data Message */}
        {isConnected && !recoveryData && workoutData.length === 0 && !isLoading && (
          <div className="text-center py-4 text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No data available for today</p>
            <p className="text-xs">Complete a workout or wait for recovery data to sync</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {!isConnected && !connectionError && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2 text-sm">Ready to Connect!</h4>
          <div className="space-y-2 text-xs text-blue-700">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3" />
              <span>WHOOP credentials configured</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3" />
              <span>OAuth flow ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-3 h-3" />
              <span>Real-time data sync enabled</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Click "Connect" to authorize access to your WHOOP data
          </p>
        </div>
      )}
    </div>
  );
}