# Importing 10K App into Base Mini App Kit

## Overview
This guide shows you how to integrate your existing 10K wellness app into Coinbase's Base Mini App Kit framework for deployment on Base Chain.

## Prerequisites
1. Coinbase Developer Platform account
2. Base Mini App Kit repository cloned
3. OnchainKit API key

## Step 1: Clone Base Mini App Kit Template

```bash
git clone https://github.com/coinbase/build-onchain-apps.git
cd build-onchain-apps/templates/base-mini-app
npm install
```

## Step 2: Replace Template Files with 10K App

### Core App Files to Copy:
```bash
# Copy your 10K app files to the Base Mini App Kit
cp -r /path/to/10k-app/src/components ./src/
cp /path/to/10k-app/src/App.tsx ./src/
cp /path/to/10k-app/src/index.css ./src/
cp /path/to/10k-app/tailwind.config.js ./
```

### Update package.json Dependencies:
```json
{
  "dependencies": {
    "@coinbase/onchainkit": "^0.31.0",
    "@coinbase/wallet-sdk": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "viem": "^2.0.0",
    "wagmi": "^2.0.0"
  }
}
```

## Step 3: Configure Base Chain Integration

### Update src/main.tsx:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { config } from './wagmi';
import App from './App';
import './index.css';

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

## Step 4: Environment Configuration

### Create .env file:
```env
VITE_ONCHAINKIT_API_KEY=your_coinbase_api_key
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_STEP_TRACKER_CONTRACT=0x...
VITE_TOKEN_CONTRACT=0x...
```

## Step 5: Deploy Smart Contracts to Base

### Using Foundry (Recommended):
```bash
# Install Foundry if not already installed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Initialize Foundry project
forge init contracts
cd contracts

# Copy your smart contracts
cp ../smart-contracts/*.sol src/

# Deploy to Base Sepolia (testnet)
forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/BaseStepTracker.sol:BaseStepTracker \
  --constructor-args $TOKEN_ADDRESS

# Deploy to Base Mainnet
forge create --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  src/BaseStepTracker.sol:BaseStepTracker \
  --constructor-args $TOKEN_ADDRESS
```

## Step 6: Update App.tsx for Base Integration

Replace your App.tsx with the Base-integrated version that includes:
- Wallet connection with Coinbase Smart Wallet
- Contract interactions using wagmi hooks
- Network validation
- Transaction handling

## Step 7: Test Integration

```bash
# Start development server
npm run dev

# Test wallet connection
# Test step tracking
# Test token rewards
# Test social features
```

## Step 8: Deploy to Base Mini App Directory

### Build for production:
```bash
npm run build
```

### Deploy options:
1. **Vercel** (Recommended for Mini Apps)
2. **Netlify**
3. **Base's hosting platform**

### Submit to Coinbase Mini App Directory:
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Navigate to Mini Apps section
3. Submit your deployed app for review
4. Include app metadata and screenshots

## Step 9: Configure Mini App Manifest

### Create mini-app.json:
```json
{
  "name": "10K - Move. Earn. Connect.",
  "description": "Inclusive wellness app for step tracking and token rewards",
  "version": "1.0.0",
  "icon": "/icon-192.png",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#22c55e",
  "background_color": "#000000",
  "categories": ["health", "fitness", "social"],
  "permissions": [
    "wallet",
    "notifications"
  ]
}
```

## Troubleshooting

### Common Issues:
1. **Wallet Connection Fails**: Check OnchainKit API key
2. **Contract Calls Fail**: Verify contract addresses and network
3. **Build Errors**: Ensure all dependencies are installed
4. **Gas Estimation Errors**: Check Base RPC endpoints

### Debug Commands:
```bash
# Check wallet connection
npm run dev -- --debug

# Verify contract deployment
cast call $CONTRACT_ADDRESS "getUserStats(address)" $USER_ADDRESS --rpc-url https://mainnet.base.org

# Test transaction
cast send $CONTRACT_ADDRESS "recordDailyGoal(uint256,uint256)" 10000 10000 --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org
```

## Resources
- [Base Chain Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Coinbase Mini App Kit](https://github.com/coinbase/build-onchain-apps)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)