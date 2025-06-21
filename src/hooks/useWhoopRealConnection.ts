import { useState, useEffect } from 'react';

interface WhoopAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface WhoopUserData {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface WhoopRecoveryData {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

interface WhoopWorkoutData {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
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

export function useWhoopRealConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<WhoopUserData | null>(null);
  const [recoveryData, setRecoveryData] = useState<WhoopRecoveryData | null>(null);
  const [workoutData, setWorkoutData] = useState<WhoopWorkoutData[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // WHOOP API Configuration
  const WHOOP_CLIENT_ID = import.meta.env.VITE_WHOOP_CLIENT_ID;
  const WHOOP_CLIENT_SECRET = import.meta.env.VITE_WHOOP_CLIENT_SECRET;
  const REDIRECT_URI = `${window.location.origin}/auth/whoop`;
  const WHOOP_API_BASE = 'https://api.prod.whoop.com';

  // Check if we have real credentials
  const hasRealCredentials = !!(WHOOP_CLIENT_ID && WHOOP_CLIENT_SECRET && 
    WHOOP_CLIENT_ID !== 'your_actual_whoop_client_id_here' &&
    WHOOP_CLIENT_SECRET !== 'your_actual_whoop_client_secret_here');

  // Check for stored tokens on mount
  useEffect(() => {
    if (!hasRealCredentials) return;

    const storedToken = localStorage.getItem('whoop_access_token');
    const storedRefreshToken = localStorage.getItem('whoop_refresh_token');
    const tokenExpiry = localStorage.getItem('whoop_token_expiry');

    if (storedToken && tokenExpiry) {
      const now = Date.now();
      const expiry = parseInt(tokenExpiry);

      if (now < expiry) {
        setAccessToken(storedToken);
        setIsConnected(true);
        fetchUserData(storedToken);
      } else if (storedRefreshToken) {
        // Token expired, try to refresh
        refreshAccessToken(storedRefreshToken);
      }
    }
  }, [hasRealCredentials]);

  // Step 1: Initiate WHOOP OAuth flow
  const connectWhoop = async () => {
    if (!hasRealCredentials) {
      setConnectionError('WHOOP credentials not configured. Please add your Client ID and Secret to the .env file.');
      return;
    }

    setIsLoading(true);
    setConnectionError(null);

    try {
      // Build OAuth URL
      const scopes = [
        'read:recovery',
        'read:cycles', 
        'read:workout',
        'read:sleep',
        'read:profile',
        'read:body_measurement'
      ].join(' ');

      const authUrl = new URL(`${WHOOP_API_BASE}/oauth/oauth2/auth/`);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('client_id', WHOOP_CLIENT_ID);
      authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.append('scope', scopes);
      authUrl.searchParams.append('state', generateRandomState());

      console.log('Opening WHOOP OAuth URL:', authUrl.toString());

      // Open popup window for OAuth
      const popup = window.open(
        authUrl.toString(),
        'whoop-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      // Listen for the OAuth callback
      const authPromise = new Promise<string>((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            reject(new Error('Authentication cancelled by user'));
          }
        }, 1000);

        // Listen for message from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'WHOOP_AUTH_SUCCESS') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup?.close();
            resolve(event.data.code);
          } else if (event.data.type === 'WHOOP_AUTH_ERROR') {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            popup?.close();
            reject(new Error(event.data.error || 'Authentication failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          if (popup && !popup.closed) {
            popup.close();
          }
          reject(new Error('Authentication timeout - please try again'));
        }, 300000);
      });

      const authCode = await authPromise;
      console.log('Received auth code:', authCode.substring(0, 10) + '...');
      
