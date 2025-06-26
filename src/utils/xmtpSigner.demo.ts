/**
 * XMTP Signer Implementation Demo
 * 
 * This file demonstrates how to use the XMTP signer implementation
 * with different wallet types and scenarios.
 */

import { createEOASigner, createSCWSigner, createAutoSigner, validateSigner, getSignerInfo, SUPPORTED_CHAIN_IDS } from './xmtpSigner';

// Example 1: Creating an EOA Signer (Standard Wallet)
export const demoEOASigner = async () => {
  console.log('🔧 Demo: Creating EOA Signer');
  
  // Mock wallet client for Coinbase Wallet
  const coinbaseWalletClient = {
    account: {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    },
    chain: {
      id: SUPPORTED_CHAIN_IDS.BASE
    },
    connector: {
      id: 'coinbaseWallet',
      name: 'Coinbase Wallet'
    },
    signMessage: async ({ message }: { message: string }) => {
      console.log('📝 Signing message:', message);
      // In real implementation, this would prompt user to sign
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
    }
  };

  try {
    const signer = createEOASigner(coinbaseWalletClient);
    console.log('✅ EOA Signer created:', signer.type);
    
    const isValid = await validateSigner(signer);
    console.log('✅ Signer validation:', isValid);
    
    const info = await getSignerInfo(signer);
    console.log('📋 Signer info:', info);
    
    return signer;
  } catch (error) {
    console.error('❌ EOA Signer creation failed:', error);
    throw error;
  }
};

// Example 2: Creating an SCW Signer (Smart Contract Wallet)
export const demoSCWSigner = async () => {
  console.log('🔧 Demo: Creating SCW Signer');
  
  // Mock wallet client for Safe Wallet
  const safeWalletClient = {
    account: {
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
    },
    chain: {
      id: SUPPORTED_CHAIN_IDS.BASE
    },
    connector: {
      id: 'safe',
      name: 'Safe Wallet',
      type: 'smartContractWallet'
    },
    signMessage: async ({ message }: { message: string }) => {
      console.log('📝 Signing message with SCW:', message);
      // In real implementation, this would prompt user to sign via Safe
      return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b';
    }
  };

  try {
    const signer = createSCWSigner(safeWalletClient, SUPPORTED_CHAIN_IDS.BASE);
    console.log('✅ SCW Signer created:', signer.type);
    
    const isValid = await validateSigner(signer);
    console.log('✅ Signer validation:', isValid);
    
    const info = await getSignerInfo(signer);
    console.log('📋 Signer info:', info);
    
    return signer;
  } catch (error) {
    console.error('❌ SCW Signer creation failed:', error);
    throw error;
  }
};

