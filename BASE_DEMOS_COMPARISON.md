# Base Demos Best Practices Comparison

This document compares our codebase against best practices from the [Base demos repository](https://github.com/base/demos/tree/master) to ensure we're following recommended patterns for Base Account and Mini Apps.

## Executive Summary

✅ **Overall Assessment**: Our codebase follows most Base demos best practices. Below are specific comparisons and recommendations.

---

## 1. OnchainKitProvider Configuration

### Current Implementation ✅
```typescript
// src/main.tsx
<OnchainKitProvider
  apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY || ''}
  chain={base}
  miniKit={{ enabled: true }}
  config={{
    appearance: {
      mode: 'dark',
      theme: 'base',
      name: '10K',
    },
  }}
>
```

### Base Demos Pattern
Base demos typically use:
- ✅ `miniKit={{ enabled: true }}` - **We're doing this correctly**
- ✅ `chain={base}` - **Correct**
- ✅ Appearance config with `mode`, `theme`, `name` - **Correct**

### Recommendations
✅ **No changes needed** - Our OnchainKitProvider configuration matches Base demos patterns.

---

## 2. Wagmi Configuration & Coinbase Wallet Connector

### Current Implementation ✅
```typescript
// wagmi.config.ts
coinbaseWallet({
  appName: '10K - Move. Earn. Connect.',
  appLogoUrl: 'https://www.move10k.xyz/10k-icon.png',
  jsonRpcUrl: rpcUrl,
  chainId: 8453,
  // Farcaster-specific options
  ...(isFarcaster && {
    disableExplorer: true,
    overrideIsMetaMask: false,
  }),
})
```

### Base Demos Pattern
Base demos emphasize:
- ✅ `appName` and `appLogoUrl` - **We have this**
- ✅ `jsonRpcUrl` for Base network - **We have this**
- ✅ `chainId: 8453` for Base - **We have this**
- ✅ Farcaster compatibility - **We have this**

### Recommendations
✅ **No changes needed** - Our wagmi config follows best practices.

---

## 3. Base Account Capabilities Detection

### Current Implementation ✅
```typescript
// src/hooks/useBaseAccountCapabilities.ts
const baseHex = '0x2105';
const caps = resp?.[baseHex] || {};
setCapabilities({
  atomicBatch: caps?.atomicBatch?.supported === true,
  paymasterService: caps?.paymasterService?.supported === true,
  auxiliaryFunds: caps?.auxiliaryFunds?.supported === true,
});
```

### Base Demos Pattern
Base demos typically:
- ✅ Use `wallet_getCapabilities` with `0x2105` namespace - **We're doing this**
- ✅ Check `atomicBatch`, `paymasterService`, `auxiliaryFunds` - **We're checking all three**
- ✅ Store capabilities in state - **We're doing this**

### Recommendations
✅ **No changes needed** - Our capabilities detection matches Base demos patterns.

---

## 4. Mini App Detection

### Current Implementation ✅
```typescript
// src/hooks/useIsBaseMiniApp.ts
// Heuristic 1: Check if embedded in iframe
const isEmbedded = window.self !== window.top;

// Heuristic 2: Check for OnchainKit MiniKit context
const isMiniKit = Boolean(
  win.__FARCASTER__ || 
  win.__MINIAPP__ || 
  win.__BASEAPP__ ||
  win.farcaster ||
  win.baseApp
);

// Heuristic 3: capability request
const caps = await client.request({
  method: 'wallet_getCapabilities',
  params: [address],
});
const baseHex = '0x2105';
const hasAny = Boolean(caps?.[baseHex]);
```

### Base Demos Pattern
Base demos typically use:
- ✅ Iframe detection - **We have this**
- ✅ Global hints (`__BASEAPP__`, `__MINIAPP__`, `__FARCASTER__`) - **We check all of these**
- ✅ Capability detection as fallback - **We use this**

### Recommendations
✅ **No changes needed** - Our mini app detection is comprehensive and matches Base demos.

---

## 5. Sponsored Transactions (Paymaster Service)

### Current Implementation ⚠️
```typescript
// src/hooks/useSponsoredTransactions.ts
// We have a hook but it's not clear if we're using it
export function useSponsoredTransactions(paymasterUrl?: string) {
  // ... implementation exists
}
```

### Base Demos Pattern
Base demos show:
- ✅ Use `useCapabilities` from `wagmi/experimental` - **We're doing this**
- ✅ Use `useWriteContracts` with capabilities - **We're doing this**
- ⚠️ **Recommendation**: Ensure we're actually calling sponsored transactions where applicable

### Recommendations
⚠️ **Action Item**: Review where sponsored transactions should be used (e.g., step recording, rewards claiming) and ensure we're using `useSponsoredTransactions` hook.

---

## 6. Wallet Component Usage

### Current Implementation ✅
```typescript
// src/components/OnchainKitWallet.tsx
<Wallet>
  <ConnectWallet />
  <WalletDropdown>
    <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
      <Avatar />
      <Name />
      <Address className="text-gray-400" />
    </Identity>
    <WalletDropdownDisconnect />
  </WalletDropdown>
</Wallet>
```

### Base Demos Pattern
Base demos typically:
- ✅ Use `<Wallet>`, `<ConnectWallet>`, `<WalletDropdown>` - **We're using these**
- ✅ Use `<Identity>` with `<Avatar>`, `<Name>`, `<Address>` - **We have all of these**
- ✅ Include `<WalletDropdownDisconnect>` - **We have this**

### Recommendations
✅ **No changes needed** - Our wallet component structure matches Base demos.

**Note on Bottom Sheet**: We've ensured the bottom sheet in mini apps is functional and scrollable, which is the correct approach for mobile UX.

---

## 7. Error Handling & Boundaries

### Current Implementation ✅
```typescript
// src/main.tsx
<ErrorBoundary>
  <WagmiProvider config={wagmiConfig}>
    {/* ... */}
  </WagmiProvider>
</ErrorBoundary>
```

### Base Demos Pattern
Base demos typically:
- ✅ Use error boundaries - **We have this**

### Recommendations
✅ **No changes needed**.

---

## 8. Query Client Configuration

### Current Implementation ✅
```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: 1000,
    },
  },
});
```

### Base Demos Pattern
Base demos typically:
- ✅ Use QueryClient with retry logic - **We have this**

### Recommendations
✅ **No changes needed**.

---

## 9. Environment Configuration

### Current Implementation ✅
```typescript
// .env variables
VITE_ONCHAINKIT_API_KEY
VITE_RPC_URL
```

### Base Demos Pattern
Base demos typically use:
- ✅ Environment variables for API keys - **We're doing this**
- ✅ Environment variables for RPC URLs - **We're doing this**

### Recommendations
✅ **No changes needed**.

---

## 10. Atomic Batch Transactions

### Current Implementation ❌
```typescript
// We detect atomicBatch capability but don't appear to use it
```

### Base Demos Pattern
Base demos show that when `atomicBatch` is available, you should:
- Batch multiple transactions together
- Use `writeContracts` from `wagmi/experimental` with batch flag

### Recommendations
⚠️ **Action Item**: Consider using atomic batch for:
- Recording steps + claiming rewards in a single transaction
- Multiple operations that should succeed/fail together

**Example from Base demos:**
```typescript
const { writeContracts } = useWriteContracts();
writeContracts({
  contracts: [
    { address: contract1, abi: abi1, functionName: 'method1', args: [...] },
    { address: contract2, abi: abi2, functionName: 'method2', args: [...] },
  ],
  capabilities: { atomicBatch: {} },
});
```

---

## Summary of Action Items

### ✅ Already Following Best Practices
1. OnchainKitProvider configuration
2. Wagmi/Coinbase Wallet connector setup
3. Base Account capabilities detection
4. Mini app detection heuristics
5. Wallet component structure
6. Error boundaries
7. Query client configuration
8. Environment variable usage

### ⚠️ Recommendations for Improvement
1. **Sponsored Transactions**: Ensure `useSponsoredTransactions` hook is used for applicable operations (step recording, rewards)
2. **Atomic Batch**: Consider implementing atomic batch transactions for multi-step operations

### 📝 Notes
- Our bottom sheet handling for mini apps is correct (functional and scrollable)
- Our mini app detection is comprehensive and follows Base demos patterns
- Overall architecture aligns well with Base demos best practices

---

## References
- [Base Demos Repository](https://github.com/base/demos/tree/master)
- [OnchainKit Documentation](https://docs.base.org/onchainkit)
- [Base Account Documentation](https://docs.base.org/base-account)

