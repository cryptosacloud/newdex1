// Chain configuration for MetaMask integration
// Contains all the necessary information for adding networks to MetaMask

export const CHAIN_CONFIG = {
  // Mainnets
  1: {
    chainId: '0x1',
    chainName: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ankr.com/eth'],
    blockExplorerUrls: ['https://etherscan.io'],
    isTestnet: false
  },
  56: {
    chainId: '0x38',
    chainName: 'BNB Smart Chain',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    rpcUrls: ['https://bsc-dataseed1.binance.org'],
    blockExplorerUrls: ['https://bscscan.com'],
    isTestnet: false
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://polygon-rpc.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
    isTestnet: false
  },
  42161: {
    chainId: '0xA4B1',
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io'],
    isTestnet: false
  },
  43114: {
    chainId: '0xA86A',
    chainName: 'Avalanche C-Chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://snowtrace.io'],
    isTestnet: false
  },
  250: {
    chainId: '0xFA',
    chainName: 'Fantom Opera',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ftm.tools'],
    blockExplorerUrls: ['https://ftmscan.com'],
    isTestnet: false
  },
  // ESR Mainnet - placeholder values, update with actual values
  2612: {
    chainId: '0xA34',
    chainName: 'ESR Mainnet',
    nativeCurrency: {
      name: 'ESR',
      symbol: 'ESR',
      decimals: 18
    },
    rpcUrls: ['https://rpc.esrscan.com'],
    blockExplorerUrls: ['https://esrscan.com'],
    isTestnet: false
  },

  // Testnets
  5: {
    chainId: '0x5',
    chainName: 'Goerli Testnet',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.ankr.com/eth_goerli'],
    blockExplorerUrls: ['https://goerli.etherscan.io'],
    isTestnet: true
  },
  97: {
    chainId: '0x61',
    chainName: 'BSC Testnet',
    nativeCurrency: {
      name: 'Binance Chain Native Token',
      symbol: 'tBNB',
      decimals: 18
    },
    rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
    blockExplorerUrls: ['https://testnet.bscscan.com'],
    isTestnet: true
  },
  80001: {
    chainId: '0x13881',
    chainName: 'Mumbai Testnet',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
    blockExplorerUrls: ['https://mumbai.polygonscan.com'],
    isTestnet: true
  },
  43113: {
    chainId: '0xA869',
    chainName: 'Avalanche Fuji Testnet',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    },
    rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
    isTestnet: true
  },
  4002: {
    chainId: '0xFA2',
    chainName: 'Fantom Testnet',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18
    },
    rpcUrls: ['https://rpc.testnet.fantom.network'],
    blockExplorerUrls: ['https://testnet.ftmscan.com'],
    isTestnet: true
  },
  25062019: {
    chainId: '0x17E5F13',
    chainName: 'ESR Testnet',
    nativeCurrency: {
      name: 'ESR',
      symbol: 'ESR',
      decimals: 18
    },
    rpcUrls: ['https://testnet.rpc.esrscan.com'],
    blockExplorerUrls: ['https://testnet.esrscan.com'],
    isTestnet: true
  }
};

// Helper functions
export const getChainConfigById = (chainId) => {
  return CHAIN_CONFIG[chainId];
};

export const getMainnetChains = () => {
  return Object.values(CHAIN_CONFIG).filter(chain => !chain.isTestnet);
};

export const getTestnetChains = () => {
  return Object.values(CHAIN_CONFIG).filter(chain => chain.isTestnet);
};

export const isChainSupported = (chainId) => {
  return !!CHAIN_CONFIG[chainId];
};

export const isTestnetChain = (chainId) => {
  const config = CHAIN_CONFIG[chainId];
  return config ? config.isTestnet : false;
};

export const getChainName = (chainId) => {
  const config = CHAIN_CONFIG[chainId];
  return config ? config.chainName : 'Unknown Network';
};