// Example 3: Auto-Detection Demo
export const demoAutoDetection = async () => {
  console.log('🔧 Demo: Auto-Detection System');
  
  // Test with different wallet types
  const wallets = [
    {
      name: 'Coinbase Wallet (EOA)',
      client: {
        account: { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        chain: { id: SUPPORTED_CHAIN_IDS.BASE },
        connector: { id: 'coinbaseWallet', name: 'Coinbase Wallet' },
        signMessage: async ({ message }: { message: string }) => '0x123...'
      }
    },
    {
      name: 'Safe Wallet (SCW)',
      client: {
        account: { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        chain: { id: SUPPORTED_CHAIN_IDS.BASE },
        connector: { id: 'safe', name: 'Safe Wallet', type: 'smartContractWallet' },
        signMessage: async ({ message }: { message: string }) => '0x123...'
      }
    },
    {
      name: 'Argent Wallet (SCW)',
      client: {
        account: { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
        chain: { id: SUPPORTED_CHAIN_IDS.BASE },
        connector: { id: 'argent', name: 'Argent Wallet' },
        signMessage: async ({ message }: { message: string }) => '0x123...'
      }
    }
  ];

  for (const wallet of wallets) {
    try {
      const signer = createAutoSigner(wallet.client);
      console.log(`✅ ${wallet.name}: Detected as ${signer.type}`);
      
      const isValid = await validateSigner(signer);
      console.log(`✅ ${wallet.name}: Validation ${isValid ? 'passed' : 'failed'}`);
    } catch (error) {
      console.error(`❌ ${wallet.name}: Failed -`, error);
    }
  }
};

// Example 4: XMTP Integration Demo
export const demoXMTPIntegration = async () => {
  console.log('🔧 Demo: XMTP Integration');
  
  // This would typically be used in your XMTP client initialization
  const walletClient = {
    account: { address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' },
    chain: { id: SUPPORTED_CHAIN_IDS.BASE },
    connector: { id: 'coinbaseWallet', name: 'Coinbase Wallet' },
    signMessage: async ({ message }: { message: string }) => '0x123...'
  };

  try {
    // Step 1: Create signer
    const signer = createAutoSigner(walletClient);
    console.log('✅ Signer created:', signer.type);
    
    // Step 2: Validate signer
    const isValid = await validateSigner(signer);
    if (!isValid) {
      throw new Error('Invalid signer');
    }
    console.log('✅ Signer validated');
    
    // Step 3: Get signer info for debugging
    const info = await getSignerInfo(signer);
    console.log('📋 Signer info:', info);
    
    // Step 4: Use with XMTP Client (commented out as this is just a demo)
    // const client = await Client.create(signer, { env: 'production' });
    // console.log('✅ XMTP client created successfully');
    
    console.log('🎉 XMTP integration demo completed!');
    return signer;
  } catch (error) {
    console.error('❌ XMTP integration failed:', error);
    throw error;
  }
};

// Example 5: Error Handling Demo
export const demoErrorHandling = () => {
  console.log('🔧 Demo: Error Handling');
  
  // Test invalid wallet clients
  const invalidClients = [
    { name: 'Null client', client: null },
    { name: 'Empty client', client: {} },
    { name: 'Missing account', client: { chain: { id: 1 } } },
    { name: 'Missing address', client: { account: {}, chain: { id: 1 } } }
  ];

  for (const test of invalidClients) {
    try {
      createAutoSigner(test.client as any);
      console.log(`❌ ${test.name}: Should have thrown error`);
    } catch (error) {
      console.log(`✅ ${test.name}: Correctly threw error -`, (error as Error).message);
    }
  }
};

// Run all demos
export const runAllDemos = async () => {
  console.log('🚀 Running XMTP Signer Demos...\n');
  
  try {
    await demoEOASigner();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await demoSCWSigner();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await demoAutoDetection();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await demoXMTPIntegration();
    console.log('\n' + '='.repeat(50) + '\n');
    
    demoErrorHandling();
    console.log('\n' + '='.repeat(50) + '\n');
    
    console.log('🎉 All demos completed successfully!');
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
};

// Usage examples for different scenarios
export const usageExamples = {
  // Basic EOA usage
  basicEOA: `
// For standard wallets like Coinbase Wallet, MetaMask
const signer = createEOASigner(walletClient);
const client = await Client.create(signer, { env: 'production' });
  `,
  
  // SCW usage
  scwUsage: `
// For smart contract wallets like Safe, Argent
const signer = createSCWSigner(walletClient, SUPPORTED_CHAIN_IDS.BASE);
const client = await Client.create(signer, { env: 'production' });
  `,
  
  // Auto-detection usage
  autoDetection: `
// Automatically detects wallet type and creates appropriate signer
const signer = createAutoSigner(walletClient);
const isValid = await validateSigner(signer);
if (isValid) {
  const client = await Client.create(signer, { env: 'production' });
}
  `,
  
  // React context usage
  reactContext: `
// In your React component
const { isInitialized, conversations, sendMessage } = useXMTP();

// The context automatically handles signer creation and validation
// when the wallet connects
  `
};

export default {
  demoEOASigner,
  demoSCWSigner,
  demoAutoDetection,
  demoXMTPIntegration,
  demoErrorHandling,
  runAllDemos,
  usageExamples
}; 