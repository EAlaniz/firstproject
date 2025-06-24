# 10K Base Mini App Migration Tool

This repository contains an automated migration script to convert your 10K wellness app into a Base Chain Mini App using Coinbase's Mini App Kit framework.

## Quick Migration

Run the migration script to automatically set up your Base Mini App:

```bash
# Make the script executable
chmod +x migrate-to-base.js

# Run migration (creates new directory)
npm run migrate

# Or specify custom target directory
node migrate-to-base.js ../my-base-app
```

## What the Migration Script Does

1. **Clones Base Mini App Kit template** from Coinbase's official repository
2. **Copies your 10K app files** (components, styles, configurations)
3. **Updates package.json** with Base Chain dependencies
4. **Configures Wagmi and OnchainKit** for Base integration
5. **Creates environment files** with proper Base configuration
6. **Sets up mini app manifest** for Coinbase directory submission
7. **Installs dependencies** and prepares for development

## Manual Migration Steps

If you prefer to migrate manually, follow these steps:

### 1. Clone Base Mini App Kit
```bash
git clone https://github.com/coinbase/build-onchain-apps.git
cd build-onchain-apps/templates/base-mini-app
```

### 2. Copy 10K App Files
```bash
# Copy components and core files
cp -r /path/to/10k-app/src/components ./src/
cp /path/to/10k-app/src/App.tsx ./src/
cp /path/to/10k-app/src/main.tsx ./src/
cp /path/to/10k-app/src/index.css ./src/
cp /path/to/10k-app/src/wagmi.ts ./src/
cp /path/to/10k-app/tailwind.config.js ./
```

### 3. Install Dependencies
```bash
npm install @coinbase/onchainkit @coinbase/wallet-sdk @tanstack/react-query wagmi viem lucide-react
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and contract addresses
```

### 5. Start Development
```bash
npm run dev
```

## Environment Configuration

Create a `.env` file with these variables:

```env
# Required
VITE_ONCHAINKIT_API_KEY=your_coinbase_api_key
VITE_STEP_TRACKER_CONTRACT=0x...
VITE_TOKEN_CONTRACT=0x...

# Optional
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

## Smart Contract Deployment

### Prerequisites
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Get Base Sepolia ETH
# Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### Deploy to Base Sepolia (Testnet)
```bash
forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  smart-contracts/BaseStepTracker.sol:BaseStepTracker \
  --constructor-args $TOKEN_ADDRESS
```

### Deploy to Base Mainnet
```bash
forge create --rpc-url https://mainnet.base.org \
  --private-key $PRIVATE_KEY \
  --etherscan-api-key $BASESCAN_API_KEY \
  --verify \
  smart-contracts/BaseStepTracker.sol:BaseStepTracker \
  --constructor-args $TOKEN_ADDRESS
```

## Production Deployment

### Build for Production
```bash
npm run build
```

### Deploy Options
1. **Vercel** (Recommended for Mini Apps)
2. **Netlify**
3. **Base's hosting platform**

### Submit to Coinbase Mini App Directory
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Navigate to Mini Apps section
3. Submit your deployed app for review

## Key Features Migrated

- ✅ Step tracking with Base Chain integration
- ✅ Token rewards system
- ✅ Social feed and sharing
- ✅ Achievement system
- ✅ Streak tracking
- ✅ Coinbase Smart Wallet integration
- ✅ **XMTP messaging for community chat**
- ✅ Cross-Origin-Opener-Policy configuration
- ✅ Base network validation

## XMTP Messaging Integration

The app includes full XMTP messaging functionality for community chat:

### Features
- **Real-time messaging** between users
- **Wallet-to-wallet conversations** using XMTP protocol
- **Message history** and conversation management
- **Automatic registration check** for XMTP compatibility
- **Production-ready** with proper error handling

### How It Works
1. Users connect their wallet (Coinbase Smart Wallet, MetaMask, etc.)
2. App checks if wallet is registered on XMTP using `Client.canMessage()`
3. If registered, initializes XMTP client for messaging
4. Users can start conversations with any wallet address
5. Real-time message polling ensures reliable delivery

### Technical Implementation
- **XMTP Client**: Production environment with proper app versioning
- **Message Polling**: 3-second intervals for reliable message delivery
- **Error Handling**: Comprehensive error states and user feedback
- **State Management**: React Context with proper cleanup and subscriptions
- **Wallet Integration**: Seamless integration with wagmi and ethers

### User Experience
- **Initialize XMTP**: One-click setup for new users
- **Conversation List**: View all active conversations
- **Real-time Chat**: Send and receive messages instantly
- **Address Formatting**: Clean display of wallet addresses
- **Message Timestamps**: Relative time display for messages

## Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Check OnchainKit API key in `.env`
   - Verify COOP header in `vite.config.ts`

2. **Contract Calls Fail**
   - Verify contract addresses in `.env`
   - Check network connection (Base vs Base Sepolia)

3. **XMTP Initialization Fails**
   - Ensure wallet is registered on XMTP
   - Check browser console for detailed error messages
   - Verify wallet connection before initializing XMTP

4. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript configuration

### Debug Commands
```bash
# Check wallet connection
npm run dev -- --debug

# Verify contract deployment
cast call $CONTRACT_ADDRESS "getUserStats(address)" $USER_ADDRESS --rpc-url https://mainnet.base.org

# Test transaction
cast send $CONTRACT_ADDRESS "recordDailyGoal(uint256)" 10000 --private-key $PRIVATE_KEY --rpc-url https://sepolia.base.org
```

## Resources

- [Base Chain Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Coinbase Mini App Kit](https://github.com/coinbase/build-onchain-apps)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)

## Support

For issues with the migration script or Base integration, please check:
1. The generated `DEPLOYMENT.md` file in your migrated app
2. [Base Chain Discord](https://discord.gg/buildonbase)
3. [Coinbase Developer Documentation](https://docs.cdp.coinbase.com/)