import { useState, useEffect, useCallback } from 'react';
import { useWhoop } from './useWhoop';
import {
  WearableProvider,
  type WearableDevice,
  type WearableStepData,
  type WearableConnectionStatus,
  WEARABLE_METADATA,
} from '../types/wearables';

interface UseWearablesReturn {
  devices: WearableDevice[];
  connectedDevice: WearableDevice | null;
  totalSteps: number;
  isLoading: boolean;
  connectDevice: (providerId: WearableProvider) => Promise<void>;
  disconnectDevice: (providerId: WearableProvider) => Promise<void>;
  refreshData: () => Promise<void>;
}

/**
 * Central hook for managing all wearable devices
 * Aggregates data from multiple wearable providers
 */
export function useWearables(): UseWearablesReturn {
  const whoop = useWhoop();
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize devices with metadata and status
  useEffect(() => {
    const allDevices: WearableDevice[] = Object.values(WearableProvider).map((provider) => {
      const metadata = WEARABLE_METADATA[provider];

      // Get status from provider-specific hooks
      let status: WearableConnectionStatus = {
        isConnected: false,
        isConnecting: false,
      };

      let stepData: WearableStepData | undefined;

      if (provider === WearableProvider.WHOOP) {
        status = {
          isConnected: whoop.isConnected,
          isConnecting: whoop.isConnecting,
        };

        // Add optional fields only if they exist
        if (whoop.userData?.timestamp) {
          status.lastSyncTime = new Date(whoop.userData.timestamp);
        }
        if (whoop.error) {
          status.error = whoop.error;
        }

        // Whoop provides recovery, sleep, strain, and cycle data but not step count
        // Set stepData to indicate data has loaded (steps will be estimated from strain)
        if (whoop.isConnected && !whoop.isConnecting) {
          // Estimate steps from Whoop strain data (rough approximation)
          // Strain of 10 ≈ 5000 steps, Strain of 20 ≈ 10000 steps
          const strain = whoop.userData?.cycle?.score?.strain || 0;
          const estimatedSteps = Math.round(strain * 500);

          stepData = {
            steps: estimatedSteps,
            date: new Date(),
            source: WearableProvider.WHOOP,
          };
        }
      }

      return {
        ...metadata,
        status,
        stepData,
      };
    });

    setDevices(allDevices);
  }, [whoop.isConnected, whoop.isConnecting, whoop.error, whoop.userData]);

  // Get the currently connected device (only one at a time for now)
  const connectedDevice = devices.find((d) => d.status.isConnected) || null;

  // Calculate total steps from all connected devices
  const totalSteps = devices.reduce((sum, device) => {
    return sum + (device.stepData?.steps || 0);
  }, 0);

  // Connect to a specific wearable
  const connectDevice = useCallback(async (providerId: WearableProvider) => {
    setIsLoading(true);
    try {
      if (providerId === WearableProvider.WHOOP) {
        whoop.connectWhoop();
      }
      // Add other providers here as they're implemented
    } catch (error) {
      console.error(`Failed to connect to ${providerId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [whoop]);

  // Disconnect from a specific wearable
  const disconnectDevice = useCallback(async (providerId: WearableProvider) => {
    setIsLoading(true);
    try {
      if (providerId === WearableProvider.WHOOP) {
        whoop.disconnectWhoop();
      }
      // Add other providers here as they're implemented
    } catch (error) {
      console.error(`Failed to disconnect from ${providerId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [whoop]);

  // Refresh data from all connected devices
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (whoop.isConnected) {
        await whoop.refreshData();
      }
      // Add other providers here as they're implemented
    } catch (error) {
      console.error('Failed to refresh wearable data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [whoop]);

  return {
    devices,
    connectedDevice,
    totalSteps,
    isLoading: isLoading || whoop.isConnecting,
    connectDevice,
    disconnectDevice,
    refreshData,
  };
}
