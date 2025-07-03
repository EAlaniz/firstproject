/**
 * Network Connectivity and Fallback Strategies for XMTP V3
 * 
 * Handles network reliability issues that can cause:
 * - "Failed to fetch" errors
 * - XMTP production endpoint failures
 * - Discovery result failures {total: 0, dms: 0, groups: 0, combined: 0}
 */

export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType?: string;
  rtt?: number;
  downlink?: number;
  saveData?: boolean;
}

export interface XMTPEndpointHealth {
  endpoint: string;
  healthy: boolean;
  latency: number;
  lastChecked: number;
  error?: string;
}

class NetworkConnectivityManager {
  private networkStatusCallbacks: ((status: NetworkStatus) => void)[] = [];
  private endpointHealth: Map<string, XMTPEndpointHealth> = new Map();
  private isMonitoring = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // XMTP V3 production endpoints to monitor (updated for SDK v3.0.3+)
  // Note: grpc.production.xmtp.network removed as it's not accessible via HTTP/CORS from browsers
  private xmtpEndpoints = [
    'https://production.xmtp.network',
    'https://node.production.xmtp.network',
    'https://api.production.xmtp.network',
    // gRPC endpoints are handled internally by the XMTP SDK
  ];

  constructor() {
    this.initializeNetworkMonitoring();
  }

  private initializeNetworkMonitoring() {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);

    // Monitor connection changes if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleNetworkChange);
    }

    this.startHealthChecks();
  }

  private handleNetworkChange = () => {
    console.log('[Network] Network status changed');
    this.notifyNetworkStatusCallbacks();
    
    // Re-check endpoint health when network changes
    this.checkEndpointHealth();
  };

  private startHealthChecks() {
    if (this.healthCheckInterval) return;

    // Check endpoint health every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.checkEndpointHealth();
    }, 30000);

    // Initial health check
    this.checkEndpointHealth();
  }

  private async checkEndpointHealth() {
    console.log('[Network] Checking XMTP endpoint health...');
    
    const healthPromises = this.xmtpEndpoints.map(async (endpoint) => {
      const startTime = Date.now();
      
      try {
        // Enhanced endpoint checking with multiple methods
        const health = await this.checkSingleEndpoint(endpoint, startTime);
        this.endpointHealth.set(endpoint, health);
        
        const status = health.healthy ? '✅' : '❌';
        const errorMsg = health.error ? ` (${health.error})` : '';
        console.log(`[Network] ${endpoint}: ${status} (${health.latency}ms)${errorMsg}`);

      } catch (error) {
        const latency = Date.now() - startTime;
        const health: XMTPEndpointHealth = {
          endpoint,
          healthy: false,
          latency,
          lastChecked: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error'
        };

        this.endpointHealth.set(endpoint, health);
        console.log(`[Network] ${endpoint}: ❌ ${health.error} (${latency}ms)`);
      }
    });

    await Promise.allSettled(healthPromises);
    
    // Log overall health summary
    const healthy = this.getHealthyEndpoints().length;
    const total = this.xmtpEndpoints.length;
    console.log(`[Network] XMTP endpoints: ${healthy}/${total} healthy`);
  }

  private async checkSingleEndpoint(endpoint: string, startTime: number): Promise<XMTPEndpointHealth> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout
    
    try {
      // Try multiple check methods for better accuracy
      let response: Response;
      
      // Method 1: HEAD request (preferred)
      try {
        response = await fetch(endpoint, {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'User-Agent': 'XMTP-Health-Check/1.0'
          }
        });
      } catch (headError) {
        // Method 2: GET request as fallback
        console.log(`[Network] HEAD failed for ${endpoint}, trying GET...`);
        response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-cache',
          headers: {
            'User-Agent': 'XMTP-Health-Check/1.0'
          }
        });
      }

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      // Enhanced health determination
      const isHealthy = this.determineEndpointHealth(response, latency);
      
      const health: XMTPEndpointHealth = {
        endpoint,
        healthy: isHealthy,
        latency,
        lastChecked: Date.now(),
        error: !isHealthy ? `HTTP ${response.status} ${response.statusText}` : undefined
      };

      return health;

    } catch (error) {
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      // Enhanced error categorization
      const errorMessage = this.categorizeNetworkError(error);
      
      return {
        endpoint,
        healthy: false,
        latency,
        lastChecked: Date.now(),
        error: errorMessage
      };
    }
  }

  private determineEndpointHealth(response: Response, latency: number): boolean {
    // Consider endpoint healthy if:
    // 1. Response is OK (2xx) or redirect (3xx)
    // 2. Not a server error (5xx)
    // 3. Latency is reasonable (< 10 seconds)
    return (response.ok || response.status < 400 || response.status === 404) && 
           response.status < 500 && 
           latency < 10000;
  }

  private categorizeNetworkError(error: any): string {
    if (!error) return 'Unknown error';
    
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('abort')) return 'Request timeout';
    if (errorMessage.includes('fetch')) return 'Network fetch failed';
    if (errorMessage.includes('CORS')) return 'CORS policy error';
    if (errorMessage.includes('DNS') || errorMessage.includes('resolve')) return 'DNS resolution failed';
    if (errorMessage.includes('SSL') || errorMessage.includes('TLS')) return 'SSL/TLS error';
    if (errorMessage.includes('refused')) return 'Connection refused';
    if (errorMessage.includes('timeout')) return 'Connection timeout';
    
    return errorMessage.length > 50 ? errorMessage.substring(0, 50) + '...' : errorMessage;
  }

  public getCurrentNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType,
      rtt: connection?.rtt,
      downlink: connection?.downlink,
      saveData: connection?.saveData
    };
  }

  public getEndpointHealth(): XMTPEndpointHealth[] {
    return Array.from(this.endpointHealth.values());
  }

  public getHealthyEndpoints(): XMTPEndpointHealth[] {
    return this.getEndpointHealth().filter(health => health.healthy);
  }

  public onNetworkStatusChange(callback: (status: NetworkStatus) => void) {
    this.networkStatusCallbacks.push(callback);
    
    // Immediately call with current status
    callback(this.getCurrentNetworkStatus());
  }

  public offNetworkStatusChange(callback: (status: NetworkStatus) => void) {
    const index = this.networkStatusCallbacks.indexOf(callback);
    if (index > -1) {
      this.networkStatusCallbacks.splice(index, 1);
    }
  }

  private notifyNetworkStatusCallbacks() {
    const status = this.getCurrentNetworkStatus();
    this.networkStatusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[Network] Callback error:', error);
      }
    });
  }

  public async waitForNetworkStability(timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkStability = () => {
        const status = this.getCurrentNetworkStatus();
        const healthyEndpoints = this.getHealthyEndpoints();
        
        // Consider network stable if:
        // 1. Browser reports online
        // 2. At least one XMTP endpoint is healthy
        // 3. Connection quality is reasonable (if available)
        const isStable = status.isOnline && 
                        healthyEndpoints.length > 0 && 
                        (!status.rtt || status.rtt < 2000);

        if (isStable) {
          console.log('[Network] Network is stable');
          resolve(true);
          return;
        }

        if (Date.now() - startTime > timeout) {
          console.warn('[Network] Network stability timeout reached');
          resolve(false);
          return;
        }

        // Check again in 1 second
        setTimeout(checkStability, 1000);
      };

      checkStability();
    });
  }

  public destroy() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleNetworkChange);
    window.removeEventListener('offline', this.handleNetworkChange);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleNetworkChange);
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.networkStatusCallbacks.length = 0;
    this.endpointHealth.clear();
  }
}

