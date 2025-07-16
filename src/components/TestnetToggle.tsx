import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { isTestnet } from '../constants/chains';

interface TestnetToggleProps {
  showTestnets: boolean;
  setShowTestnets: (show: boolean) => void;
  className?: string;
}

const TestnetToggle: React.FC<TestnetToggleProps> = ({ 
  showTestnets, 
  setShowTestnets,
  className = '' 
}) => {
  const { chainId } = useWallet();
  const currentIsTestnet = chainId ? isTestnet(chainId) : false;
  
  return (
    <div className={`flex items-center ${className}`}>
      <label className="flex items-center text-sm cursor-pointer">
        <input 
          type="checkbox" 
          checked={showTestnets} 
          onChange={() => setShowTestnets(!showTestnets)}
          className="mr-2"
        />
        <span className="text-gray-700 dark:text-gray-300">
          {currentIsTestnet ? 'Testnet Mode' : 'Show Testnets'}
        </span>
      </label>
    </div>
  );
};

export default TestnetToggle;