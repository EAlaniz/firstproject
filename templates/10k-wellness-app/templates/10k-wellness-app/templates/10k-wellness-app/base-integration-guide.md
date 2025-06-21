# Exporting 10K App to Base Chain Mini Kit

## Overview
This guide explains how to adapt the 10K wellness app for Base Chain using Coinbase's Mini Kit framework.

## Base Chain Advantages
- Low gas fees (perfect for daily step tracking)
- Coinbase ecosystem integration
- Easy onboarding with Coinbase Wallet
- Strong developer tools and documentation

## Files to Export

### Core Components (src/components/)
- `Header.tsx` - Main header with streak and token display
- `StepTracker.tsx` - Primary step tracking interface
- `ActivityShare.tsx` - Social sharing component
- `Achievements.tsx` - Achievement system
- `SocialFeed.tsx` - Community feed component

### Main Application
- `App.tsx` - Root component with state management
- `main.tsx` - React entry point
- `index.css` - Tailwind CSS imports

### Configuration Files
- `package.json` - Dependencies list
- `tailwind.config.js` - Tailwind configuration
- `tsconfig.app.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration

## Base Chain Integration Steps

### 1. Install Base Mini Kit Dependencies
```bash
npm install @coinbase/onchainkit
npm install @coinbase/wallet-sdk
npm install wagmi viem @tanstack/react-query
npm install @rainbow-me/rainbowkit
```

### 2. Configure Base Chain Provider
Update `main.tsx` to include Base chain configuration:

```tsx
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from './wagmi';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
          chain={base}
        >
          <App />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
);
```

### 3. Add Wagmi Configuration
Create `src/wagmi.ts`:

```tsx
import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    coinbaseWallet({
      appName: '10K - Move. Earn. Connect.',
      preference: 'smartWalletOnly',
    }),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
```

### 4. Base Chain Integration Hooks
Replace mock data with Base chain integration:

```tsx
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { useCapabilities, useWriteContracts } from 'wagmi/experimental';

// In App component:
const { address, isConnected } = useAccount();
const { writeContract } = useWriteContract();
```

### 5. Smart Contract Integration
Deploy contracts on Base and integrate:

```tsx
// Read user stats from contract
const { data: userStats } = useReadContract({
  address: '0x...', // Your deployed contract address
  abi: stepTrackerAbi,
  functionName: 'getUserStats',
  args: [address],
});

// Record daily goal completion
const recordGoal = async (steps: number, goal: number) => {
  writeContract({
    address: '0x...', // Your contract address
    abi: stepTrackerAbi,
    functionName: 'recordDailyGoal',
    args: [steps, goal],
  });
};
```

### 6. Update Environment Variables
Create `.env` file:

```env
VITE_ONCHAINKIT_API_KEY=your_coinbase_api_key
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_STEP_TRACKER_CONTRACT=0x...
VITE_TOKEN_CONTRACT=0x...
```

## Key Adaptations for Base Chain

### Wallet Connection
- Use Coinbase Smart Wallet for seamless onboarding
- Support both EOA and Smart Wallet users
- Implement social login options

### Gas Optimization
- Batch multiple step updates
- Use Base's low gas fees for frequent transactions
- Implement meta-transactions for gasless UX

### Token Integration
- Deploy ERC-20 token on Base
- Use Base's native bridging for multi-chain support
- Integrate with Coinbase's token standards

## Smart Contract Deployment on Base

### 1. Deploy Step Tracker Contract
```solidity
// Deploy to Base Mainnet: 0x2105
// Deploy to Base Sepolia: 0x14a34 (testnet)
```

### 2. Deploy Reward Token
```solidity
// ERC-20 token with minting capabilities
// Integrate with Base's token standards
```

### 3. Set Up Automation
- Use Chainlink Automation for daily resets
- Implement keeper functions for streak management

## Base Chain Specific Features

### 1. Coinbase Commerce Integration
- Accept payments in multiple cryptocurrencies
- Integrate premium features with crypto payments

### 2. Base Name Service (BNS)
- Allow users to register .base names
- Use for social features and leaderboards

### 3. Farcaster Integration
- Native Farcaster frame support
- Share achievements directly to Farcaster
- Integrate with existing Farcaster social graph

## Deployment Checklist

1. ✅ Export all React components
2. ⏳ Install Base Mini Kit dependencies
3. ⏳ Configure Wagmi and OnchainKit
4. ⏳ Deploy smart contracts to Base
5. ⏳ Integrate wallet connection
6. ⏳ Update token reward logic
7. ⏳ Test on Base Sepolia testnet
8. ⏳ Deploy to Base mainnet
9. ⏳ Set up Coinbase Developer Platform

## File Structure for Base Chain
```
base-10k-app/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StepTracker.tsx
│   │   ├── ActivityShare.tsx
│   │   ├── Achievements.tsx
│   │   └── SocialFeed.tsx
│   ├── contracts/
│   │   ├── StepTracker.sol
│   │   └── RewardToken.sol
│   ├── hooks/
│   │   ├── useStepTracking.ts
│   │   ├── useTokenRewards.ts
│   │   └── useBaseChain.ts
│   ├── wagmi.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── package.json
└── README.md
```

## Next Steps
1. Set up Coinbase Developer account
2. Get OnchainKit API key
3. Deploy contracts to Base Sepolia (testnet)
4. Integrate Base Mini Kit components
5. Test wallet connection and transactions
6. Deploy to Base mainnet
7. Submit to Coinbase's mini app directory

## Resources
- [Base Chain Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Coinbase Wallet SDK](https://docs.cloud.coinbase.com/wallet-sdk/docs)
- [Base Mini Kit Examples](https://github.com/coinbase/onchainkit)