import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { getChainName, isTestnetChain } from '../constants/chainConfig';

const NetworkStatus = () => {
  const { isConnected, chainId } = useWallet();
  
  if (!isConnected || !chainId) {
    return null;
  }
  
  const networkName = getChainName(chainId);
  const isTestnet = isTestnetChain(chainId);
  
  return (
    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
      isTestnet 
        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' 
        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    }`}>
      {networkName}
      {isTestnet && <span className="ml-1">(Testnet)</span>}
    </div>
  );
};

export default NetworkStatus;