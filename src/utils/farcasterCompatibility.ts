export const isFarcasterMiniApp = () => {
  return (
    window.location.hostname.includes('warpcast.com') ||
    window.location.hostname.includes('farcaster.xyz') ||
    window.location.hostname.includes('farcaster.com') ||
    (typeof window !== 'undefined' && 'farcaster' in window)
  );
};

export const farcasterCompatibility = {
  // Initialize Farcaster compatibility (simplified)
  init: () => {
    if (isFarcasterMiniApp()) {
      console.log('🌐 Farcaster Mini App compatibility mode enabled');
      console.log('📱 Environment: Farcaster Mini App');
    } else {
      console.log('🖥️ Environment: Standard Web App');
    }
  }
};