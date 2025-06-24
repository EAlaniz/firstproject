# 10K - Move. Earn. Connect.

A Farcaster mini app for step tracking, token rewards, and community messaging built on Base.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation
```bash
git clone <your-repo-url>
cd firstproject-main
npm install
```

### Environment Setup
Create a `.env.local` file:
```bash
# Required
VITE_ONCHAINKIT_API_KEY=your_onchainkit_api_key
VITE_STEP_TRACKER_CONTRACT=0x...
VITE_TOKEN_CONTRACT=0x...

# Optional
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
VITE_XMTP_ENV=production
```

### Development
```bash
npm run dev
```

## 🔧 Wallet Compatibility & XMTP Support

### Critical: XMTP Wallet Requirements

**XMTP messaging requires specific wallet types that can sign messages directly:**

#### ✅ Compatible Wallets
- **MetaMask** (Browser Extension) - Full XMTP support
- **Coinbase Wallet Extension** (Browser Extension) - Full XMTP support  
- **Coinbase Wallet Mobile App** - Full XMTP support

#### ❌ Incompatible Wallets
- **Coinbase Smart Wallets** - Cannot sign messages for XMTP
- **Other smart contract wallets** - Limited signing capabilities

### Environment-Specific Wallet Strategy

#### Desktop/URL Environment
- **Primary**: MetaMask or Coinbase Wallet Extension
- **Fallback**: Other browser extension wallets
- **Detection**: Automatic wallet detection with user guidance

#### Mobile/Farcaster Mini App Environment
- **Primary**: Coinbase Wallet Mobile App
- **Fallback**: Other mobile wallets
- **Detection**: Platform-aware wallet recommendations

### User Experience

1. **Automatic Detection**: App detects wallet type on connection
2. **Smart Guidance**: Shows appropriate wallet recommendations
3. **Clear Messaging**: Explains why certain wallets don't work with XMTP
4. **Easy Installation**: Direct links to download compatible wallets

### Technical Implementation

- **Wallet Detection**: `src/utils/walletCompatibility.ts`
- **Environment Detection**: `src/utils/environment.ts`
- **User Interface**: `src/components/WalletCompatibilityModal.tsx`
- **Auto-Setup**: `src/components/InvisibleXMTPSetup.tsx`

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

## Key Features

- ✅ Step tracking with Base Chain integration
- ✅ Token rewards system
- ✅ Social feed and sharing
- ✅ Achievement system
- ✅ Streak tracking
- ✅ **Smart wallet compatibility detection**
- ✅ **XMTP messaging for community chat**
- ✅ **Environment-aware wallet recommendations**
- ✅ Cross-Origin-Opener-Policy configuration
- ✅ Base network validation

## XMTP Messaging Integration

The app includes full XMTP messaging functionality with intelligent wallet compatibility:

### Features
- **Real-time messaging** between users
- **Wallet-to-wallet conversations** using XMTP protocol
- **Message history** and conversation management
- **Automatic wallet compatibility detection**
- **User-friendly guidance** for incompatible wallets
- **Production-ready** with proper error handling

### How It Works
1. **Wallet Detection**: App detects connected wallet type
2. **Compatibility Check**: Verifies XMTP compatibility
3. **User Guidance**: Shows appropriate wallet recommendations if needed
4. **Registration Check**: Uses `Client.canMessage()` to check XMTP registration
5. **Client Initialization**: Creates XMTP client for messaging
6. **Real-time Chat**: Users can start conversations with any wallet address

### Technical Implementation
- **XMTP Client**: Production environment with proper app versioning
- **Message Polling**: 3-second intervals for reliable message delivery
- **Error Handling**: Comprehensive error states and user feedback
- **State Management**: React Context with proper cleanup and subscriptions
- **Wallet Integration**: Seamless integration with wagmi and ethers
- **Compatibility Detection**: Real-time wallet type detection

### User Experience
- **Automatic Setup**: One-click setup for compatible wallets
- **Clear Guidance**: Helpful messages for incompatible wallets
- **Conversation List**: View all active conversations
- **Real-time Chat**: Send and receive messages instantly
- **Address Formatting**: Clean display of wallet addresses
- **Message Timestamps**: Relative time display for messages

## Troubleshooting

### Common Issues

1. **Wallet Connection Fails**
   - Check OnchainKit API key in `.env`
   - Verify COOP header in `vite.config.ts`

2. **XMTP Initialization Fails**
   - **Check wallet compatibility** - Smart wallets don't work with XMTP
   - Install MetaMask or Coinbase Wallet Extension for desktop
   - Use Coinbase Wallet mobile app for mobile/mini apps
   - Check browser console for detailed error messages

3. **Contract Calls Fail**
   - Verify contract addresses in `.env`
   - Check network connection (Base vs Base Sepolia)

4. **Build Errors**
   - Run `npm install` to ensure all dependencies
   - Check TypeScript configuration

### Wallet-Specific Issues

#### Coinbase Smart Wallet Users
- **Problem**: Smart wallets cannot sign XMTP messages
- **Solution**: Install MetaMask or Coinbase Wallet Extension
- **Guidance**: App will show helpful modal with download links

#### Mobile Users
- **Problem**: Browser wallets may not work properly
- **Solution**: Use Coinbase Wallet mobile app
- **Guidance**: App detects mobile environment and recommends appropriate wallet

### Debug Commands
```bash
# Check wallet connection
npm run dev -- --debug

# Verify contract deployment
cast call $CONTRACT_ADDRESS "getUserStats(address)" $USER_ADDRESS --rpc-url https://mainnet.base.org

# Test XMTP compatibility
# Check browser console for wallet detection logs
```

## Development Notes

### Wallet Compatibility System
The app now includes a comprehensive wallet compatibility system that:
- Detects wallet types automatically
- Provides user-friendly guidance for incompatible wallets
- Offers direct download links for compatible wallets
- Handles different environments (desktop vs mobile vs mini app)

### Environment Detection
The app detects the current environment and adjusts wallet recommendations:
- **Desktop**: MetaMask, Coinbase Wallet Extension
- **Mobile**: Coinbase Wallet mobile app
- **Farcaster Mini App**: Coinbase Wallet mobile app

### XMTP Integration
XMTP messaging is now properly integrated with wallet compatibility:
- Only attempts setup with compatible wallets
- Provides clear error messages for incompatible wallets
- Offers seamless user experience for compatible wallets