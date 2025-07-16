export interface Chain {
  id: number
  name: string
  isTestnet?: boolean
  symbol: string
  rpcUrl: string
  blockExplorer: string
  icon: string
}

export const MAINNET_CHAINS: Chain[] = [
  {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    blockExplorer: 'https://etherscan.io',
    icon: '⟠'
  },
  {
    id: 56,
    name: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: '🟡'
  },
  {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    icon: '🟣'
  },
  {
    id: 42161,
    name: 'Arbitrum',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    icon: '🔵'
  },
  {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: '🔺'
  },
  {
    id: 250,
    name: 'Fantom',
    symbol: 'FTM',
    rpcUrl: 'https://rpc.ftm.tools',
    blockExplorer: 'https://ftmscan.com',
    icon: '👻'
  },
  {
    id: 25062019,
    name: 'ESR Testnet',
    symbol: 'ESR',
    rpcUrl: 'https://testnet.rpc.esrscan.com',
    blockExplorer: 'https://testnet.esrscan.com',
    icon: '🟢'
  }
]

export const TESTNET_CHAINS: Chain[] = [
  {
    id: 5,
    name: 'Goerli',
    isTestnet: true,
    symbol: 'ETH',
    rpcUrl: 'https://rpc.ankr.com/eth_goerli',
    blockExplorer: 'https://goerli.etherscan.io',
    icon: '⟠'
  },
  {
    id: 97,
    name: 'BSC Testnet',
    isTestnet: true,
    symbol: 'tBNB',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    blockExplorer: 'https://testnet.bscscan.com',
    icon: '🟡'
  },
  {
    id: 80001,
    name: 'Mumbai',
    isTestnet: true,
    symbol: 'MATIC',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    icon: '🟣'
  },
  {
    id: 43113,
    name: 'Fuji',
    isTestnet: true,
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    icon: '🔺'
  },
  {
    id: 4002,
    name: 'Fantom Testnet',
    isTestnet: true,
    symbol: 'FTM',
    rpcUrl: 'https://rpc.testnet.fantom.network',
    blockExplorer: 'https://testnet.ftmscan.com',
    icon: '👻'
  }
]

// Combine mainnet and testnet chains
export const SUPPORTED_CHAINS: Chain[] = [...MAINNET_CHAINS, ...TESTNET_CHAINS];

export const getChainById = (chainId: number): Chain | undefined => {
  return SUPPORTED_CHAINS.find(chain => chain.id === chainId)
}

export const isTestnet = (chainId: number): boolean => {
  const chain = getChainById(chainId);
  return chain?.isTestnet || false;
}