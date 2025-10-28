/**
 * Whoop Service
 * Handles OAuth authentication and data syncing with Whoop API v2
 *
 * Whoop Data Types:
 * - Recovery: Recovery score (0-100%), HRV, RHR
 * - Sleep: Sleep performance, stages, duration
 * - Strain: Daily strain score, workouts
 * - Cycles: Physiological cycles (day summaries)
 */

export interface WhoopConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface WhoopTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WhoopRecovery {
  cycle_id: string;
  sleep_id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: 'SCORED' | 'PENDING';
  score: {
    user_calibrating: boolean;
    recovery_score: number; // 0-100
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
}

export interface WhoopSleep {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: 'SCORED' | 'PENDING';
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number; // 0-100
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export interface WhoopWorkout {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: 'SCORED' | 'PENDING';
  score: {
    strain: number; // 0-21
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter?: number;
    altitude_gain_meter?: number;
    altitude_change_meter?: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

export interface WhoopCycle {
  id: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: 'SCORED' | 'PENDING';
  score: {
    strain: number; // 0-21 daily strain
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

export interface WhoopUserProfile {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

class WhoopService {
  private config: WhoopConfig;
  private baseUrl = 'https://api.prod.whoop.com';

  constructor(config: WhoopConfig) {
    this.config = config;
  }

  /**
   * Get Whoop OAuth authorization URL
   * User clicks this to start OAuth flow
   */
  getAuthorizationUrl(state?: string): string {
    // Generate a random state with at least 8 characters if not provided
    const oauthState = state || (Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'read:recovery read:cycles read:workout read:sleep read:profile offline',
      state: oauthState
    });

    return `${this.baseUrl}/oauth/oauth2/auth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   * Called after user authorizes and returns to redirect URI
   * Uses serverless function to avoid CORS issues
   */
  async exchangeCodeForTokens(code: string): Promise<WhoopTokens> {
    // Use serverless function endpoint (works locally with Vercel CLI or deployed)
    const tokenEndpoint = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/whoop-token'
      : 'https://' + window.location.host + '/api/whoop-token';

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh expired access token using refresh token
   * Uses serverless function to avoid CORS issues
   */
  async refreshAccessToken(refreshToken: string): Promise<WhoopTokens> {
    // Use serverless function endpoint (works locally with Vercel CLI or deployed)
    const tokenEndpoint = window.location.hostname === 'localhost'
      ? 'http://localhost:3000/api/whoop-token'
      : 'https://' + window.location.host + '/api/whoop-token';

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    accessToken: string,
    params?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<WhoopUserProfile> {
    return this.makeRequest<WhoopUserProfile>('/developer/v1/user/profile/basic', accessToken);
  }

  /**
   * Get latest recovery data
   */
  async getLatestRecovery(accessToken: string): Promise<WhoopRecovery | null> {
    const response = await this.makeRequest<{ records: WhoopRecovery[] }>(
      '/developer/v1/recovery',
      accessToken,
      { limit: '1' }
    );

    return response.records[0] || null;
  }

  /**
   * Get recoveries for date range
   */
  async getRecoveries(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    limit: number = 25
  ): Promise<WhoopRecovery[]> {
    const response = await this.makeRequest<{ records: WhoopRecovery[] }>(
      '/developer/v1/recovery',
      accessToken,
      {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: limit.toString(),
      }
    );

    return response.records;
  }

  /**
   * Get latest sleep data
   */
  async getLatestSleep(accessToken: string): Promise<WhoopSleep | null> {
    const response = await this.makeRequest<{ records: WhoopSleep[] }>(
      '/developer/v1/activity/sleep',
      accessToken,
      { limit: '1' }
    );

    return response.records[0] || null;
  }

  /**
   * Get sleep data for date range
   */
  async getSleeps(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    limit: number = 25
  ): Promise<WhoopSleep[]> {
    const response = await this.makeRequest<{ records: WhoopSleep[] }>(
      '/developer/v1/activity/sleep',
      accessToken,
      {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: limit.toString(),
      }
    );

    return response.records;
  }

  /**
   * Get latest cycle (daily summary)
   */
  async getLatestCycle(accessToken: string): Promise<WhoopCycle | null> {
    const response = await this.makeRequest<{ records: WhoopCycle[] }>(
      '/developer/v1/cycle',
      accessToken,
      { limit: '1' }
    );

    return response.records[0] || null;
  }

  /**
   * Get cycles for date range
   */
  async getCycles(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    limit: number = 25
  ): Promise<WhoopCycle[]> {
    const response = await this.makeRequest<{ records: WhoopCycle[] }>(
      '/developer/v1/cycle',
      accessToken,
      {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: limit.toString(),
      }
    );

    return response.records;
  }

  /**
   * Get workouts for date range
   */
  async getWorkouts(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    limit: number = 25
  ): Promise<WhoopWorkout[]> {
    const response = await this.makeRequest<{ records: WhoopWorkout[] }>(
      '/developer/v1/activity/workout',
      accessToken,
      {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        limit: limit.toString(),
      }
    );

    return response.records;
  }

  /**
   * Get comprehensive health summary for today
   */
  async getTodayHealthSummary(accessToken: string) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [recovery, sleep, cycle, workouts] = await Promise.all([
      this.getLatestRecovery(accessToken),
      this.getLatestSleep(accessToken),
      this.getLatestCycle(accessToken),
      this.getWorkouts(accessToken, yesterday, today, 10),
    ]);

    return {
      recovery,
      sleep,
      cycle,
      workouts,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
let whoopService: WhoopService | null = null;

export function initializeWhoopService(config: WhoopConfig): WhoopService {
  whoopService = new WhoopService(config);
  return whoopService;
}

export function getWhoopService(): WhoopService {
  if (!whoopService) {
    throw new Error('WhoopService not initialized. Call initializeWhoopService first.');
  }
  return whoopService;
}

export { WhoopService };
