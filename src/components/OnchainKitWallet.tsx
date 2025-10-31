import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
} from '@coinbase/onchainkit/identity';

/**
 * OnchainKit Wallet component - matches Base docs pattern exactly
 * https://docs.base.org/onchainkit/wallet/wallet
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
        </Identity>
        <WalletDropdownDisconnect />
      </WalletDropdown>
    </Wallet>
  );
};
