import { useState, useEffect, useCallback } from 'react';
import { initializeWhoopService, getWhoopService, type WhoopTokens } from '../services/WhoopService';

interface UseWhoopReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  userData: any | null;
  connectWhoop: () => void;
  disconnectWhoop: () => void;
  refreshData: () => Promise<void>;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'whoop_access_token',
  REFRESH_TOKEN: 'whoop_refresh_token',
  EXPIRES_AT: 'whoop_expires_at',
  USER_DATA: 'whoop_user_data',
};

/**
 * React hook for Whoop integration
 * Handles OAuth flow, token management, and data syncing
 */
export function useWhoop(): UseWhoopReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);

  // Initialize Whoop service
  useEffect(() => {
    try {
      const clientId = import.meta.env.VITE_WHOOP_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_WHOOP_CLIENT_SECRET;
      const redirectUri = import.meta.env.VITE_WHOOP_REDIRECT_URI;

      console.log('🔍 Checking Whoop credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasRedirectUri: !!redirectUri,
        clientId: clientId ? `${clientId.substring(0, 8)}...` : 'missing',
        redirectUri: redirectUri || 'missing'
      });

      if (!clientId || !clientSecret || !redirectUri) {
        console.warn('⚠️ Whoop credentials not configured');
        setError('Whoop credentials not configured. Please check environment variables.');
        return;
      }

      initializeWhoopService({
        clientId,
        clientSecret,
        redirectUri,
      });

      console.log('✅ Whoop service initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize Whoop service:', err);
      setError('Failed to initialize Whoop integration');
    }
  }, []);

  // Check for existing tokens on mount
  useEffect(() => {
    const checkExistingTokens = () => {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

      if (accessToken && expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (expiryDate > new Date()) {
          setIsConnected(true);
          const cachedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
          if (cachedUserData) {
            setUserData(JSON.parse(cachedUserData));
          }
          console.log('✅ Found valid Whoop tokens');
        } else {
          console.log('⏰ Whoop tokens expired, attempting refresh...');
          attemptTokenRefresh();
        }
      }
    };

    checkExistingTokens();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const whoopConnected = urlParams.get('whoop_connected');
      const whoopError = urlParams.get('whoop_error');

      if (whoopError) {
        setError(`Whoop authorization failed: ${whoopError}`);
        setIsConnecting(false);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (whoopConnected === 'true') {
        const code = localStorage.getItem('whoop_auth_code');
        if (code) {
          try {
            setIsConnecting(true);
            console.log('🔄 Exchanging Whoop authorization code for tokens...');

            const whoopService = getWhoopService();
            const tokens = await whoopService.exchangeCodeForTokens(code);

            // Store tokens
            storeTokens(tokens);

            // Fetch user data
            const profile = await whoopService.getUserProfile(tokens.access_token);
            const healthData = await whoopService.getTodayHealthSummary(tokens.access_token);

            const combinedData = {
              profile,
              ...healthData,
            };

            setUserData(combinedData);
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(combinedData));
            setIsConnected(true);

            console.log('✅ Whoop connected successfully!');

            // Clean up
            localStorage.removeItem('whoop_auth_code');
            localStorage.removeItem('whoop_auth_state');
          } catch (err) {
            console.error('❌ Failed to complete Whoop connection:', err);
            setError('Failed to connect to Whoop. Please try again.');
          } finally {
            setIsConnecting(false);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      }
    };

    handleOAuthCallback();
  }, []);

  /**
   * Store OAuth tokens in localStorage
   */
  const storeTokens = (tokens: WhoopTokens) => {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt.toISOString());
  };

  /**
   * Attempt to refresh expired access token
   */
  const attemptTokenRefresh = async () => {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      disconnectWhoop();
      return;
    }

    try {
      console.log('🔄 Refreshing Whoop access token...');
      const whoopService = getWhoopService();
      const tokens = await whoopService.refreshAccessToken(refreshToken);

      storeTokens(tokens);
      setIsConnected(true);
      console.log('✅ Whoop token refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh Whoop token:', err);
      disconnectWhoop();
    }
  };

  /**
   * Start Whoop OAuth flow
   */
  const connectWhoop = useCallback(() => {
    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔄 Attempting to get Whoop service...');
      const whoopService = getWhoopService();

      console.log('✅ Whoop service retrieved, generating auth URL...');
      const authUrl = whoopService.getAuthorizationUrl();

      console.log('🚀 Redirecting to Whoop authorization...', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      console.error('❌ Failed to start Whoop connection:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Whoop';
      setError(errorMessage);
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect from Whoop
   */
  const disconnectWhoop = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    setIsConnected(false);
    setUserData(null);
    console.log('👋 Disconnected from Whoop');
  }, []);

  /**
   * Refresh health data from Whoop
   */
  const refreshData = useCallback(async () => {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!accessToken) {
      console.warn('⚠️ No access token available');
      return;
    }

    try {
      console.log('🔄 Refreshing Whoop data...');
      const whoopService = getWhoopService();
      const healthData = await whoopService.getTodayHealthSummary(accessToken);

      const combinedData = {
        ...userData,
        ...healthData,
      };

      setUserData(combinedData);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(combinedData));
      console.log('✅ Whoop data refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh Whoop data:', err);

      // If 401, try to refresh token
      if (err instanceof Error && err.message.includes('401')) {
        await attemptTokenRefresh();
      }
    }
  }, [userData]);

  return {
    isConnected,
    isConnecting,
    error,
    userData,
    connectWhoop,
    disconnectWhoop,
    refreshData,
  };
}
