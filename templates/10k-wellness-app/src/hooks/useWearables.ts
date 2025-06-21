import { useState, useEffect, useCallback } from 'react';

export interface WearableData {
  steps: number;
  heartRate?: number;
  distance?: number;
  calories?: number;
  activeMinutes?: number;
  sleepHours?: number;
  lastSync: Date;
  source: 'apple_health' | 'fitbit' | 'garmin' | 'whoop' | 'oura' | 'google_fit' | 'samsung_health' | 'manual';
  batteryLevel?: number;
}

export interface WearableConnection {
  id: string;
  name: string;
  type: 'apple_health' | 'fitbit' | 'garmin' | 'whoop' | 'oura' | 'google_fit' | 'samsung_health';
  connected: boolean;
  lastSync?: Date;
  icon: string;
  description: string;
  requiresPermission?: boolean;
  batteryLevel?: number;
  firmwareVersion?: string;
}

export interface HealthPermissions {
  granted: boolean;
  steps: boolean;
  heartRate: boolean;
  distance: boolean;
  calories: boolean;
  sleep: boolean;
}

export function useWearables() {
  const [connections, setConnections] = useState<WearableConnection[]>([
    {
      id: 'apple_health',
      name: 'Apple Health',
      type: 'apple_health',
      connected: false,
      icon: '🍎',
      description: 'iPhone Health app integration',
      requiresPermission: true
    },
    {
      id: 'fitbit',
      name: 'Fitbit',
      type: 'fitbit',
      connected: false,
      icon: '⌚',
      description: 'Fitbit devices and app',
      requiresPermission: true
    },
    {
      id: 'garmin',
      name: 'Garmin',
      type: 'garmin',
      connected: false,
      icon: '🏃',
      description: 'Garmin Connect platform',
      requiresPermission: true
    },
    {
      id: 'whoop',
      name: 'WHOOP',
      type: 'whoop',
      connected: false,
      icon: '💪',
      description: 'WHOOP fitness tracker',
      requiresPermission: true
    },
    {
      id: 'oura',
      name: 'Oura Ring',
      type: 'oura',
      connected: false,
      icon: '💍',
      description: 'Oura smart ring',
      requiresPermission: true
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      type: 'google_fit',
      connected: false,
      icon: '🔵',
      description: 'Google Fit platform',
      requiresPermission: true
    },
    {
      id: 'samsung_health',
      name: 'Samsung Health',
      type: 'samsung_health',
      connected: false,
      icon: '📱',
      description: 'Samsung Health app',
      requiresPermission: true
    }
  ]);

  const [currentData, setCurrentData] = useState<WearableData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [healthPermissions, setHealthPermissions] = useState<HealthPermissions>({
    granted: false,
    steps: false,
    heartRate: false,
    distance: false,
    calories: false,
    sleep: false
  });

  // Check for available wearable APIs and stored connections
  useEffect(() => {
    checkAvailableWearables();
    loadStoredConnections();
  }, []);

  const checkAvailableWearables = async () => {
    // Check for Apple Health (iOS Safari/WebView)
    if (typeof window !== 'undefined') {
      // Check for iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        updateConnectionAvailability('apple_health', true);
      }

      // Check for Android
      const isAndroid = /Android/.test(navigator.userAgent);
      if (isAndroid) {
        updateConnectionAvailability('google_fit', true);
        updateConnectionAvailability('samsung_health', true);
      }

      // Check for Web Bluetooth (for some wearables)
      if ('bluetooth' in navigator) {
        console.log('Web Bluetooth available for direct device connections');
      }

      // Check for Web NFC (for some wearables)
      if ('NDEFReader' in window) {
        console.log('Web NFC available for device pairing');
      }
    }
  };

  const loadStoredConnections = () => {
    try {
      const storedConnections = localStorage.getItem('wearable_connections');
      const storedPermissions = localStorage.getItem('health_permissions');
      
      if (storedConnections) {
        const parsed = JSON.parse(storedConnections);
        setConnections(prev => prev.map(conn => ({
          ...conn,
          connected: parsed[conn.id]?.connected || false,
          lastSync: parsed[conn.id]?.lastSync ? new Date(parsed[conn.id].lastSync) : undefined,
          batteryLevel: parsed[conn.id]?.batteryLevel
        })));
      }

      if (storedPermissions) {
        setHealthPermissions(JSON.parse(storedPermissions));
      }
    } catch (error) {
      console.error('Failed to load stored connections:', error);
    }
  };

  const updateConnectionAvailability = (wearableId: string, available: boolean) => {
    setConnections(prev => prev.map(conn => 
      conn.id === wearableId 
        ? { ...conn, available }
        : conn
    ));
  };

  const updateConnectionStatus = (wearableId: string, connected: boolean, additionalData?: any) => {
    setConnections(prev => prev.map(conn => 
      conn.id === wearableId 
        ? { 
            ...conn, 
            connected, 
            lastSync: connected ? new Date() : undefined,
            ...additionalData
          }
        : conn
    ));

    // Save to localStorage
    const connectionData = connections.reduce((acc, conn) => {
      acc[conn.id] = { 
        connected: conn.connected, 
        lastSync: conn.lastSync,
        batteryLevel: conn.batteryLevel
      };
      return acc;
    }, {} as Record<string, any>);
    
    localStorage.setItem('wearable_connections', JSON.stringify(connectionData));
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    
    try {
      // Simulate permission request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newPermissions: HealthPermissions = {
        granted: true,
        steps: true,
        heartRate: true,
        distance: true,
        calories: true,
        sleep: true
      };
      
      setHealthPermissions(newPermissions);
      localStorage.setItem('health_permissions', JSON.stringify(newPermissions));
      
      console.log('Health permissions granted');
    } catch (error) {
      console.error('Permission request failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const connectWearable = async (wearableId: string) => {
    setIsLoading(true);
    
    try {
      switch (wearableId) {
        case 'apple_health':
          await connectAppleHealth();
          break;
        case 'fitbit':
          await connectFitbit();
          break;
        case 'garmin':
          await connectGarmin();
          break;
        case 'whoop':
          await connectWhoop();
          break;
        case 'oura':
          await connectOura();
          break;
        case 'google_fit':
          await connectGoogleFit();
          break;
        case 'samsung_health':
          await connectSamsungHealth();
          break;
        default:
          throw new Error('Unsupported wearable');
      }
      
      updateConnectionStatus(wearableId, true, {
        batteryLevel: Math.floor(Math.random() * 40) + 60, // Mock battery level
        firmwareVersion: '1.0.0'
      });
      
      // Trigger initial sync
      await syncData();
      
    } catch (error) {
      console.error(`Failed to connect ${wearableId}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWearable = (wearableId: string) => {
    updateConnectionStatus(wearableId, false);
    
    // Clear stored tokens
    localStorage.removeItem(`${wearableId}_token`);
    localStorage.removeItem(`${wearableId}_refresh_token`);
    
    console.log(`Disconnected ${wearableId}`);
  };

  const syncData = async () => {
    setIsLoading(true);
    
    try {
      const connectedWearables = connections.filter(conn => conn.connected);
      
      if (connectedWearables.length === 0) {
        // Use simulated data if no wearables connected
        const simulatedData = generateSimulatedData();
        setCurrentData(simulatedData);
        return simulatedData;
      }

      // Try to sync from the most recently connected wearable
      const latestWearable = connectedWearables.sort((a, b) => 
        (b.lastSync?.getTime() || 0) - (a.lastSync?.getTime() || 0)
      )[0];

      const data = await fetchWearableData(latestWearable.type);
      setCurrentData(data);
      
      // Update last sync time
      updateConnectionStatus(latestWearable.id, true, { lastSync: new Date() });
      
      return data;
    } catch (error) {
      console.error('Failed to sync wearable data:', error);
      
      // Fallback to simulated data
      const simulatedData = generateSimulatedData();
      setCurrentData(simulatedData);
      return simulatedData;
    } finally {
      setIsLoading(false);
    }
  };

  // Individual wearable connection functions
  const connectAppleHealth = async () => {
    if (typeof window === 'undefined' || !('HealthKit' in window)) {
      // For web implementation, we'll simulate the connection
      console.log('Simulating Apple Health connection...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }

    // In a real iOS app, this would use HealthKit
    // For web, we simulate the process
    console.log('Connecting to Apple Health...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const connectFitbit = async () => {
    const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
    
    if (!clientId) {
      // Simulate connection for demo
      console.log('Simulating Fitbit connection...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return;
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/fitbit');
    const scope = 'activity heartrate location nutrition profile settings sleep social weight';
    
    const authUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    // Open auth window
    const authWindow = window.open(authUrl, 'fitbit-auth', 'width=600,height=600');
    
    // Listen for auth completion
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          resolve(true);
        }
      }, 1000);
      
      setTimeout(() => {
        clearInterval(checkClosed);
        if (authWindow && !authWindow.closed) {
          authWindow.close();
        }
        resolve(true); // Simulate success for demo
      }, 5000);
    });
  };

  const connectGarmin = async () => {
    console.log('Connecting to Garmin Connect...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const connectWhoop = async () => {
    console.log('Connecting to WHOOP...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const connectOura = async () => {
    console.log('Connecting to Oura Ring...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const connectGoogleFit = async () => {
    console.log('Connecting to Google Fit...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const connectSamsungHealth = async () => {
    console.log('Connecting to Samsung Health...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  const fetchWearableData = async (wearableType: string): Promise<WearableData> => {
    // In a real implementation, this would fetch actual data from the APIs
    // For now, return realistic simulated data
    
    const baseSteps = 7240;
    const stepVariation = Math.floor(Math.random() * 3000);
    const steps = baseSteps + stepVariation;
    
    return {
      steps,
      heartRate: 68 + Math.floor(Math.random() * 25), // 68-93 BPM
      distance: steps * 0.0008, // Rough km conversion
      calories: Math.floor(steps * 0.04), // Rough calorie conversion
      activeMinutes: Math.floor(steps / 100), // Rough active minutes
      sleepHours: 7 + Math.random() * 2, // 7-9 hours
      lastSync: new Date(),
      source: wearableType as any,
      batteryLevel: Math.floor(Math.random() * 40) + 60 // 60-100%
    };
  };

  const generateSimulatedData = (): WearableData => {
    const baseSteps = 7240;
    const stepVariation = Math.floor(Math.random() * 2000);
    const steps = baseSteps + stepVariation;
    
    return {
      steps,
      heartRate: 72 + Math.floor(Math.random() * 20),
      distance: steps * 0.0008,
      calories: Math.floor(steps * 0.04),
      activeMinutes: Math.floor(steps / 100),
      sleepHours: 7.5 + Math.random() * 1.5,
      lastSync: new Date(),
      source: 'manual',
      batteryLevel: 85
    };
  };

  // Auto-sync every 5 minutes if connected
  useEffect(() => {
    const connectedDevices = connections.filter(c => c.connected);
    if (connectedDevices.length === 0) return;

    const interval = setInterval(async () => {
      try {
        await syncData();
        console.log('Auto-sync completed');
      } catch (error) {
        console.error('Auto-sync failed:', error);
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [connections]);

  return {
    connections,
    currentData,
    isLoading,
    healthPermissions,
    connectWearable,
    disconnectWearable,
    syncData,
    requestPermissions,
    checkAvailableWearables
  };
}