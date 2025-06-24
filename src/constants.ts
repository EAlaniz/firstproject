// App Configuration
export const APP_CONFIG = {
  name: "10K - Move. Earn. Connect.",
  shortName: "10K",
  description: "Inclusive wellness app for step tracking, social connection, and token rewards",
  version: "1.0.0",
  themeColor: "#667eea",
  backgroundColor: "#000000",
  homeUrl: "https://www.move10k.xyz",
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
      name: 'getUserStats',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'user', type: 'address' }],
      outputs: [
        { name: 'totalSteps', type: 'uint256' },
        { name: 'currentStreak', type: 'uint256' },
        { name: 'totalGoalsCompleted', type: 'uint256' }
      ]
    },
    {
      name: 'recordDailyGoal',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'steps', type: 'uint256' }
      ]
    }
  ] as const,
} as const;

// Farcaster Configuration
export const FARCASTER_CONFIG = {
  authDomain: "www.move10k.xyz",
  redirectUrl: "https://www.move10k.xyz",
} as const; 