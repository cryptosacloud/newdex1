export interface ContractAddresses {
  factory: string
  router: string
  bridge: string
  staking: string
  farming: string
  dxbToken: string
  weth: string
}

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Localhost/Hardhat for development
  1337: {
    factory: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    router: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    bridge: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    staking: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
    farming: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
    dxbToken: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    weth: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
  },
  // Ethereum Mainnet
  1: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'     // Official WETH
  },
  // BSC Mainnet
  56: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'     // WBNB
  },
  // Polygon Mainnet
  137: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'     // WMATIC
  },
  // Arbitrum One
  42161: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'     // WETH on Arbitrum
  },
  // Avalanche C-Chain
  43114: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'     // WAVAX
  },
  // Fantom Opera
  250: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'     // WFTM
  },
  // Ethereum Goerli Testnet
  5: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6'     // Goerli WETH
  },
  // BSC Testnet
  97: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd'     // BSC Testnet WBNB
  },
  // Polygon Mumbai
  80001: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'     // Mumbai WMATIC
  },
  // Avalanche Fuji
  43113: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c'     // Fuji WAVAX
  },
  // Fantom Testnet
  4002: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0xf1277d1Ed8AD466beddF92ef448A132661956621'     // Fantom Testnet WFTM
  },
  // ESR Testnet
  25062019: {
    factory: '0x0000000000000000000000000000000000000000', // Deploy Factory here
    router: '0x0000000000000000000000000000000000000000',  // Deploy Router here
    bridge: '0x0000000000000000000000000000000000000000',  // Deploy Bridge here
    staking: '0x0000000000000000000000000000000000000000', // Deploy Staking here
    farming: '0x0000000000000000000000000000000000000000', // Deploy Farming here
    dxbToken: '0x0000000000000000000000000000000000000000', // Deploy DXB Token here
    weth: '0x0000000000000000000000000000000000000000'     // ESR Native Token
  }
}

export const getContractAddresses = (chainId: number): ContractAddresses | null => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return null
  
  // Check if any of the required contracts are deployed
  const requiredContracts = ['factory', 'router', 'staking', 'bridge']
  const hasDeployedContracts = requiredContracts.some(contract => 
    addresses[contract as keyof ContractAddresses] !== '0x0000000000000000000000000000000000000000'
  )
  
  return hasDeployedContracts ? addresses : null
}

export const isContractDeployed = (chainId: number): boolean => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return false
  
  // Check if any required contract address is not the zero address
  const requiredContracts = ['factory', 'router', 'staking', 'bridge']
  return requiredContracts.some(contract => 
    addresses[contract as keyof ContractAddresses] !== '0x0000000000000000000000000000000000000000'
  )
}

// For development, we'll consider localhost contracts as deployed
export const isLocalhost = (chainId: number): boolean => {
  return chainId === 1337 || chainId === 31337
}

// Check if a specific contract is deployed
export const isContractAvailable = (chainId: number, contractName: keyof ContractAddresses): boolean => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return false
  
  return addresses[contractName] !== '0x0000000000000000000000000000000000000000'
}

// Get a specific contract address
export const getContractAddress = (chainId: number, contractName: keyof ContractAddresses): string | null => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return null
  
  const address = addresses[contractName]
  return address !== '0x0000000000000000000000000000000000000000' ? address : null
}

// For development, we'll use the localhost contracts
export const getDevContractAddresses = (): ContractAddresses => {
  return CONTRACT_ADDRESSES[1337] || {
    factory: '0x0000000000000000000000000000000000000000',
    router: '0x0000000000000000000000000000000000000000',
    bridge: '0x0000000000000000000000000000000000000000',
    staking: '0x0000000000000000000000000000000000000000',
    farming: '0x0000000000000000000000000000000000000000',
    dxbToken: '0x0000000000000000000000000000000000000000',
    weth: '0x0000000000000000000000000000000000000000'
  }
}

// Check if any contract is deployed on the current chain
export const hasAnyContractDeployed = (chainId: number): boolean => {
  const addresses = CONTRACT_ADDRESSES[chainId]
  if (!addresses) return false
  
  return Object.values(addresses).some(address => 
    address !== '0x0000000000000000000000000000000000000000'
  )
}

export const getDeploymentStatus = (): Record<number, { deployed: boolean; chainName: string }> => {
  const status: Record<number, { deployed: boolean; chainName: string }> = {};
  
  // Add status for each chain
  Object.entries(CONTRACT_ADDRESSES).forEach(([id, addresses]) => {
    const chainId = parseInt(id);
    let chainName = 'Unknown';
    
    // Map chain IDs to names
    switch (chainId) {
      case 1: chainName = 'Ethereum Mainnet'; break;
      case 5: chainName = 'Goerli Testnet'; break;
      case 56: chainName = 'BSC Mainnet'; break;
      case 97: chainName = 'BSC Testnet'; break;
      case 137: chainName = 'Polygon Mainnet'; break;
      case 80001: chainName = 'Mumbai Testnet'; break;
      case 42161: chainName = 'Arbitrum One'; break;
      case 43114: chainName = 'Avalanche C-Chain'; break;
      case 43113: chainName = 'Avalanche Fuji'; break;
      case 250: chainName = 'Fantom Opera'; break;
      case 4002: chainName = 'Fantom Testnet'; break;
      case 25062019: chainName = 'ESR Testnet'; break;
      case 1337: chainName = 'Local Development'; break;
    }
    
    // Check if deployed
    const deployed = Object.values(addresses).some(address => 
      address !== '0x0000000000000000000000000000000000000000'
    );
    
    status[chainId] = { deployed, chainName };
  });
  
  return status;
}
