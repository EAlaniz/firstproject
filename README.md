# 10K - Move. Earn. Connect.

An inclusive wellness platform that rewards your daily movement with tokens and connects you with a community of movers on Base Chain.

## 🚀 Features

- **Step Tracking**: Connect your wallet to start tracking daily steps
- **Token Rewards**: Earn tokens for achieving daily step goals and maintaining streaks
- **Social Connection**: Share achievements and connect with friends via XMTP messaging
- **Base Chain Integration**: Fast, low-cost transactions with excellent UX
- **Multi-Wallet Support**: Works with Coinbase Wallet and other Web3 wallets

## 🔧 XMTP Signer Implementation

This project implements a comprehensive XMTP (Extensible Message Transport Protocol) signer system that supports both Externally Owned Accounts (EOAs) and Smart Contract Wallets (SCWs).

### Signer Types

#### 1. EOA (Externally Owned Account) Signer
- **Purpose**: Standard wallets like MetaMask, Coinbase Wallet
- **Implementation**: `createEOASigner()` in `src/utils/xmtpSigner.ts`
- **Features**:
  - Message signing with wallet client
  - Ethereum address identification
  - Automatic signature conversion to Uint8Array

#### 2. SCW (Smart Contract Wallet) Signer
- **Purpose**: Smart contract wallets like Safe, Argent, Rainbow
- **Implementation**: `createSCWSigner()` in `src/utils/xmtpSigner.ts`
- **Features**:
  - Chain ID specification for signature verification
  - Support for multiple blockchain networks
  - Enhanced security for smart contract interactions

### Auto-Detection System

The `createAutoSigner()` function automatically detects wallet type and creates the appropriate signer:

```typescript
// Automatically detects EOA vs SCW and creates appropriate signer
const signer = createAutoSigner(walletClient);
```

### Supported Networks

- **Mainnet** (Chain ID: 1)
- **Base** (Chain ID: 8453) - Primary network
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Polygon** (Chain ID: 137)
- **zkSync** (Chain ID: 324)
- **Linea** (Chain ID: 59144)
- **Fantom** (Chain ID: 250)

### XMTP Context Integration

The app uses a React context (`XMTPContext`) to manage XMTP state:

```typescript
// Wrap your app with XMTPProvider
<XMTPProvider>
  <App />
</XMTPProvider>

// Use XMTP functionality in components
const { 
  isInitialized, 
  conversations, 
  sendMessage, 
  createConversation 
} = useXMTP();
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- A Web3 wallet (Coinbase Wallet recommended)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd move10k

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

The app is configured to work with Base Chain by default. No additional environment variables are required for basic functionality.

### XMTP Configuration

XMTP is automatically initialized when a wallet connects. The system:

1. **Detects wallet type** (EOA vs SCW)
2. **Creates appropriate signer** using our utility functions
3. **Validates signer** before XMTP client creation
4. **Initializes XMTP client** with proper error handling
5. **Manages conversations** and messaging state

### Key Files

- `src/utils/xmtpSigner.ts` - XMTP signer implementation
- `src/contexts/XMTPContext.tsx` - React context for XMTP state
- `src/xmtpClient.ts` - XMTP client initialization
- `src/components/XMTPMessaging.tsx` - Messaging UI component

## 📱 Usage

### Connecting Wallet

1. Click "Get Started" on the landing page
2. Connect your Coinbase Wallet (or other Web3 wallet)
3. Approve the connection in your wallet

### Enabling XMTP Messaging

1. Click "Enable Messages" button in the header
2. Sign the XMTP authentication message in your wallet
3. Start chatting with other users!

### Step Tracking

1. Set your daily step goal (5K, 7.5K, 10K, 12.5K, or 15K steps)
2. Use the step tracker to log your progress
3. Earn tokens for completing goals

## 🔐 Security

- **Wallet Integration**: Uses wagmi for secure wallet connections
- **XMTP Encryption**: All messages are end-to-end encrypted
- **Signature Validation**: Proper signature verification for all transactions
- **No Private Key Storage**: Private keys never leave your wallet

## 🌐 Supported Environments

- **Desktop**: Full functionality with all features
- **Mobile**: Optimized for mobile wallets and responsive design
- **Farcaster**: Mini app integration for Farcaster users

## 📊 Technical Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: wagmi + viem
- **Messaging**: XMTP V3 SDK
- **Blockchain**: Base Chain (Ethereum L2)
- **Build Tool**: Vite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues related to:
- **Wallet Connection**: Check your wallet settings and network configuration
- **XMTP Messaging**: Ensure you've signed the authentication message
- **Step Tracking**: Verify your device permissions for step counting

## 🔗 Links

- [Base Chain](https://base.org/)
- [XMTP Documentation](https://docs.xmtp.org/)
- [Coinbase Wallet](https://www.coinbase.com/wallet)
- [wagmi Documentation](https://wagmi.sh/)
