import React, { useState } from 'react';
import { useClankerToken } from '../hooks/useClankerToken';
import { Coins, Send, Award, TrendingUp, ExternalLink, Copy } from 'lucide-react';

interface ClankerTokenWidgetProps {
  onReward?: (amount: string) => void;
  showRewardButton?: boolean;
}

export default function ClankerTokenWidget({ onReward, showRewardButton = false }: ClankerTokenWidgetProps) {
  const { 
    tokenData, 
    recentTransfers, 
    isTransferPending, 
    transferTokens, 
    rewardUser,
    contractAddress 
  } = useClankerToken();

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [showTransfer, setShowTransfer] = useState(false);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;

    try {
      await transferTokens(transferTo as `0x${string}`, transferAmount);
      setTransferTo('');
      setTransferAmount('');
      setShowTransfer(false);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const handleReward = async () => {
    const rewardAmount = '10'; // 10 CLANKER tokens for completing daily goal
    await rewardUser(rewardAmount);
    onReward?.(rewardAmount);
  };

  const copyAddress = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress);
    }
  };

  if (!tokenData) {
    return (
      <div className="bg-gray-900 border-4 border-gray-600 p-6 mb-6 opacity-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 mx-auto mb-4 flex items-center justify-center">
            <Coins className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-2">CLANKER TOKEN</h3>
          <p className="text-gray-400 text-sm">Connect wallet to view token balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border-4 border-orange-400 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-orange-400 flex items-center space-x-2">
          <Coins className="w-5 h-5" />
          <span>CLANKER TOKEN</span>
        </h3>
        <button
          onClick={() => setShowTransfer(!showTransfer)}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Token Balance Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="border-2 border-orange-400 p-4 bg-orange-400 bg-opacity-10">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">
              {parseFloat(tokenData.formattedBalance).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">YOUR BALANCE</div>
          </div>
        </div>
        
        <div className="border-2 border-gray-600 p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {(parseFloat(tokenData.totalSupply) / 1e18).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">TOTAL SUPPLY</div>
          </div>
        </div>
      </div>

      {/* Contract Info */}
      <div className="border-2 border-gray-600 p-3 mb-4 bg-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400">CONTRACT ADDRESS</div>
            <div className="text-sm text-white font-mono">
              {contractAddress?.slice(0, 10)}...{contractAddress?.slice(-8)}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={copyAddress}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://basescan.org/token/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Transfer Interface */}
      {showTransfer && (
        <div className="border-2 border-orange-400 p-4 mb-4 bg-orange-400 bg-opacity-10">
          <h4 className="font-bold text-orange-400 mb-3">SEND TOKENS</h4>
          <div className="space-y-3">
            <input
              type="text"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              placeholder="Recipient address (0x...)"
              className="w-full bg-gray-800 border-2 border-gray-600 text-white px-3 py-2 focus:border-orange-400 focus:outline-none"
            />
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="Amount to send"
              step="0.01"
              className="w-full bg-gray-800 border-2 border-gray-600 text-white px-3 py-2 focus:border-orange-400 focus:outline-none"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleTransfer}
                disabled={isTransferPending || !transferTo || !transferAmount}
                className="flex-1 bg-orange-400 text-black px-4 py-2 font-bold hover:bg-orange-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTransferPending ? 'SENDING...' : 'SEND TOKENS'}
              </button>
              <button
                onClick={() => setShowTransfer(false)}
                className="bg-gray-600 text-white px-4 py-2 font-bold hover:bg-gray-500 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward Button */}
      {showRewardButton && (
        <div className="mb-4">
          <button
            onClick={handleReward}
            className="w-full bg-green-600 text-white px-4 py-3 font-bold hover:bg-green-500 transition-colors flex items-center justify-center space-x-2"
          >
            <Award className="w-5 h-5" />
            <span>CLAIM DAILY REWARD (10 CLANKER)</span>
          </button>
        </div>
      )}

      {/* Recent Transfers */}
      {recentTransfers.length > 0 && (
        <div className="border-2 border-gray-600 p-4">
          <h4 className="font-bold text-white mb-3 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>RECENT ACTIVITY</span>
          </h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {recentTransfers.slice(0, 5).map((transfer, index) => (
              <div key={index} className="text-xs border-2 border-gray-700 p-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {transfer.from?.slice(0, 6)}...{transfer.from?.slice(-4)} →{' '}
                    {transfer.to?.slice(0, 6)}...{transfer.to?.slice(-4)}
                  </span>
                  <span className="text-orange-400 font-bold">
                    {(parseFloat(transfer.value) / 1e18).toFixed(2)} CLANKER
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400 text-center">
        💰 Earn CLANKER tokens by completing daily step goals
      </div>
    </div>
  );
}