#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  sourceDir: process.cwd(),
  targetDir: process.argv[2] || '../base-mini-app-10k',
  templateRepo: 'https://github.com/coinbase/build-onchain-apps.git',
  templatePath: 'templates/base-mini-app'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function executeCommand(command, description, options = {}) {
  try {
    log(`   Running: ${command}`, 'blue');
    execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    logSuccess(description);
  } catch (error) {
    logError(`Failed: ${description}`);
    throw error;
  }
}

function executeCommandSafe(command, description, options = {}) {
  try {
    log(`   Running: ${command}`, 'blue');
    execSync(command, { 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    logSuccess(description);
    return true;
  } catch (error) {
    logWarning(`Failed (non-critical): ${description}`);
    return false;
  }
}

function copyFile(source, target, description) {
  try {
    const sourceFile = path.join(config.sourceDir, source);
    const targetFile = path.join(config.targetDir, target);
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetFile);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      logSuccess(`${description}: ${source} → ${target}`);
    } else {
      logWarning(`Source file not found: ${source}`);
    }
  } catch (error) {
    logError(`Failed to copy ${source}: ${error.message}`);
  }
}

function copyDirectory(source, target, description) {
  try {
    const sourceDir = path.join(config.sourceDir, source);
    const targetDir = path.join(config.targetDir, target);
    
    if (fs.existsSync(sourceDir)) {
      executeCommand(`cp -r "${sourceDir}" "${targetDir}"`, description);
    } else {
      logWarning(`Source directory not found: ${source}`);
    }
  } catch (error) {
    logError(`Failed to copy directory ${source}: ${error.message}`);
  }
}

function updatePackageJson() {
  try {
    const packageJsonPath = path.join(config.targetDir, 'package.json');
    const sourcePackagePath = path.join(config.sourceDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      logError('Target package.json not found');
      return;
    }
    
    const targetPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Update basic info
    targetPackage.name = '10k-base-mini-app';
    targetPackage.description = 'Inclusive wellness app for step tracking and token rewards on Base Chain';
    
    // Add/update dependencies with compatible versions
    const newDependencies = {
      '@coinbase/onchainkit': '^0.31.6',
      '@coinbase/wallet-sdk': '^4.3.4',
      '@rainbow-me/rainbowkit': '^2.0.0',
      '@tanstack/react-query': '^5.80.7',
      'lucide-react': '^0.344.0',
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
      'viem': '^2.21.0',
      'wagmi': '^2.12.0'
    };
    
    targetPackage.dependencies = { ...targetPackage.dependencies, ...newDependencies };
    
    // Add Base-specific scripts
    targetPackage.scripts = {
      ...targetPackage.scripts,
      'deploy:base': 'vite build && echo "Deploy to Base Chain"',
      'test:contracts': 'forge test',
      'deploy:contracts': 'forge script script/Deploy.s.sol --rpc-url base --broadcast'
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(targetPackage, null, 2));
    logSuccess('Updated package.json with Base dependencies');
  } catch (error) {
    logError(`Failed to update package.json: ${error.message}`);
  }
}

function createEnvFiles() {
  const envExample = `# Coinbase OnchainKit API Key
VITE_ONCHAINKIT_API_KEY=your_coinbase_api_key_here

# WalletConnect Project ID (optional)
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Smart Contract Addresses (replace with your deployed contracts)
VITE_STEP_TRACKER_CONTRACT=0x1234567890123456789012345678901234567890
VITE_TOKEN_CONTRACT=0x0987654321098765432109876543210987654321

# Base Chain RPC URLs (optional - uses defaults)
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org`;

  const envPath = path.join(config.targetDir, '.env.example');
  fs.writeFileSync(envPath, envExample);
  logSuccess('Created .env.example file');
  
  // Create empty .env file if it doesn't exist
  const envLocalPath = path.join(config.targetDir, '.env');
  if (!fs.existsSync(envLocalPath)) {
    fs.writeFileSync(envLocalPath, '# Copy from .env.example and fill in your values\n');
    logSuccess('Created empty .env file');
  }
}

