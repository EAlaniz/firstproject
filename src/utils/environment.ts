export interface EnvironmentInfo {
  isFarcasterMiniApp: boolean;
  isWarpcast: boolean;
  isFarcaster: boolean;
  isEmbedded: boolean;
  isFrame: boolean;
  platform: 'web' | 'farcaster' | 'warpcast' | 'unknown';
  detectionMethods: string[];
}

export const detectEnvironment = (): EnvironmentInfo => {
  const detectionMethods: string[] = [];
  let isFarcasterMiniApp = false;
  let isWarpcast = false;
  let isFarcaster = false;
  let isEmbedded = false;
  let isFrame = false;

  // Method 1: Check for Farcaster SDK presence (most reliable)
  if ((window as any)?.farcaster?.version) {
    isFarcasterMiniApp = true;
    isFarcaster = true;
    detectionMethods.push('farcaster-sdk');
  }

  // Method 2: Check for Warpcast SDK presence
  if ((window as any)?.warpcast?.version) {
    isFarcasterMiniApp = true;
    isWarpcast = true;
    detectionMethods.push('warpcast-sdk');
  }

  // Method 3: Check URL hostname
  const hostname = window.location.hostname;
  if (hostname.includes('farcaster.xyz')) {
    isFarcasterMiniApp = true;
    isFarcaster = true;
    detectionMethods.push('farcaster-hostname');
  }
  if (hostname.includes('warpcast.com') || hostname.includes('wrpcd.net')) {
    isFarcasterMiniApp = true;
    isWarpcast = true;
    detectionMethods.push('warpcast-hostname');
  }

  // Method 4: Check URL search parameters
  const searchParams = window.location.search;
  if (searchParams.includes('fid=')) {
    isFarcasterMiniApp = true;
    detectionMethods.push('fid-parameter');
  }
  if (searchParams.includes('farcaster=')) {
    isFarcasterMiniApp = true;
    isFarcaster = true;
    detectionMethods.push('farcaster-parameter');
  }
  if (searchParams.includes('frame=')) {
    isFarcasterMiniApp = true;
    isFrame = true;
    detectionMethods.push('frame-parameter');
  }
  if (searchParams.includes('embed=')) {
    isFarcasterMiniApp = true;
    isEmbedded = true;
    detectionMethods.push('embed-parameter');
  }
  if (searchParams.includes('miniApp=true')) {
    isFarcasterMiniApp = true;
    detectionMethods.push('miniapp-parameter');
  }

  // Method 5: Check URL path
  const pathname = window.location.pathname;
  if (pathname.includes('/miniapp') || pathname.includes('/mini-app')) {
    isFarcasterMiniApp = true;
    detectionMethods.push('miniapp-path');
  }

  // Method 6: Check User Agent
  const userAgent = window.navigator.userAgent;
  if (userAgent.includes('Farcaster')) {
    isFarcasterMiniApp = true;
    isFarcaster = true;
    detectionMethods.push('farcaster-useragent');
  }
  if (userAgent.includes('Warpcast')) {
    isFarcasterMiniApp = true;
    isWarpcast = true;
    detectionMethods.push('warpcast-useragent');
  }

  // Method 7: Check referrer
  if (document.referrer.includes('farcaster') || document.referrer.includes('warpcast')) {
    isFarcasterMiniApp = true;
    detectionMethods.push('referrer');
  }

  // Method 8: Check for preview/debug environments
  if (hostname.includes('preview') || hostname.includes('debug') || hostname.includes('dev')) {
    isFarcasterMiniApp = true;
    detectionMethods.push('preview-environment');
  }

  // Method 9: Check for iframe context
  if (window.self !== window.top) {
    isFarcasterMiniApp = true;
    isEmbedded = true;
    detectionMethods.push('iframe-context');
  }

  // Determine platform
  let platform: 'web' | 'farcaster' | 'warpcast' | 'unknown' = 'web';
  if (isFarcasterMiniApp) {
    if (isWarpcast) {
      platform = 'warpcast';
    } else if (isFarcaster) {
      platform = 'farcaster';
    } else {
      platform = 'farcaster'; // Default to farcaster if mini app but not specifically warpcast
    }
  }

  // Log detection results for debugging
  console.log('🔍 Environment Detection Results:', {
    isFarcasterMiniApp,
    platform,
    detectionMethods,
    hostname: window.location.hostname,
    search: window.location.search,
    userAgent: window.navigator.userAgent.substring(0, 100) + '...',
    hasFarcasterSDK: !!(window as any)?.farcaster?.version,
    hasWarpcastSDK: !!(window as any)?.warpcast?.version,
    isIframe: window.self !== window.top
  });

  return {
    isFarcasterMiniApp,
    isWarpcast,
    isFarcaster,
    isEmbedded,
    isFrame,
    platform,
    detectionMethods
  };
};

// Convenience function for backward compatibility
export const isFarcasterMiniApp = (): boolean => {
  return detectEnvironment().isFarcasterMiniApp;
}; 