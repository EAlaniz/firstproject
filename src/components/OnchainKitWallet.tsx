import { Wallet } from '@coinbase/onchainkit/wallet';

/**
 * OnchainKit Wallet - Simplified Implementation
 * Using the minimal approach from official docs: https://docs.base.org/onchainkit/latest/components/wallet/wallet
 *
 * This renders a complete wallet with built-in UI - no custom children needed.
 * OnchainKit handles all styling, positioning, and dropdowns internally.
 */
export const OnchainKitWallet = () => {
  return <Wallet />;
};
