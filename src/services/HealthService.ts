// Web-only HealthService for Base Mini App. Native integrations removed for lean build.

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
    this.isNative = false;
    this.platform = 'web';
    console.log('🏥 HealthService initialized', { isNative: this.isNative, platform: this.platform });
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

    return { granted: false, platform: this.platform };
  }

  /**
   * Check if we have permission to access health data
   */
  async checkPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return false;
  }

  /**
   * Get step count for today
   */
  async getTodaySteps(): Promise<StepData> {
    if (!this.isAvailable()) {
      console.log('🌐 Using mock data for web platform');
      return this.getMockSteps();
    }

    return this.getMockSteps();
  }

  /**
   * Get step count for a specific date
   */
  async getStepsForDate(date: Date): Promise<StepData> {
    if (!this.isAvailable()) {
      return this.getMockSteps();
    }

    return this.getMockSteps();
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

    return Array.from({ length: days }, (_, i) => {
      const dateItem = new Date();
      dateItem.setDate(dateItem.getDate() - i);
      return {
        steps: Math.floor(Math.random() * 5000) + 5000,
        date: dateItem,
        source: 'mock' as const
      };
    });
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

    return;
  }
}

// Export singleton instance
export const healthService = new HealthService();
