import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

/**
 * OnchainKit Wallet component - 1:1 match between desktop and mini app
 * https://docs.base.org/onchainkit/wallet/wallet
 *
 * Desktop and mini app now have identical components:
 * - Identity (Avatar, Name, Address, EthBalance)
 * - WalletDropdownLink (optional navigation)
 * - WalletDropdownDisconnect
 */
export const OnchainKitWallet = () => {
  return (
    <Wallet>
      <ConnectWallet />
      <WalletDropdown>
        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
          <Avatar />
          <Name />
          <Address className="text-gray-400" />
          <EthBalance />
        </Identity>
        <WalletDropdownLink icon="wallet" href="https://keys.coinbase.com">
          Wallet
        </WalletDropdownLink>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
};
