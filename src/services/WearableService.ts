/**
 * Unified Wearable Service
 * Abstract interface for all wearable providers
 */

import { WearableProvider, type WearableStepData } from '../types/wearables';

export interface WearableServiceInterface {
  // Connection management
  connect(): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;

  // Data fetching
  getStepData(date?: Date): Promise<WearableStepData | null>;
  refreshData(): Promise<void>;

  // Status
  getLastSyncTime(): Date | null;
  getError(): string | null;
}

/**
 * Extract step count from Whoop workout data
 * Whoop doesn't provide step count directly, but we can estimate from:
 * - Workout distance (if running/walking)
 * - Strain score
 * - Activity type
 */
export function estimateStepsFromWhoopData(whoopData: any): number {
  // For now, return 0 until we implement proper Whoop data parsing
  // TODO: Parse Whoop workout data to estimate steps
  // - Check for running/walking activities
  // - Use distance * average stride length
  // - Use strain score as fallback estimate

  if (!whoopData) return 0;

  // Placeholder: Return 0 for now
  // This will be replaced with actual Whoop data parsing
  return 0;
}

/**
 * Wearable Service Factory
 * Creates appropriate service based on provider
 */
export class WearableServiceFactory {
  static createService(provider: WearableProvider): WearableServiceInterface | null {
    switch (provider) {
      case WearableProvider.WHOOP:
        // Return Whoop-specific service
        // This will be implemented by wrapping the existing WhoopService
        return null; // TODO: Implement WhoopWearableService adapter

      case WearableProvider.GARMIN:
      case WearableProvider.FITBIT:
      case WearableProvider.APPLE_HEALTH:
      case WearableProvider.GOOGLE_FIT:
        // Coming soon
        return null;

      default:
        return null;
    }
  }
}
