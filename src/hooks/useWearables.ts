import { useState, useEffect, useCallback } from 'react';
import { useWhoop } from './useWhoop';
import {
  WearableProvider,
  type WearableDevice,
  type WearableStepData,
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
      let status = {
        isConnected: false,
        isConnecting: false,
        lastSyncTime: undefined,
        error: undefined,
      };

      let stepData: WearableStepData | undefined;

      if (provider === WearableProvider.WHOOP) {
        status = {
          isConnected: whoop.isConnected,
          isConnecting: whoop.isConnecting,
          lastSyncTime: whoop.userData?.updated_at ? new Date(whoop.userData.updated_at) : undefined,
          error: whoop.error || undefined,
        };

        // Extract step data from Whoop if available
        // Note: Whoop doesn't provide step count directly, but we can calculate from strain/activity
        if (whoop.userData) {
          stepData = {
            steps: 0, // TODO: Calculate from Whoop activity data
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