      // Exchange code for access token
      await exchangeCodeForToken(authCode);

    } catch (error) {
      console.error('WHOOP connection failed:', error);
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Exchange authorization code for access token
  const exchangeCodeForToken = async (code: string) => {
    try {
      console.log('Exchanging code for token...');
      
      const response = await fetch(`${WHOOP_API_BASE}/oauth/oauth2/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: REDIRECT_URI,
          client_id: WHOOP_CLIENT_ID,
          client_secret: WHOOP_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token exchange failed:', response.status, errorText);
        throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
      }

      const tokenData: WhoopAuthResponse = await response.json();
      console.log('Token exchange successful');
      
      // Store tokens
      const expiryTime = Date.now() + (tokenData.expires_in * 1000);
      localStorage.setItem('whoop_access_token', tokenData.access_token);
      localStorage.setItem('whoop_refresh_token', tokenData.refresh_token);
      localStorage.setItem('whoop_token_expiry', expiryTime.toString());

      setAccessToken(tokenData.access_token);
      setIsConnected(true);

      // Fetch initial user data
      await fetchUserData(tokenData.access_token);

    } catch (error) {
      console.error('Token exchange failed:', error);
      throw error;
    }
  };

  // Refresh access token using refresh token
  const refreshAccessToken = async (refreshToken: string) => {
    try {
      console.log('Refreshing access token...');
      
      const response = await fetch(`${WHOOP_API_BASE}/oauth/oauth2/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: WHOOP_CLIENT_ID,
          client_secret: WHOOP_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        console.error('Token refresh failed, need to re-authenticate');
        disconnectWhoop();
        throw new Error('Token refresh failed');
      }

      const tokenData: WhoopAuthResponse = await response.json();
      console.log('Token refresh successful');
      
      // Store new tokens
      const expiryTime = Date.now() + (tokenData.expires_in * 1000);
      localStorage.setItem('whoop_access_token', tokenData.access_token);
      localStorage.setItem('whoop_refresh_token', tokenData.refresh_token);
      localStorage.setItem('whoop_token_expiry', expiryTime.toString());

      setAccessToken(tokenData.access_token);
      setIsConnected(true);

    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  // Fetch user profile data
  const fetchUserData = async (token: string) => {
    try {
      console.log('Fetching user profile...');
      
      const response = await fetch(`${WHOOP_API_BASE}/developer/v1/user/profile/basic`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }

      const data: WhoopUserData = await response.json();
      setUserData(data);
      console.log('User data fetched:', data.first_name, data.last_name);

      // Also fetch recent recovery and workout data
      await fetchRecoveryData(token);
      await fetchWorkoutData(token);

    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Fetch recovery data (includes heart rate, HRV, etc.)
  const fetchRecoveryData = async (token: string) => {
    try {
      console.log('Fetching recovery data...');
      
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${WHOOP_API_BASE}/developer/v1/recovery?start=${today}&end=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.log('No recovery data available for today');
        return;
      }

      const data = await response.json();
      if (data.records && data.records.length > 0) {
        setRecoveryData(data.records[0]);
        console.log('Recovery data fetched:', data.records[0].score?.recovery_score);
      }

    } catch (error) {
      console.error('Failed to fetch recovery data:', error);
    }
  };

  // Fetch workout data
  const fetchWorkoutData = async (token: string) => {
    try {
      console.log('Fetching workout data...');
      
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${WHOOP_API_BASE}/developer/v1/activity/workout?start=${today}&end=${today}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.log('No workout data available for today');
        return;
      }

      const data = await response.json();
      setWorkoutData(data.records || []);
      console.log('Workout data fetched:', data.records?.length || 0, 'workouts');

    } catch (error) {
      console.error('Failed to fetch workout data:', error);
    }
  };

  // Sync all data
  const syncData = async () => {
    if (!accessToken) {
      throw new Error('Not connected to WHOOP');
    }

    setIsLoading(true);
    try {
      await fetchUserData(accessToken);
      console.log('WHOOP data sync completed');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect WHOOP
  const disconnectWhoop = () => {
    localStorage.removeItem('whoop_access_token');
    localStorage.removeItem('whoop_refresh_token');
    localStorage.removeItem('whoop_token_expiry');
    
    setAccessToken(null);
    setIsConnected(false);
    setUserData(null);
    setRecoveryData(null);
    setWorkoutData([]);
    setConnectionError(null);
    
    console.log('WHOOP disconnected');
  };

  // Generate random state for OAuth security
  const generateRandomState = () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };

  // Convert WHOOP data to our standard format
  const getStandardizedData = () => {
    if (!recoveryData && workoutData.length === 0) return null;

    // Calculate steps from workout data (WHOOP doesn't directly provide steps)
    const totalDistance = workoutData.reduce((sum, workout) => {
      return sum + (workout.score?.distance_meter || 0);
    }, 0);

    // Rough conversion: 1 meter ≈ 1.3 steps (varies by person)
    const estimatedSteps = Math.round(totalDistance * 1.3);

    return {
      steps: estimatedSteps,
      heartRate: recoveryData?.score?.resting_heart_rate,
      distance: totalDistance / 1000, // Convert to km
      calories: workoutData.reduce((sum, workout) => {
        return sum + (workout.score?.kilojoule || 0) * 0.239; // Convert kJ to calories
      }, 0),
      activeMinutes: workoutData.reduce((sum, workout) => {
        const start = new Date(workout.start);
        const end = new Date(workout.end);
        return sum + Math.round((end.getTime() - start.getTime()) / 60000);
      }, 0),
      lastSync: new Date(),
      source: 'whoop' as const,
      batteryLevel: undefined, // WHOOP doesn't provide battery info via API
      // Additional WHOOP-specific data
      recoveryScore: recoveryData?.score?.recovery_score,
      hrv: recoveryData?.score?.hrv_rmssd_milli,
      skinTemp: recoveryData?.score?.skin_temp_celsius,
      spo2: recoveryData?.score?.spo2_percentage,
      strain: workoutData.reduce((max, workout) => {
        return Math.max(max, workout.score?.strain || 0);
      }, 0)
    };
  };

  return {
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
  };
}