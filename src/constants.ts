// App Configuration
export const APP_CONFIG = {
  name: "10K - Move. Earn. Connect.",
  shortName: "10K",
  description: "A Farcaster Mini App for step tracking, social connection, and token rewards on Base Chain.",
  version: "1.0.0",
  themeColor: "#667eea",
  backgroundColor: "#000000",
  homeUrl: "https://www.move10k.xyz",
} as const;

// Environment Configuration
export const ENV_CONFIG = {
  // Base Chain RPC URL
  BASE_RPC_URL: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
  
  // RPC URL for auth kit and other services (same as wagmi config)
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://flashy-convincing-paper.base-mainnet.quiknode.pro/fe55bc09278a1ccc534942fad989695b412ab4ea/',
  
  // Step Tracker Contract
  // XMTP Environment - Set to production for cross-platform compatibility
  XMTP_ENV: 'production' as const,
  STEP_TRACKER_CONTRACT: import.meta.env.VITE_STEP_TRACKER_CONTRACT || '0x0000000000000000000000000000000000000000',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  IS_PRODUCTION: import.meta.env.NODE_ENV === 'production',
} as const;

// Step Tracking Configuration
export const STEP_CONFIG = {
  defaultDailyGoal: 10000,
  defaultSteps: 7240,
  stepIncrementRange: { min: 5, max: 20 },
  updateInterval: 5000, // 5 seconds
  maxStepsOverGoal: 2000,
} as const;

// Social Sharing Configuration
export const SHARE_CONFIG = {
  platforms: {
    twitter: "twitter",
    copy: "copy",
    native: "native",
  },
  defaultText: (steps: number) => 
    `Just hit ${steps.toLocaleString()} steps today on 10K! 🚶‍♂️ Join me in earning tokens for staying active. #10K #MoveToEarn`,
} as const;

// UI Configuration
export const UI_CONFIG = {
  copySuccessTimeout: 2000,
  modalAnimationDuration: 300,
} as const;

// Contract Configuration
export const CONTRACT_CONFIG = {
  stepTrackerAbi: [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserStats",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "totalSteps",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "currentStreak",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "totalTokens",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const,
} as const;

// Farcaster Configuration
export const FARCASTER_CONFIG = {
  authDomain: "www.move10k.xyz",
  redirectUrl: "https://www.move10k.xyz",
} as const; 

// Validate required environment variables
if (!ENV_CONFIG.BASE_RPC_URL) {
  console.warn('VITE_BASE_RPC_URL not set, using public Base RPC endpoint');
}

if (!ENV_CONFIG.RPC_URL) {
  console.warn('VITE_RPC_URL not set, using QuickNode RPC endpoint');
}