function createMiniAppManifest() {
  const manifest = {
    name: "10K - Move. Earn. Connect.",
    short_name: "10K",
    description: "Inclusive wellness app for step tracking, social connection, and token rewards on Base Chain",
    version: "1.0.0",
    manifest_version: 3,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#22c55e",
    background_color: "#000000",
    scope: "/",
    categories: ["health", "fitness", "social", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ],
    permissions: ["wallet", "notifications", "storage"],
    base_chain: {
      network: "base",
      contracts: {
        step_tracker: "VITE_STEP_TRACKER_CONTRACT",
        reward_token: "VITE_TOKEN_CONTRACT"
      }
    },
    features: [
      "step_tracking",
      "token_rewards",
      "social_feed",
      "achievements",
      "streak_tracking"
    ],
    integrations: [
      "apple_health",
      "fitbit",
      "garmin",
      "whoop",
      "oura_ring",
      "xmtp",
      "farcaster"
    ]
  };
  
  const manifestPath = path.join(config.targetDir, 'mini-app.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  logSuccess('Created mini-app.json manifest');
}

function updateViteConfig() {
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
    },
  },
});`;

  const viteConfigPath = path.join(config.targetDir, 'vite.config.ts');
  fs.writeFileSync(viteConfigPath, viteConfig);
  logSuccess('Updated vite.config.ts with COOP header');
}

function createDeploymentGuide() {
  const guide = `# 10K Base Mini App Deployment Guide

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your API keys and contract addresses
   \`\`\`

3. **Start development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

## Smart Contract Deployment

### Prerequisites
- Install Foundry: \`curl -L https://foundry.paradigm.xyz | bash && foundryup\`
- Get Base Sepolia ETH from [faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- Get Basescan API key from [Basescan](https://basescan.org/apis)

### Deploy to Base Sepolia (Testnet)
\`\`\`bash
forge create --rpc-url https://sepolia.base.org \\
  --private-key $PRIVATE_KEY \\
  --etherscan-api-key $BASESCAN_API_KEY \\
  --verify \\
  smart-contracts/BaseStepTracker.sol:BaseStepTracker \\
  --constructor-args $TOKEN_ADDRESS
\`\`\`

### Deploy to Base Mainnet
\`\`\`bash
forge create --rpc-url https://mainnet.base.org \\
  --private-key $PRIVATE_KEY \\
  --etherscan-api-key $BASESCAN_API_KEY \\
  --verify \\
  smart-contracts/BaseStepTracker.sol:BaseStepTracker \\
  --constructor-args $TOKEN_ADDRESS
\`\`\`

## Production Deployment

### Build for production:
\`\`\`bash
npm run build
\`\`\`

### Deploy options:
1. **Vercel** (Recommended)
2. **Netlify**
3. **Base hosting platform**

## Submit to Coinbase Mini App Directory

1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Navigate to Mini Apps section
3. Submit your deployed app for review
4. Include app metadata and screenshots

## Environment Variables

Required variables in \`.env\`:
- \`VITE_ONCHAINKIT_API_KEY\`: Get from Coinbase Developer Platform
- \`VITE_STEP_TRACKER_CONTRACT\`: Your deployed step tracker contract
- \`VITE_TOKEN_CONTRACT\`: Your deployed token contract

## Resources

- [Base Documentation](https://docs.base.org/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
`;

  const guidePath = path.join(config.targetDir, 'DEPLOYMENT.md');
  fs.writeFileSync(guidePath, guide);
  logSuccess('Created DEPLOYMENT.md guide');
}

function fixNpmPermissions() {
  log('\n🔧 Attempting to fix npm permissions...', 'yellow');
  
  // Try to fix npm permissions
  const npmCacheDir = execSync('npm config get cache', { encoding: 'utf8' }).trim();
  const userId = process.getuid ? process.getuid() : null;
  const groupId = process.getgid ? process.getgid() : null;
  
  if (userId && groupId) {
    const success = executeCommandSafe(
      `sudo chown -R ${userId}:${groupId} "${npmCacheDir}"`,
      'Fixed npm cache permissions',
      { silent: true }
    );
    
    if (success) {
      logSuccess('npm permissions fixed');
      return true;
    }
  }
  
  // Alternative: clear npm cache
  const cacheCleared = executeCommandSafe(
    'npm cache clean --force',
    'Cleared npm cache',
    { silent: true }
  );
  
  if (cacheCleared) {
    logSuccess('npm cache cleared');
    return true;
  }
  
  return false;
}

function installDependencies() {
  logStep(9, 'Installing dependencies');
  
  // Change to target directory
  const originalDir = process.cwd();
  process.chdir(config.targetDir);
  
  try {
    // First try normal npm install
    try {
      executeCommand('npm install', 'Installed npm dependencies');
      return;
    } catch (error) {
      logWarning('Standard npm install failed, trying fixes...');
    }
    
    // Try to fix permissions and retry
    if (fixNpmPermissions()) {
      try {
        executeCommand('npm install', 'Installed npm dependencies (after permission fix)');
        return;
      } catch (error) {
        logWarning('npm install still failing after permission fix');
      }
    }
    
    // Try with --no-optional flag
    try {
      executeCommand('npm install --no-optional', 'Installed npm dependencies (no optional)');
      return;
    } catch (error) {
      logWarning('npm install with --no-optional failed');
    }
    
    // Try with yarn as fallback
    try {
      executeCommand('yarn install', 'Installed dependencies with yarn');
      return;
    } catch (error) {
      logWarning('yarn install failed');
    }
    
    // Final fallback: manual instructions
    logError('Automatic dependency installation failed');
    log('\n📋 Manual installation required:', 'yellow');
    log(`1. cd ${config.targetDir}`, 'cyan');
    log('2. Fix npm permissions: sudo chown -R $(whoami) ~/.npm', 'cyan');
    log('3. npm install', 'cyan');
    
  } finally {
    // Always return to original directory
    process.chdir(originalDir);
  }
}

