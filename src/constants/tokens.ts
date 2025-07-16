export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  chainId: number
  logoURI: string
}

export const TOKENS: Record<number, Token[]> = {
  // Ethereum
  1: [
    {
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png'
    },
    {
      address: '0xA0b86a33E6441b8C4CAad45bAeF941aBc7d3Ab32',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441b8c4caad45baef941abc7d3ab32.png'
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 1,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // BSC
  56: [
    {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png'
    },
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://tokens.1inch.io/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.png'
    },
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://tokens.1inch.io/0x55d398326f99059ff775485246999027b3197955.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Polygon
  137: [
    {
      address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      chainId: 137,
      logoURI: 'https://tokens.1inch.io/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png'
    },
    {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 137,
      logoURI: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 137,
      logoURI: 'https://tokens.1inch.io/0xc2132d05d31c914a87c6611c10748aeb04b58e8f.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 137,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Arbitrum
  42161: [
    {
      address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 42161,
      logoURI: 'https://tokens.1inch.io/0x82af49447d8a07e3bd95bd0d56f35241523fbab1.png'
    },
    {
      address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 42161,
      logoURI: 'https://tokens.1inch.io/0xff970a61a04b1ca14834a43f5de4533ebddb5cc8.png'
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 42161,
      logoURI: 'https://tokens.1inch.io/0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 42161,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Avalanche C-Chain
  43114: [
    {
      address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      decimals: 18,
      chainId: 43114,
      logoURI: 'https://tokens.1inch.io/0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7.png'
    },
    {
      address: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 43114,
      logoURI: 'https://tokens.1inch.io/0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e.png'
    },
    {
      address: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 43114,
      logoURI: 'https://tokens.1inch.io/0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 43114,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Fantom Opera
  250: [
    {
      address: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83',
      symbol: 'WFTM',
      name: 'Wrapped Fantom',
      decimals: 18,
      chainId: 250,
      logoURI: 'https://tokens.1inch.io/0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83.png'
    },
    {
      address: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 250,
      logoURI: 'https://tokens.1inch.io/0x04068da6c83afcfa0e13ba15a6696662335d5b75.png'
    },
    {
      address: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 250,
      logoURI: 'https://tokens.1inch.io/0x049d68029688eabf473097a2fc38ef61633a3c7a.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 250,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Ethereum Goerli Testnet
  5: [
    {
      address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      symbol: 'WETH',
      name: 'Wrapped Ether',
      decimals: 18,
      chainId: 5,
      logoURI: 'https://tokens.1inch.io/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png'
    },
    {
      address: '0x07865c6E87b9F70255377e024ace6630C1Eaa37F',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 5,
      logoURI: 'https://tokens.1inch.io/0xa0b86a33e6441b8c4caad45baef941abc7d3ab32.png'
    },
    {
      address: '0xC2C527C0CACF457746Bd31B2a698Fe89de2b6d49',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 5,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 5,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // BSC Testnet
  97: [
    {
      address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
      decimals: 18,
      chainId: 97,
      logoURI: 'https://tokens.1inch.io/0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c.png'
    },
    {
      address: '0x64544969ed7EBf5f083679233325356EbE738930',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 97,
      logoURI: 'https://tokens.1inch.io/0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d.png'
    },
    {
      address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 18,
      chainId: 97,
      logoURI: 'https://tokens.1inch.io/0x55d398326f99059ff775485246999027b3197955.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 97,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Mumbai Testnet
  80001: [
    {
      address: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
      symbol: 'WMATIC',
      name: 'Wrapped Matic',
      decimals: 18,
      chainId: 80001,
      logoURI: 'https://tokens.1inch.io/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png'
    },
    {
      address: '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 80001,
      logoURI: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
    },
    {
      address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 80001,
      logoURI: 'https://tokens.1inch.io/0xc2132d05d31c914a87c6611c10748aeb04b58e8f.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 80001,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Avalanche Fuji Testnet
  43113: [
    {
      address: '0xd00ae08403B9bbb9124bB305C09058E32C39A48c',
      symbol: 'WAVAX',
      name: 'Wrapped AVAX',
      decimals: 18,
      chainId: 43113,
      logoURI: 'https://tokens.1inch.io/0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7.png'
    },
    {
      address: '0x5425890298aed601595a70AB815c96711a31Bc65',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 43113,
      logoURI: 'https://tokens.1inch.io/0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e.png'
    },
    {
      address: '0xb9C31Ea1D475c25E58a1bE1a46221db55E5A7C6e',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 43113,
      logoURI: 'https://tokens.1inch.io/0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 43113,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // Fantom Testnet
  4002: [
    {
      address: '0xf1277d1Ed8AD466beddF92ef448A132661956621',
      symbol: 'WFTM',
      name: 'Wrapped Fantom',
      decimals: 18,
      chainId: 4002,
      logoURI: 'https://tokens.1inch.io/0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83.png'
    },
    {
      address: '0x2058A9D7613eEE744279e3856Ef0eAda5FCbaA7e',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 4002,
      logoURI: 'https://tokens.1inch.io/0x04068da6c83afcfa0e13ba15a6696662335d5b75.png'
    },
    {
      address: '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 4002,
      logoURI: 'https://tokens.1inch.io/0x049d68029688eabf473097a2fc38ef61633a3c7a.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 4002,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ],
  // ESR Testnet
  25062019: [
    {
      address: '0x0000000000000000000000000000000000000001', // Placeholder for WESR
      symbol: 'WESR',
      name: 'Wrapped ESR',
      decimals: 18,
      chainId: 25062019,
      logoURI: 'https://via.placeholder.com/32/22C55E/FFFFFF?text=ESR'
    },
    {
      address: '0x0000000000000000000000000000000000000002', // Placeholder for USDC
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 25062019,
      logoURI: 'https://tokens.1inch.io/0x2791bca1f2de4661ed88a30c99a7a9449aa84174.png'
    },
    {
      address: '0x0000000000000000000000000000000000000003', // Placeholder for USDT
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 25062019,
      logoURI: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png'
    },
    {
      address: '0x0000000000000000000000000000000000000004', // DXB Token address
      symbol: 'DXB',
      name: 'DexBridge Token',
      decimals: 18,
      chainId: 25062019,
      logoURI: 'https://via.placeholder.com/32/3B82F6/FFFFFF?text=DXB'
    }
  ]
}

export const getTokensByChain = (chainId: number): Token[] => {
  return TOKENS[chainId] || []
}