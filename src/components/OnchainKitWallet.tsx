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
import { useIsBaseMiniApp } from '../hooks/useIsBaseMiniApp';

export const OnchainKitWallet = () => {
  const { isMiniApp } = useIsBaseMiniApp();
  return (
    <div className="flex justify-end">
      <Wallet>
        <ConnectWallet>
          <Avatar className={isMiniApp ? "h-7 w-7" : "h-6 w-6"} />
          {!isMiniApp && <Name />}
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className="ock:text-ock-foreground-muted" />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
};
