import { useState, useCallback } from 'react';
import { CHAIN_CONFIG } from '../constants/chainConfig';

/**
 * Hook for managing chain switching and adding in MetaMask
 */
export const useChainManagement = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Adds a network to MetaMask
   * @param {number} chainId - The chain ID to add
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const addNetwork = useCallback(async (chainId) => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    const chainConfig = CHAIN_CONFIG[chainId];
    if (!chainConfig) {
      setError(`Chain configuration not found for chain ID: ${chainId}`);
      return false;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainConfig.chainId,
            chainName: chainConfig.chainName,
            nativeCurrency: chainConfig.nativeCurrency,
            rpcUrls: chainConfig.rpcUrls,
            blockExplorerUrls: chainConfig.blockExplorerUrls
          }
        ]
      });
      return true;
    } catch (err) {
      console.error('Error adding network to MetaMask:', err);
      setError(err.message || 'Failed to add network to MetaMask');
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Switches to a network in MetaMask
   * @param {number} chainId - The chain ID to switch to
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const switchNetwork = useCallback(async (chainId) => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    const chainConfig = CHAIN_CONFIG[chainId];
    if (!chainConfig) {
      setError(`Chain configuration not found for chain ID: ${chainId}`);
      return false;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainConfig.chainId }]
      });
      return true;
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        try {
          const success = await addNetwork(chainId);
          if (success) {
            // Try switching again after adding
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: chainConfig.chainId }]
            });
            return true;
          }
          return false;
        } catch (addError) {
          console.error('Error adding then switching network:', addError);
          setError(addError.message || 'Failed to add then switch network');
          return false;
        }
      } else {
        console.error('Error switching network in MetaMask:', err);
        setError(err.message || 'Failed to switch network in MetaMask');
        return false;
      }
    } finally {
      setIsProcessing(false);
    }
  }, [addNetwork]);

  /**
   * Ensures the user is connected to a supported chain
   * @param {boolean} testnetMode - Whether to check for testnet or mainnet chains
   * @param {number} preferredChainId - The preferred chain ID to switch to
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  const ensureSupportedChain = useCallback(async (testnetMode, preferredChainId) => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      // Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainIdHex, 16);
      
      // Check if current chain is supported and matches the mode (testnet/mainnet)
      const chainConfig = CHAIN_CONFIG[currentChainId];
      if (chainConfig && chainConfig.isTestnet === testnetMode) {
        return true; // Already on a supported chain for the current mode
      }

      // If preferred chain is provided and it's valid for the current mode, switch to it
      if (preferredChainId) {
        const preferredConfig = CHAIN_CONFIG[preferredChainId];
        if (preferredConfig && preferredConfig.isTestnet === testnetMode) {
          return await switchNetwork(preferredChainId);
        }
      }

      // Otherwise, switch to the first available chain for the current mode
      const availableChains = Object.keys(CHAIN_CONFIG)
        .filter(id => CHAIN_CONFIG[id].isTestnet === testnetMode)
        .map(id => parseInt(id));

      if (availableChains.length > 0) {
        return await switchNetwork(availableChains[0]);
      }

      setError(`No supported ${testnetMode ? 'testnet' : 'mainnet'} chains found`);
      return false;
    } catch (err) {
      console.error('Error ensuring supported chain:', err);
      setError(err.message || 'Failed to ensure supported chain');
      return false;
    }
  }, [switchNetwork]);

  return {
    addNetwork,
    switchNetwork,
    ensureSupportedChain,
    isProcessing,
    error
  };
};