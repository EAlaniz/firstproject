/**
 * Wearable device types and interfaces
 * Supports multiple fitness tracking devices
 */

export enum WearableProvider {
  WHOOP = 'whoop',
  GARMIN = 'garmin',
  FITBIT = 'fitbit',
  APPLE_HEALTH = 'apple_health',
  GOOGLE_FIT = 'google_fit',
}

export interface WearableMetadata {
  id: WearableProvider;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  color: string; // brand color
  comingSoon?: boolean;
}

export interface WearableConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  lastSyncTime?: Date;
  error?: string;
}

export interface WearableStepData {
  steps: number;
  date: Date;
  source: WearableProvider;
}

export interface WearableDevice extends WearableMetadata {
  status: WearableConnectionStatus;
  stepData?: WearableStepData;
}

export const WEARABLE_METADATA: Record<WearableProvider, WearableMetadata> = {
  [WearableProvider.WHOOP]: {
    id: WearableProvider.WHOOP,
    name: 'WHOOP',
    description: 'Premium fitness and recovery tracker',
    icon: '🔴',
    color: '#FF3B30',
  },
  [WearableProvider.GARMIN]: {
    id: WearableProvider.GARMIN,
    name: 'Garmin',
    description: 'GPS smartwatches and fitness trackers',
    icon: '🔵',
    color: '#007CC3',
    comingSoon: true,
  },
  [WearableProvider.FITBIT]: {
    id: WearableProvider.FITBIT,
    name: 'Fitbit',
    description: 'Activity trackers and smartwatches',
    icon: '🟢',
    color: '#00B0B9',
    comingSoon: true,
  },
  [WearableProvider.APPLE_HEALTH]: {
    id: WearableProvider.APPLE_HEALTH,
    name: 'Apple Health',
    description: 'iPhone health and fitness data',
    icon: '🍎',
    color: '#FF2D55',
    comingSoon: true,
  },
  [WearableProvider.GOOGLE_FIT]: {
    id: WearableProvider.GOOGLE_FIT,
    name: 'Google Fit',
    description: 'Android health and fitness data',
    icon: '🏃',
    color: '#4285F4',
    comingSoon: true,
  },
};
