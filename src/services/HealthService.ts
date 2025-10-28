import { Capacitor } from '@capacitor/core';
import { Health } from 'capacitor-health';

/**
 * Health Service
 * Provides unified interface for reading health data across platforms
 * - iOS: Uses HealthKit
 * - Android: Uses Health Connect
 * - Web: Returns mock data / manual entry
 */

export interface StepData {
  steps: number;
  date: Date;
  source: 'healthkit' | 'health-connect' | 'manual' | 'mock';
}

export interface HealthPermissionStatus {
  granted: boolean;
  platform: 'ios' | 'android' | 'web';
}

class HealthService {
  private isNative: boolean;
  private platform: 'ios' | 'android' | 'web';

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';

    console.log('🏥 HealthService initialized', {
      isNative: this.isNative,
      platform: this.platform
    });
  }

  /**
   * Check if health data is available on this platform
   */
  isAvailable(): boolean {
    return this.isNative && (this.platform === 'ios' || this.platform === 'android');
  }

  /**
   * Request permission to access health data
   */
  async requestPermissions(): Promise<HealthPermissionStatus> {
    if (!this.isAvailable()) {
      console.log('⚠️ Health data not available on web platform');
      return { granted: false, platform: this.platform };
    }

    try {
      console.log('📱 Requesting health permissions...');

      // Request read permission for steps
      await Health.requestAuthorization({
        read: ['steps'],
        write: [] // We only need to read, not write
      });

      console.log('✅ Health permissions granted');
      return { granted: true, platform: this.platform };
    } catch (error) {
      console.error('❌ Failed to request health permissions:', error);
      return { granted: false, platform: this.platform };
    }
  }

  /**
   * Check if we have permission to access health data
   */
  async checkPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      // Note: capacitor-health doesn't have a direct "check" method
      // We'll attempt to read data and catch permission errors
      const hasPermission = await Health.isAvailable();
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking health permissions:', error);
      return false;
    }
  }

  /**
   * Get step count for today
   */
  async getTodaySteps(): Promise<StepData> {
    if (!this.isAvailable()) {
      console.log('🌐 Using mock data for web platform');
      return this.getMockSteps();
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endDate = new Date();

      console.log('📊 Querying step data...', {
        startDate: today,
        endDate
      });

      // Query steps from the native health API
      const result = await Health.queryAggregated({
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        dataType: 'steps'
      });

      const steps = result.value || 0;
      const source = this.platform === 'ios' ? 'healthkit' : 'health-connect';

      console.log('✅ Step data retrieved:', { steps, source });

      return {
        steps,
        date: new Date(),
        source
      };
    } catch (error) {
      console.error('❌ Failed to get step data:', error);

      // If permission denied or other error, return mock data
      return this.getMockSteps();
    }
  }

  /**
   * Get step count for a specific date
   */
  async getStepsForDate(date: Date): Promise<StepData> {
    if (!this.isAvailable()) {
      return this.getMockSteps();
    }

    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      console.log('📊 Querying step data for date:', {
        date: date.toLocaleDateString(),
        startDate,
        endDate
      });

      const result = await Health.queryAggregated({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataType: 'steps'
      });

      const steps = result.value || 0;
      const source = this.platform === 'ios' ? 'healthkit' : 'health-connect';

      return {
        steps,
        date,
        source
      };
    } catch (error) {
      console.error('❌ Failed to get step data for date:', error);
      return this.getMockSteps();
    }
  }

  /**
   * Get step history for the last N days
   */
  async getStepHistory(days: number = 7): Promise<StepData[]> {
    if (!this.isAvailable()) {
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          steps: Math.floor(Math.random() * 5000) + 5000,
          date,
          source: 'mock' as const
        };
      });
    }

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      console.log('📊 Querying step history...', {
        days,
        startDate,
        endDate
      });

      // Query historical data
      const result = await Health.query({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        dataType: 'steps'
      });

      // Process and aggregate by day
      const stepsByDay = new Map<string, number>();

      result.forEach((record: any) => {
        const date = new Date(record.startDate);
        const dateKey = date.toLocaleDateString();
        const currentSteps = stepsByDay.get(dateKey) || 0;
        stepsByDay.set(dateKey, currentSteps + (record.value || 0));
      });

      const source = this.platform === 'ios' ? 'healthkit' : 'health-connect';

      // Convert to array
      const history: StepData[] = Array.from(stepsByDay.entries()).map(([dateStr, steps]) => ({
        steps,
        date: new Date(dateStr),
        source
      }));

      console.log('✅ Step history retrieved:', history.length, 'days');

      return history;
    } catch (error) {
      console.error('❌ Failed to get step history:', error);

      // Return mock data on error
      return Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          steps: Math.floor(Math.random() * 5000) + 5000,
          date,
          source: 'mock' as const
        };
      });
    }
  }

  /**
   * Get mock step data (for web or when health data unavailable)
   */
  private getMockSteps(): StepData {
    // Return a random number between 5000-12000 for demo purposes
    const steps = Math.floor(Math.random() * 7000) + 5000;
    return {
      steps,
      date: new Date(),
      source: 'mock'
    };
  }

  /**
   * Open device health settings
   * (iOS: Health app, Android: Health Connect app)
   */
  async openHealthSettings(): Promise<void> {
    if (!this.isAvailable()) {
      console.log('⚠️ Health settings not available on web');
      return;
    }

    try {
      // Note: This might require additional plugin or deep link implementation
      console.log('🔧 Opening health settings...');

      if (this.platform === 'ios') {
        // Open iOS Health app (requires app-prefs: URL scheme)
        window.open('x-apple-health://', '_system');
      } else if (this.platform === 'android') {
        // Open Android Health Connect
        window.open('healthconnect://home', '_system');
      }
    } catch (error) {
      console.error('❌ Failed to open health settings:', error);
    }
  }
}

// Export singleton instance
export const healthService = new HealthService();
