import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { CHAIN_CONFIG } from '../../constants/chainConfig';
import { Plus } from 'lucide-react';

const NetworkSettings = () => {
  const { switchChain } = useWallet();

  const handleAddToMetaMask = async (chainId) => {
    await switchChain(chainId);
  };

  // Group chains by type (mainnet/testnet)
  const mainnetChains = Object.entries(CHAIN_CONFIG)
    .filter(([_, config]) => !config.isTestnet)
    .map(([id, config]) => ({ id: parseInt(id), ...config }));

  const testnetChains = Object.entries(CHAIN_CONFIG)
    .filter(([_, config]) => config.isTestnet)
    .map(([id, config]) => ({ id: parseInt(id), ...config }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold mb-4">Mainnet Networks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mainnetChains.map((chain) => (
            <div key={chain.id} className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{chain.chainName}</h4>
                <button
                  onClick={() => handleAddToMetaMask(chain.id)}
                  className="btn-secondary text-sm py-1 px-2 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add to MetaMask</span>
                </button>
              </div>
              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <p>Chain ID: {chain.chainId}</p>
                <p>Currency: {chain.nativeCurrency.symbol}</p>
                <p className="truncate">RPC: {chain.rpcUrls[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Testnet Networks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testnetChains.map((chain) => (
            <div key={chain.id} className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">{chain.chainName}</h4>
                <button
                  onClick={() => handleAddToMetaMask(chain.id)}
                  className="btn-secondary text-sm py-1 px-2 flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add to MetaMask</span>
                </button>
              </div>
              <div className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <p>Chain ID: {chain.chainId}</p>
                <p>Currency: {chain.nativeCurrency.symbol}</p>
                <p className="truncate">RPC: {chain.rpcUrls[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkSettings;