import { useState, useEffect, useCallback } from 'react';
import { healthService, type StepData } from '../services/HealthService';

interface UseHealthDataReturn {
  todaySteps: number;
  stepData: StepData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  isNative: boolean;
  requestPermissions: () => Promise<void>;
  refreshSteps: () => Promise<void>;
  openHealthSettings: () => Promise<void>;
}

/**
 * React hook for accessing health data (step count)
 * Handles permissions, loading states, and errors
 */
export function useHealthData(): UseHealthDataReturn {
  const [stepData, setStepData] = useState<StepData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const isNative = healthService.isAvailable();

  /**
   * Request health permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Requesting health permissions...');
      const result = await healthService.requestPermissions();

      setHasPermission(result.granted);

      if (result.granted) {
        // If permission granted, fetch steps immediately
        await refreshSteps();
      } else {
        setError('Permission denied. Please grant access to health data in your device settings.');
      }
    } catch (err) {
      console.error('❌ Error requesting permissions:', err);
      setError('Failed to request permissions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch today's step count
   */
  const refreshSteps = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching step data...');
      const data = await healthService.getTodaySteps();

      setStepData(data);
      console.log('✅ Step data loaded:', data);
    } catch (err) {
      console.error('❌ Error fetching steps:', err);
      setError('Failed to fetch step data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Open device health settings
   */
  const openHealthSettings = useCallback(async () => {
    await healthService.openHealthSettings();
  }, []);

  /**
   * Initialize - check permissions and fetch data
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Check if health data is available
        if (!isNative) {
          console.log('🌐 Running on web, using mock data');
          setHasPermission(false);
          await refreshSteps(); // Will use mock data
          return;
        }

        // Check existing permissions
        console.log('🔍 Checking health permissions...');
        const permitted = await healthService.checkPermissions();
        setHasPermission(permitted);

        if (permitted) {
          // If we have permission, fetch steps
          await refreshSteps();
        } else {
          console.log('⚠️ No health permission - user needs to grant access');
          setError('Health data permission not granted');
        }
      } catch (err) {
        console.error('❌ Error initializing health data:', err);
        setError('Failed to initialize health data');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [isNative, refreshSteps]);

  /**
   * Auto-refresh steps every 5 minutes
   */
  useEffect(() => {
    if (!hasPermission && isNative) {
      return; // Don't auto-refresh if no permission
    }

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing step data...');
      refreshSteps();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [hasPermission, isNative, refreshSteps]);

  return {
    todaySteps: stepData?.steps || 0,
    stepData,
    isLoading,
    error,
    hasPermission,
    isNative,
    requestPermissions,
    refreshSteps,
    openHealthSettings,
  };
}
