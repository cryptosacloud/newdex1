import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const TestnetModeToggle = ({ testnetMode, setTestnetMode }) => {
  const { isConnected, ensureCorrectChainType } = useWallet();

  const handleToggle = async () => {
    const newMode = !testnetMode;
    setTestnetMode(newMode);
    
    // If wallet is connected, try to switch to appropriate chain type
    if (isConnected) {
      await ensureCorrectChainType(newMode);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-sm font-medium ${!testnetMode ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        Mainnet
      </span>
      <button
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          testnetMode ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            testnetMode ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${testnetMode ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>
        Testnet
      </span>
    </div>
  );
};

export default TestnetModeToggle;