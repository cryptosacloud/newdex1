import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useChainManagement } from '../hooks/useChainManagement';
import { CHAIN_CONFIG, isTestnetChain, getChainName } from '../constants/chainConfig';
import { AlertTriangle, Check, X } from 'lucide-react';

const NetworkSwitcher = ({ testnetMode = false, preferredChainId = null }) => {
  const { isConnected, chainId } = useWallet();
  const { switchNetwork, ensureSupportedChain, isProcessing, error } = useChainManagement();
  const [showModal, setShowModal] = useState(false);
  const [modalChainId, setModalChainId] = useState(null);

  // Check if current chain matches the testnet mode
  const isCorrectNetworkType = chainId ? isTestnetChain(chainId) === testnetMode : false;

  // Get available chains based on testnet mode
  const availableChains = Object.entries(CHAIN_CONFIG)
    .filter(([_, config]) => config.isTestnet === testnetMode)
    .map(([id, _]) => parseInt(id));

  useEffect(() => {
    // When wallet connects, check if we need to switch networks
    if (isConnected && !isCorrectNetworkType) {
      ensureSupportedChain(testnetMode, preferredChainId);
    }
  }, [isConnected, isCorrectNetworkType, testnetMode, preferredChainId, ensureSupportedChain]);

  const handleSwitchNetwork = async (targetChainId) => {
    const success = await switchNetwork(targetChainId);
    if (!success) {
      setModalChainId(targetChainId);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalChainId(null);
  };

  // If not connected or already on correct network type, don't show anything
  if (!isConnected || isCorrectNetworkType) {
    return null;
  }

  return (
    <>
      <div className="card p-4 mb-6 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-orange-800 dark:text-orange-200">
              Network Type Mismatch
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              You are currently on {chainId ? getChainName(chainId) : 'an unsupported network'}.
              This page is in {testnetMode ? 'Testnet' : 'Mainnet'} mode.
            </p>
          </div>
          <button
            onClick={() => ensureSupportedChain(testnetMode, preferredChainId)}
            disabled={isProcessing}
            className="btn-primary text-sm py-1 px-3"
          >
            {isProcessing ? 'Switching...' : `Switch to ${testnetMode ? 'Testnet' : 'Mainnet'}`}
          </button>
        </div>
      </div>

      {/* Manual Network Switch Modal */}
      {showModal && modalChainId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Network Switch Required</h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="mb-4">
                Please add or switch to {CHAIN_CONFIG[modalChainId]?.chainName || 'the requested network'} in your wallet:
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                <h4 className="font-medium mb-2">Network Details:</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>Network Name:</strong> {CHAIN_CONFIG[modalChainId]?.chainName}</li>
                  <li><strong>Chain ID:</strong> {CHAIN_CONFIG[modalChainId]?.chainId}</li>
                  <li><strong>Currency Symbol:</strong> {CHAIN_CONFIG[modalChainId]?.nativeCurrency.symbol}</li>
                  <li><strong>RPC URL:</strong> {CHAIN_CONFIG[modalChainId]?.rpcUrls[0]}</li>
                  <li><strong>Block Explorer:</strong> {CHAIN_CONFIG[modalChainId]?.blockExplorerUrls[0]}</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                After adding the network, please try switching again.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleSwitchNetwork(modalChainId)}
                className="btn-primary flex-1"
              >
                Try Again
              </button>
              <button
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NetworkSwitcher;