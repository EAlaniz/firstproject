# Exporting 10K App to Monad Mini App Template

## Overview
This guide explains how to adapt the 10K wellness app for the Monad mini app framework.

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

## Monad Integration Steps

### 1. Install Monad Dependencies
```bash
npm install @monad-xyz/mini-app-sdk
```

### 2. Wrap App with Monad Provider
Update `main.tsx` to include Monad context:

```tsx
import { MonadProvider } from '@monad-xyz/mini-app-sdk';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MonadProvider>
      <App />
    </MonadProvider>
  </StrictMode>
);
```

### 3. Add Monad Hooks for Blockchain Integration
In `App.tsx`, integrate Monad wallet and transaction capabilities:

```tsx
import { useMonadWallet, useMonadContract } from '@monad-xyz/mini-app-sdk';

// Add to App component:
const { wallet, connect } = useMonadWallet();
const { executeTransaction } = useMonadContract();
```

### 4. Token Integration
Replace mock token system with actual Monad token contract calls:

```tsx
// Replace totalTokens state with actual token balance
const { tokenBalance } = useMonadContract('TOKEN_CONTRACT_ADDRESS');
```

### 5. Update Package.json
Add Monad-specific scripts and dependencies:

```json
{
  "scripts": {
    "build:monad": "vite build --mode monad",
    "deploy:monad": "monad-cli deploy"
  },
  "dependencies": {
    "@monad-xyz/mini-app-sdk": "^latest"
  }
}
```

## Key Adaptations Needed

### State Management
- Replace local state with Monad's persistent storage
- Integrate wallet connection for user authentication
- Connect step data to blockchain for token rewards

### Smart Contract Integration
- Deploy step tracking contract on Monad
- Implement token reward distribution logic
- Add streak verification and achievement minting

### Data Persistence
- Use Monad's storage APIs for user progress
- Implement cross-device synchronization
- Add backup/restore functionality

## Deployment Checklist

1. ✅ Export all React components
2. ⏳ Install Monad SDK
3. ⏳ Configure Monad provider
4. ⏳ Integrate wallet connection
5. ⏳ Deploy smart contracts
6. ⏳ Update token logic
7. ⏳ Test mini app integration
8. ⏳ Deploy to Monad network

## File Structure for Monad
```
monad-10k-app/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StepTracker.tsx
│   │   ├── ActivityShare.tsx
│   │   ├── Achievements.tsx
│   │   └── SocialFeed.tsx
│   ├── contracts/
│   │   ├── StepTracker.sol
│   │   └── TokenRewards.sol
│   ├── hooks/
│   │   ├── useStepTracking.ts
│   │   └── useTokenRewards.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── monad.config.js
├── package.json
└── README.md
```

## Next Steps
1. Set up Monad development environment
2. Create smart contracts for step tracking and rewards
3. Integrate Monad SDK into existing components
4. Test on Monad testnet
5. Deploy to Monad mainnet