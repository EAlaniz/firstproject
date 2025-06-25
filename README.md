# 10K - Move. Earn. Connect.

A Farcaster Mini App for step tracking, social connection, and token rewards on Base Chain with XMTP messaging integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- A Base Chain RPC URL
- OnchainKit API key (optional)

### Installation

1. **Clone and install dependencies**
```bash
git clone <your-repo-url>
cd move10k
npm install
```

2. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# XMTP Configuration
VITE_XMTP_ENV=production

# RPC Configuration  
VITE_RPC_URL=https://your-base-rpc-url.com/

# Contract Configuration
VITE_STEP_TRACKER_CONTRACT=0x0000000000000000000000000000000000000000

# OnchainKit Configuration (optional)
VITE_ONCHAINKIT_API_KEY=your_onchainkit_api_key_here
```

3. **Start development server**
```bash
npm run dev
```

4. **Build for production**
```bash
npm run build
```

## 🏗️ Architecture

### Core Technologies
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Wagmi** for Ethereum interactions
- **XMTP** for decentralized messaging
- **Farcaster Auth Kit** for mini app authentication
- **Tailwind CSS** for styling
- **Base Chain** for blockchain operations

### Key Features
- ✅ **Step Tracking**: Real-time step counting with smart contract integration
- ✅ **XMTP Messaging**: Decentralized wallet-to-wallet messaging
- ✅ **Farcaster Mini App**: Native integration with Farcaster ecosystem
- ✅ **Token Rewards**: Earn tokens for completing daily goals
- ✅ **Social Features**: Share achievements and connect with community
- ✅ **Wallet Support**: MetaMask and Coinbase Wallet compatibility
- ✅ **Responsive Design**: Mobile-first design optimized for mini apps

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_XMTP_ENV` | XMTP environment (production/dev) | No | `production` |
| `VITE_RPC_URL` | Base Chain RPC endpoint | Yes | - |
| `VITE_STEP_TRACKER_CONTRACT` | Smart contract address | Yes | - |
| `VITE_ONCHAINKIT_API_KEY` | OnchainKit API key | No | - |

### Wallet Configuration

The app supports multiple wallet providers:
- **Coinbase Wallet** (primary)
- **MetaMask** (fallback)
- **Farcaster Auth Kit** (mini app mode)

### XMTP Integration

XMTP messaging is fully integrated with:
- **Automatic registration** for new users
- **Real-time message polling** (3-second intervals)
- **Conversation management** with proper cleanup
- **Error handling** with user-friendly messages
- **Production environment** with proper app versioning

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Project Structure

```
src/
├── components/          # React components
│   ├── XMTPMessaging.tsx    # XMTP chat interface
│   ├── MiniAppWalletConnector.tsx  # Wallet connection
│   ├── FarcasterMiniApp.tsx # Mini app wrapper
│   └── ...
├── contexts/           # React contexts
│   └── XMTPContext.tsx # XMTP state management
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── constants.ts       # App configuration
├── wagmi.ts          # Wagmi configuration
└── App.tsx           # Main app component
```

### Mini App Detection

The app automatically detects Farcaster mini app environment and adjusts behavior:
- **Wallet connection**: Uses native wallet in mini app mode
- **UI layout**: Optimized for mobile mini app interface
- **Navigation**: Simplified for mini app constraints

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** with automatic builds

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting provider
```

### Farcaster Mini App Submission

1. **Deploy** your app to a public URL
2. **Test** in Farcaster mini app environment
3. **Submit** for review through Farcaster's developer portal

## 🔍 Troubleshooting

### Common Issues

#### XMTP Initialization Fails
- Ensure wallet is connected before initializing XMTP
- Check browser console for detailed error messages
- Verify wallet supports EIP-191 signatures (MetaMask, Coinbase Wallet)

#### Wallet Connection Issues
- Check RPC URL configuration
- Verify network is set to Base Chain
- Ensure proper CSP headers for wallet connections

#### Build Errors
- Run `npm install` to ensure all dependencies
- Check TypeScript configuration
- Verify environment variables are set

#### Mini App Issues
- Test in actual Farcaster mini app environment
- Check mini app detection logic
- Verify wallet connection flow in mini app mode

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG=true
```

### Support

For issues related to:
- **XMTP**: Check [XMTP documentation](https://xmtp.org/docs)
- **Farcaster**: Visit [Farcaster developer docs](https://docs.farcaster.xyz/)
- **Base Chain**: See [Base documentation](https://docs.base.org/)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**Built with ❤️ for the Farcaster community**# Updated Wed Jun 25 15:49:13 PDT 2025
# Vercel deployment test - Wed Jun 25 15:52:21 PDT 2025