async function main() {
  try {
    log('🚀 Starting 10K to Base Mini App Kit Migration', 'bright');
    log('================================================', 'bright');
    
    // Step 1: Clone Base Mini App Kit template
    logStep(1, 'Setting up Base Mini App Kit template');
    if (!fs.existsSync(config.targetDir)) {
      // Clone the repository
      executeCommand(
        `git clone ${config.templateRepo} temp-base-kit`,
        'Cloned Base Mini App Kit repository'
      );
      
      // Check if the template path exists
      const templateSourcePath = path.join('temp-base-kit', config.templatePath);
      if (fs.existsSync(templateSourcePath)) {
        executeCommand(
          `mv "${templateSourcePath}" "${config.targetDir}"`,
          'Moved template to target directory'
        );
      } else {
        // Fallback: create basic Vite React structure
        logWarning('Template path not found, creating basic structure');
        fs.mkdirSync(config.targetDir, { recursive: true });
        
        // Copy from export-package-base as fallback
        const fallbackSource = path.join(config.sourceDir, 'export-package-base');
        if (fs.existsSync(fallbackSource)) {
          executeCommand(
            `cp -r "${fallbackSource}"/* "${config.targetDir}"/`,
            'Copied fallback template structure'
          );
        } else {
          throw new Error('Neither template nor fallback structure found');
        }
      }
      
      executeCommand(
        'rm -rf temp-base-kit',
        'Cleaned up temporary files'
      );
    } else {
      logWarning('Target directory already exists, skipping clone');
    }
    
    // Step 2: Copy 10K app files
    logStep(2, 'Copying 10K app components and assets');
    copyDirectory('src/components', 'src/components', 'Copied React components');
    copyFile('src/App.tsx', 'src/App.tsx', 'Copied main App component');
    copyFile('src/main.tsx', 'src/main.tsx', 'Copied main entry point');
    copyFile('src/index.css', 'src/index.css', 'Copied CSS styles');
    copyFile('src/wagmi.ts', 'src/wagmi.ts', 'Copied Wagmi configuration');
    copyFile('tailwind.config.js', 'tailwind.config.js', 'Copied Tailwind config');
    copyFile('tsconfig.app.json', 'tsconfig.app.json', 'Copied TypeScript config');
    copyFile('index.html', 'index.html', 'Copied HTML template');
    
    // Step 3: Copy smart contracts
    logStep(3, 'Copying smart contracts');
    copyDirectory('smart-contracts', 'smart-contracts', 'Copied smart contracts');
    
    // Step 4: Update package.json
    logStep(4, 'Updating package.json with Base dependencies');
    updatePackageJson();
    
    // Step 5: Update Vite configuration
    logStep(5, 'Updating Vite configuration');
    updateViteConfig();
    
    // Step 6: Create environment files
    logStep(6, 'Creating environment configuration files');
    createEnvFiles();
    
    // Step 7: Create mini app manifest
    logStep(7, 'Creating mini app manifest');
    createMiniAppManifest();
    
    // Step 8: Create deployment guide
    logStep(8, 'Creating deployment documentation');
    createDeploymentGuide();
    
    // Step 9: Install dependencies
    installDependencies();
    
    // Success message
    log('\n🎉 Migration completed successfully!', 'green');
    log('=====================================', 'green');
    log('\nNext steps:', 'bright');
    log(`1. cd ${config.targetDir}`, 'cyan');
    log('2. cp .env.example .env', 'cyan');
    log('3. Edit .env with your API keys and contract addresses', 'cyan');
    log('4. npm run dev', 'cyan');
    log('\nFor deployment instructions, see DEPLOYMENT.md', 'yellow');
    
    if (fs.existsSync(path.join(config.targetDir, 'node_modules'))) {
      log('\n✅ Dependencies installed successfully!', 'green');
    } else {
      log('\n⚠️  Dependencies may need manual installation', 'yellow');
      log('Run the following commands:', 'yellow');
      log(`cd ${config.targetDir}`, 'cyan');
      log('sudo chown -R $(whoami) ~/.npm', 'cyan');
      log('npm install', 'cyan');
    }
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the migration
main();