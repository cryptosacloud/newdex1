import dotenv from 'dotenv';
dotenv.config();

export const SUPPORTED_CHAINS = {
  // Mainnets
  1: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    bridgeAddress: process.env.ETHEREUM_BRIDGE_ADDRESS,
    minConfirmations: 12,
    gasLimit: 500000,
    maxGasPrice: '100', // gwei
    blockTime: 12000 // ms
  },
  56: {
    name: 'BSC',
    rpcUrl: process.env.BSC_RPC_URL,
    bridgeAddress: process.env.BSC_BRIDGE_ADDRESS,
    minConfirmations: 15,
    gasLimit: 300000,
    maxGasPrice: '20',
    blockTime: 3000
  },
  137: {
    name: 'Polygon',
    rpcUrl: process.env.POLYGON_RPC_URL,
    bridgeAddress: process.env.POLYGON_BRIDGE_ADDRESS,
    minConfirmations: 20,
    gasLimit: 300000,
    maxGasPrice: '50',
    blockTime: 2000
  },
  42161: {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    bridgeAddress: process.env.ARBITRUM_BRIDGE_ADDRESS,
    minConfirmations: 1,
    gasLimit: 1000000,
    maxGasPrice: '10',
    blockTime: 1000
  },
  43114: {
    name: 'Avalanche',
    rpcUrl: process.env.AVALANCHE_RPC_URL,
    bridgeAddress: process.env.AVALANCHE_BRIDGE_ADDRESS,
    minConfirmations: 5,
    gasLimit: 300000,
    maxGasPrice: '30', // AVAX gas prices
    blockTime: 2000
  },
  250: {
    name: 'Fantom',
    rpcUrl: process.env.FANTOM_RPC_URL,
    bridgeAddress: process.env.FANTOM_BRIDGE_ADDRESS,
    minConfirmations: 10,
    gasLimit: 300000,
    maxGasPrice: '200', // FTM gas prices (higher number but very cheap)
    blockTime: 1000
  },
  // ESR Network (Example custom chain)
  2612: {
    name: 'ESR',
    rpcUrl: process.env.ESR_RPC_URL,
    bridgeAddress: process.env.ESR_BRIDGE_ADDRESS,
    minConfirmations: 5,
    gasLimit: 200000,
    maxGasPrice: '1',
    blockTime: 5000
  },
  // ESR Testnet
  25062019: {
    name: 'ESR Testnet',
    rpcUrl: process.env.ESR_RPC_URL,
    bridgeAddress: process.env.ESR_BRIDGE_ADDRESS,
    minConfirmations: 3,
    gasLimit: 200000,
    maxGasPrice: '1',
    blockTime: 3000
  }
  // Testnets
  5: {
    name: 'Goerli',
    rpcUrl: process.env.GOERLI_RPC_URL,
    bridgeAddress: process.env.GOERLI_BRIDGE_ADDRESS,
    minConfirmations: 5,
    gasLimit: 500000,
    maxGasPrice: '50', // gwei
    blockTime: 15000 // ms
  },
  97: {
    name: 'BSC Testnet',
    rpcUrl: process.env.BSC_TESTNET_RPC_URL,
    bridgeAddress: process.env.BSC_TESTNET_BRIDGE_ADDRESS,
    minConfirmations: 10,
    gasLimit: 300000,
    maxGasPrice: '10',
    blockTime: 3000
  },
  80001: {
    name: 'Mumbai',
    rpcUrl: process.env.MUMBAI_RPC_URL,
    bridgeAddress: process.env.MUMBAI_BRIDGE_ADDRESS,
    minConfirmations: 10,
    gasLimit: 300000,
    maxGasPrice: '30',
    blockTime: 2000
  },
  43113: {
    name: 'Fuji',
    rpcUrl: process.env.FUJI_RPC_URL,
    bridgeAddress: process.env.FUJI_BRIDGE_ADDRESS,
    minConfirmations: 3,
    gasLimit: 300000,
    maxGasPrice: '25',
    blockTime: 2000
  },
  4002: {
    name: 'Fantom Testnet',
    rpcUrl: process.env.FANTOM_TESTNET_RPC_URL,
    bridgeAddress: process.env.FANTOM_TESTNET_BRIDGE_ADDRESS,
    minConfirmations: 5,
    gasLimit: 300000,
    maxGasPrice: '100', // FTM gas prices (higher number but very cheap)
    blockTime: 1000
  }
};

export const BRIDGE_ABI = [
  'event TokenLocked(bytes32 indexed txId, address indexed user, address indexed token, uint256 amount, uint256 targetChain, address targetAddress)',
  'event TokenBurned(bytes32 indexed txId, address indexed user, address indexed token, uint256 amount)',
  'event TokenReleased(bytes32 indexed txId, address indexed user, address indexed token, uint256 amount)',
  'event TokenMinted(bytes32 indexed txId, address indexed user, address indexed token, uint256 amount)',
  'event BridgeCompleted(bytes32 indexed txId)',
  'function releaseTokens(bytes32 txId) external',
  'function getTransaction(bytes32 txId) external view returns (tuple(bytes32 txId, address user, address token, uint256 amount, uint256 fee, uint256 sourceChain, uint256 targetChain, address targetAddress, uint256 timestamp, uint8 status))',
  'function relayers(address) external view returns (bool)'
];

export const getChainConfig = (chainId) => {
  const config = SUPPORTED_CHAINS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
};

export const getAllChainIds = () => {
  return Object.keys(SUPPORTED_CHAINS).map(id => parseInt(id));
};