// Singleton instance
export const networkManager = new NetworkConnectivityManager();

/**
 * Enhanced fetch with network resilience for XMTP operations
 */
export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoffMs = 1000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Wait for network stability before attempting
      if (attempt > 0) {
        console.log(`[Network] Retry attempt ${attempt + 1}/${retries} for ${url}`);
        await networkManager.waitForNetworkStability(5000);
        
        // Progressive backoff
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Enhanced timeout and abort controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const enhancedOptions: RequestInit = {
        ...options,
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          ...options.headers
        }
      };

      const response = await fetch(url, enhancedOptions);
      clearTimeout(timeoutId);

      // Consider 5xx errors as retryable
      if (!response.ok && response.status >= 500 && attempt < retries - 1) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      return response;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.warn(`[Network] Fetch attempt ${attempt + 1} failed:`, lastError.message);

      // Don't retry on client errors (4xx) or abort errors on final attempt
      if (lastError.message.includes('abort') && attempt === retries - 1) {
        break;
      }
      
      if (lastError.message.includes('4') && attempt === retries - 1) {
        break;
      }
    }
  }

  throw lastError || new Error('All retry attempts failed');
}

/**
 * Network-aware delay with exponential backoff
 */
export async function networkAwareDelay(baseMs = 1000, maxMs = 10000): Promise<void> {
  const status = networkManager.getCurrentNetworkStatus();
  
  // Adjust delay based on network conditions
  let delay = baseMs;
  
  if (!status.isOnline) {
    delay = maxMs; // Long delay if offline
  } else if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
    delay = Math.min(baseMs * 3, maxMs);
  } else if (status.effectiveType === '3g') {
    delay = Math.min(baseMs * 2, maxMs);
  }

  console.log(`[Network] Applying network-aware delay: ${delay}ms (connection: ${status.effectiveType || status.connectionType})`);
  
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Check if current network conditions are suitable for XMTP operations
 */
export function isNetworkSuitableForXMTP(): boolean {
  const status = networkManager.getCurrentNetworkStatus();
  const healthyEndpoints = networkManager.getHealthyEndpoints();
  
  return status.isOnline && 
         healthyEndpoints.length > 0 && 
         (!status.rtt || status.rtt < 3000);
}

/**
 * Get network quality assessment for debugging
 */
export function getNetworkQualityReport(): {
  status: NetworkStatus;
  endpointHealth: XMTPEndpointHealth[];
  recommendation: string;
  suitableForXMTP: boolean;
} {
  const status = networkManager.getCurrentNetworkStatus();
  const endpointHealth = networkManager.getEndpointHealth();
  const suitableForXMTP = isNetworkSuitableForXMTP();
  
  let recommendation = 'Network conditions are good';
  
  if (!status.isOnline) {
    recommendation = 'No internet connection detected';
  } else if (endpointHealth.filter(h => h.healthy).length === 0) {
    recommendation = 'XMTP endpoints are unreachable - try again later';
  } else if (status.effectiveType === 'slow-2g' || status.effectiveType === '2g') {
    recommendation = 'Slow connection detected - operations may be delayed';
  } else if (status.rtt && status.rtt > 2000) {
    recommendation = 'High latency detected - expect slower responses';
  }

  return {
    status,
    endpointHealth,
    recommendation,
    suitableForXMTP
  };
}