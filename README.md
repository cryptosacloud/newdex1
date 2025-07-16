# DexBridge - Advanced Decentralized Exchange with Cross-Chain Bridge

A comprehensive, **fully mobile-optimized** decentralized exchange (DEX) ecosystem built with React, TypeScript, and custom smart contracts. DexBridge provides seamless token swapping, liquidity provision, cross-chain bridging, ESR staking, LP farming, and comprehensive analytics with **NO external dependencies** on protocols like Uniswap, LayerZero, or Axelar.

## 🌟 Core Features

### Advanced DEX Functionality
- **Custom DEX Contracts**: Proprietary Factory.sol, Router.sol, and Pair.sol (Uniswap V2-style)
- **Token Swapping**: Swap tokens using our proprietary routing system with $3 USDT fees
- **Liquidity Pools**: Create and manage liquidity pools within our ecosystem
- **Multi-Chain Deployment**: Deploy on Ethereum, BSC, Polygon, Arbitrum, and ESR Testnet
- **Real-time Pricing**: AMM-based pricing with configurable slippage protection
- **LP Token Management**: Mint and burn LP tokens for liquidity providers

### Cross-Chain Bridge
- **Custom Bridge Contracts**: Lock/Mint and Burn/Release mechanisms
- **Native Bridge Logic**: No LayerZero, no Axelar - 100% owned infrastructure
- **Admin-Controlled**: Relayer system for cross-chain transaction processing
- **Token Locking**: Lock tokens on source chain, mint on destination
- **Burn & Release**: Burn wrapped tokens, release native tokens
- **Bridge Dashboard**: Real-time transaction tracking and history
- **$3 USDT Bridge Fees**: All bridge transactions require $3 USDT fee

### ESR Staking System
- **ESR Token Staking**: Stake minimum 100 ESR tokens with 7-day lock period
- **USDT Rewards**: Earn USDT rewards from $3 fees collected on swaps and bridges
- **Proportional Distribution**: Rewards distributed based on stake weight
- **Real-time APR**: Dynamic APR calculation based on fee collection
- **Flexible Claims**: Claim rewards anytime after distribution
- **Staking Dashboard**: Comprehensive staking statistics and user info

### LP Farming Platform
- **Multiple Farming Pools**: Support for various LP token pairs
- **ESR Emissions**: Earn ESR tokens for providing liquidity
- **Configurable Rewards**: Admin-controlled emission rates and pool weights
- **Auto-Compounding**: Harvest rewards and reinvest automatically
- **Pool Management**: Add, pause, and configure farming pools
- **Farming Analytics**: Track TVL, APR, and farming statistics

### Fee Collection & Distribution System
- **$3 USDT Fees**: All swaps and bridge transactions require $3 USDT
- **Automatic Collection**: Fees automatically collected and distributed to ESR stakers
- **Fee Verification**: Smart contract checks for sufficient USDT balance and allowance
- **Reward Pool**: Accumulated fees distributed proportionally to stakers
- **Real-time Tracking**: Monitor fee collection and distribution in real-time

### Advanced Features
- **Admin Panel**: Comprehensive management for tokens, relayers, and bridge settings
- **Reward Management**: Admin controls for staking and farming parameters
- **Analytics Dashboard**: Track TVL, volume, trading metrics, and fee collection
- **Professional UI**: Dark/light mode with responsive design and micro-interactions
- **Wallet Integration**: MetaMask and Web3 wallet support with chain switching
- **ESR Testnet Support**: Full integration with ESR blockchain testnet
- **Mobile Responsive**: Fully optimized for mobile devices with touch-friendly controls

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** 
- **Hardhat** for smart contract deployment
- **MetaMask** or compatible Web3 wallet
- **Git**

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** 
- **Hardhat** for smart contract deployment
- **MetaMask** or compatible Web3 wallet
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dex-bridge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Deploy smart contracts** (for local development)
   ```bash
   # Start local Hardhat node
   npx hardhat node
   
   # Deploy contracts (in another terminal)
   npx hardhat run deployment/deploy.js --network localhost
   ```

4. **Update contract addresses**
   - Copy deployed contract addresses from deployment output
   - Update `src/constants/contracts.ts` with the new addresses

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**  
   Navigate to `http://localhost:5173`

### Alternative: Deploying with Remix IDE

If you encounter issues with Hardhat deployment, you can use Remix IDE as a fallback:

1. **Open Remix IDE**
   - Go to [https://remix.ethereum.org](https://remix.ethereum.org)
   - Create a new workspace named "DexBridge"

2. **Upload Contracts**
   - Create folders in Remix matching the project structure (`DEX`, `Bridge`, `Tokens`, etc.)
   - Copy each contract from the `remix-contracts` directory into Remix IDE

3. **Compile Contracts**
   - Set compiler version to `0.8.19`
   - Enable optimization (200 runs)
   - Compile all contracts

4. **Deploy in Order**
   - Connect MetaMask to your desired network
   - Deploy contracts in this specific order:

     a) **Deploy Tokens**
     ```
     1. WETH.sol - No constructor parameters
        - On Avalanche: Deploy as WAVAX
        - On Fantom: Deploy as WFTM
     2. DexBridgeToken.sol - No constructor parameters (for both DXB and USDT)
     ```

     b) **Deploy DEX**
     ```
     1. Factory.sol - No constructor parameters
     2. Router.sol - Parameters:
        - _factory: Factory contract address
        - _WETH: WETH contract address
        - _usdtToken: USDT contract address
     ```

     c) **Deploy Staking**
     ```
     1. ESRStaking.sol - Parameters:
        - _esrToken: DXB token address (using as ESR)
        - _usdtToken: USDT token address
        - _feeCollector: Router contract address
        - _rewardPool: Your wallet address
     ```

     d) **Deploy Bridge**
     ```
     1. BridgeCore.sol - Parameters:
        - _chainId: Current chain ID (1 for Ethereum, 56 for BSC, etc.)
        - _feeCollector: Your wallet address
        - _usdtToken: USDT token address
     ```

     e) **Deploy Farming**
     ```
     1. LPFarming.sol - Parameters:
        - _esrToken: DXB token address
        - _rewardPool: Your wallet address
        - _esrPerSecond: Emission rate (e.g., "100000000000000000" for 0.1 ESR/second)
        - _startTime: Current timestamp
     ```

5. **Configure Contracts**
   - Router: `router.setStakingContract(stakingContractAddress)`
   - Bridge: 
     ```
     bridge.setStakingContract(stakingContractAddress)
     bridge.addSupportedToken(
         wethAddress,
         currentChainId,
         true,  // isNative
         "1000000000000000",    // 0.001 ETH min
         "100000000000000000000", // 100 ETH max
         250    // 2.5% fee
     )
     ```
   - Staking: `staking.setFeeCollector(routerAddress)`

6. **Update Frontend Configuration**
   - Copy all deployed contract addresses
   - Update `src/constants/contracts.ts` with the new addresses
   - Restart the frontend application

### Environment Setup (Optional)

Create a `.env` file in the root directory for custom configuration:

```env
# Smart Contract Deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs for deployment
VITE_ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
VITE_BSC_RPC_URL=https://bsc-dataseed.binance.org
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
VITE_ESR_RPC_URL=https://testnet.rpc.esrscan.com
```

## 🏗️ Smart Contract Architecture

### DEX Contracts

#### Factory.sol
- Creates new trading pairs
- Manages pair registry
- Emits PairCreated events

#### Router.sol  
- Handles all user interactions with $3 USDT fee collection
- Manages liquidity operations
- Executes token swaps with fee verification
- Calculates optimal routing paths
- Integrates with staking contract for fee distribution

#### Pair.sol
- Individual trading pair contract
- Implements AMM (x * y = k) formula
- Manages LP token minting/burning
- Handles swap execution

### Bridge Contracts

#### BridgeCore.sol
- Main bridge contract for each chain with fee collection
- Handles token locking and releasing
- Manages supported tokens and fees
- Controls relayer permissions
- Collects $3 USDT fees for each bridge transaction

#### DexBridgeWrappedToken.sol
- Wrapped token contract for non-native assets
- Mintable/burnable by bridge contract
- Standard ERC-20 implementation

### Staking & Farming Contracts

#### ESRStaking.sol
- ESR token staking with 7-day lock period
- USDT reward distribution from collected fees
- Proportional reward calculation based on stake weight
- Real-time APR tracking and reward claims
- Minimum 100 ESR stake requirement

#### LPFarming.sol
- Multi-pool LP token farming system
- ESR token emissions with configurable rates
- Pool weight management and allocation points
- Harvest functionality for accumulated rewards
- Admin controls for pool management

#### FeeManager.sol
- Centralized fee collection system
- $3 USDT fee verification and collection
- Integration with staking contract for reward distribution
- Fee requirement validation for all operations

### Token Contracts

#### DexBridgeToken.sol (DXB/ESR)
- Native governance and utility token
- Used for staking and farming rewards
- Deflationary tokenomics

#### WETH.sol
- Wrapped ETH implementation
- Standard deposit/withdraw functions

### DEX Contracts

#### Factory.sol
- Creates new trading pairs
- Manages pair registry
- Emits PairCreated events

#### Router.sol  
- Handles all user interactions with $3 USDT fee collection
- Manages liquidity operations
- Executes token swaps with fee verification
- Calculates optimal routing paths
- Integrates with staking contract for fee distribution

#### Pair.sol
- Individual trading pair contract
- Implements AMM (x * y = k) formula
- Manages LP token minting/burning
- Handles swap execution

### Bridge Contracts

#### BridgeCore.sol
- Main bridge contract for each chain with fee collection
- Handles token locking and releasing
- Manages supported tokens and fees
- Controls relayer permissions
- Collects $3 USDT fees for each bridge transaction

#### DexBridgeWrappedToken.sol
- Wrapped token contract for non-native assets
- Mintable/burnable by bridge contract
- Standard ERC-20 implementation

### Staking & Farming Contracts

#### ESRStaking.sol
- ESR token staking with 7-day lock period
- USDT reward distribution from collected fees
- Proportional reward calculation based on stake weight
- Real-time APR tracking and reward claims
- Minimum 100 ESR stake requirement

#### LPFarming.sol
- Multi-pool LP token farming system
- ESR token emissions with configurable rates
- Pool weight management and allocation points
- Harvest functionality for accumulated rewards
- Admin controls for pool management

#### FeeManager.sol
- Centralized fee collection system
- $3 USDT fee verification and collection
- Integration with staking contract for reward distribution
- Fee requirement validation for all operations

### Token Contracts

#### DexBridgeToken.sol (DXB/ESR)
- Native governance and utility token
- Used for staking and farming rewards
- Deflationary tokenomics

#### WETH.sol
- Wrapped ETH implementation
- Standard deposit/withdraw functions

## 📱 Mobile Responsiveness

DexBridge is fully optimized for mobile devices with:


- **Responsive Layout**: Adapts to any screen size from phones to desktops
- **Touch-Friendly Controls**: Large buttons and inputs for easy interaction on touchscreens
- **Mobile Navigation**: Fully functional collapsible menu for seamless navigation on small screens
- **Wallet Integration**: Seamless connection with mobile wallet apps
- **Optimized Forms**: Form inputs and modals designed for mobile use
- **Readable Typography**: Text sizing that works across all devices
- **Efficient Loading**: Fast loading times even on mobile networks
- **Compact Views**: Data tables and lists that work well on narrow screens
- **Adaptive Liquidity Pools**: Pool cards that resize appropriately for mobile screens
- **Mobile-First Design**: Built with mobile users as a primary consideration
- **Consistent Experience**: Same functionality available on both desktop and mobile

## 📱 Usage Guide

### Getting Started

1. **Choose Network Type**
   - Toggle between Mainnet and Testnet networks using the "Show Testnets" option
   - Testnet networks are clearly marked with a "Testnet" badge

2. **Connect Your Wallet**
   - Tap "Connect Wallet" in the top right
   - Select your preferred wallet (works with both mobile and desktop wallets)
   - Approve the connection

3. **Select Network**
   - Use the chain selector to switch between networks
   - Ensure contracts are deployed on selected network
   - Testnet networks are clearly labeled with a "Testnet" badge

4. **Prepare USDT for Fees**
   - Ensure you have at least $3 USDT for transaction fees
   - Approve USDT spending for the router/bridge contracts
   - For testnets, use the appropriate testnet USDT address

### Token Swapping

1. **Navigate to Swap** (default page)
2. **Select Tokens**
   - Choose "From" token and amount
   - Select "To" token
   - System calculates output using our AMM
3. **Configure Settings**
   - Adjust slippage tolerance (0.1% - 50%)
   - Review $3 USDT fee requirement
4. **Execute Swap**
   - Ensure sufficient USDT balance and approval
   - Approve token spending if needed
   - Click "Swap" button
   - Confirm transaction in wallet

### Adding Liquidity

1. **Go to Pools tab**
2. **Tap "Add Liquidity"**
3. **Select Token Pair**
   - Choose two tokens for the pool
   - Enter amounts (system calculates ratios)
4. **Add Liquidity**
   - Approve both tokens if needed
   - Confirm transaction
   - Receive LP tokens

### Cross-Chain Bridging

1. **Navigate to Bridge Tab**
2. **Select Network Type**
   - Toggle "Show Testnets Only" to filter for testnet networks
   - Mainnet and testnet bridges are separate (cannot bridge between mainnet and testnet)
3. **Configure Your Transfer**
   - Select source and destination chains
   - Choose token and amount
   - Enter destination address (optional)
4. **Review Fees**
   - Bridge fee in tokens
   - $3 USDT transaction fee
5. **Execute Bridge**
   - Ensure sufficient USDT balance and approval
   - Confirm transaction
   - Wait for relayer to process on destination chain

### ESR Staking

1. **Navigate to Stake tab**
2. **Stake Your ESR Tokens**
   - Enter amount (minimum 100 ESR)
   - Approve ESR spending
   - Confirm staking transaction
   - Tokens locked for 7 days
3. **Earn Rewards**
   - Rewards distributed from collected fees
   - Proportional to your stake weight
   - Claim anytime after distribution
4. **Unstake Tokens**
   - Available after 7-day lock period
   - Partial or full unstaking supported

### LP Farming

1. **Navigate to Farm tab**
2. **Select a Farming Pool**
   - Choose LP token pair
   - Review APR and pool details
3. **Stake LP Tokens**
   - Enter LP token amount
   - Approve LP token spending
   - Confirm staking transaction
4. **Harvest Rewards**
   - Claim ESR rewards anytime
   - Use "Harvest All" for multiple pools
   - Compound rewards by restaking

### Admin Functions (Contract Owner Only)

#### Bridge Management (`/admin`)
1. **Access Admin Panel**
2. **Manage Supported Tokens**
   - Add new tokens to bridge
   - Set minimum/maximum amounts
   - Configure bridge fees
3. **Manage Relayers**
   - Add/remove authorized relayers
   - Control bridge operations
4. **Bridge Settings**
   - Update global fees
   - Pause/unpause bridge
   - Emergency controls

#### Reward Management (`/admin/rewards`)
1. **Emission Rate Control**
   - Adjust ESR emission rate for farming
   - Real-time rate updates
2. **LP Pool Management**
   - Add new farming pools
   - Adjust pool weights and allocation points
   - Pause/activate pools
3. **Staking Oversight**
   - Monitor staking statistics
   - Distribute accumulated fees to stakers
   - Emergency controls

## 🔧 Development & Deployment

### Local Development


1. **Start Hardhat Node**
   ```bash
   npx hardhat node
   ```

2. **Deploy Contracts**
   ```bash
   npx hardhat run deployment/deploy.js --network localhost
   ```

3. **Update Frontend Config**
   - Copy contract addresses to `src/constants/contracts.ts`
   - Update token addresses in `src/constants/tokens.ts`

4. **Start Frontend**
   ```bash
   npm run dev
   ```

### Mainnet Deployment

1. **Configure Networks**
   - Update `hardhat.config.js` with RPC URLs
   - Set `PRIVATE_KEY` in environment

2. **Deploy to Each Chain**
   ```bash
   # Ethereum
   npx hardhat run deployment/deploy.js --network ethereum
   
   # BSC
   npx hardhat run deployment/deploy.js --network bsc
   
   # Polygon  
   npx hardhat run deployment/deploy.js --network polygon
   
   # Arbitrum
   npx hardhat run deployment/deploy.js --network arbitrum
   
   # Avalanche
   npx hardhat run deployment/deploy.js --network avalanche
   
   # Fantom
   npx hardhat run deployment/deploy.js --network fantom
   
   # ESR Testnet
   npx hardhat run deployment/deploy.js --network esr
   ```

3. **Update Frontend**
   - Update contract addresses for each network
   - Deploy frontend to hosting service

### Relayer Service Deployment

1. **Navigate to Relayer Directory**
   ```bash
   cd relayer
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy Relayer**
   ```bash
   # Using Docker
   docker-compose up -d
   
   # Or directly with Node.js
   npm install
   npm start
   ```

## 🔐 Security Features

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Access Control**: Owner-only functions for critical operations
- **Pausable**: Emergency pause functionality
- **Input Validation**: Comprehensive parameter checking
- **Safe Math**: Overflow protection built-in
- **Fee Verification**: Ensures proper USDT fee collection

### Bridge Security
- **Multi-signature**: Recommended for production relayers
- **Rate Limiting**: Configurable min/max amounts
- **Fee Protection**: Prevents excessive fee extraction
- **Emergency Withdrawal**: Owner can recover stuck funds
- **Relayer Authorization**: Only authorized relayers can process transactions

### Staking Security
- **Lock Period Enforcement**: 7-day minimum lock period
- **Proportional Rewards**: Fair distribution based on stake weight
- **Reward Verification**: Prevents double claiming
- **Emergency Functions**: Admin controls for critical situations

### Frontend Security
- **Input Sanitization**: All user inputs validated
- **Transaction Simulation**: Preview before execution
- **Slippage Protection**: Configurable slippage tolerance
- **Approval Management**: Precise token approvals
- **Fee Verification**: Check USDT requirements before transactions

## 📊 Contract Addresses

After deployment, update these addresses in `src/constants/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: { // Ethereum
    factory: '0x...', // Your deployed Factory
    router: '0x...',  // Your deployed Router  
    bridge: '0x...',  // Your deployed Bridge
    staking: '0x...', // Your deployed ESR Staking
    farming: '0x...', // Your deployed LP Farming
    dxbToken: '0x...', // Your DXB Token
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  }
  // ... other networks
}
```

After deployment, update these addresses in `src/constants/contracts.ts`:

```typescript
export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  1: { // Ethereum
    factory: '0x...', // Your deployed Factory
    router: '0x...',  // Your deployed Router  
    bridge: '0x...',  // Your deployed Bridge
    staking: '0x...', // Your deployed ESR Staking
    farming: '0x...', // Your deployed LP Farming
    dxbToken: '0x...', // Your DXB Token
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
  }
  // ... other networks
}
```

## 🌐 Supported Networks

### Mainnets
- **Ethereum Mainnet** (Chain ID: 1) ⟠
- **BSC Mainnet** (Chain ID: 56) 🟡
- **Polygon Mainnet** (Chain ID: 137) 🟣
- **Arbitrum One** (Chain ID: 42161) 🔵
- **Avalanche C-Chain** (Chain ID: 43114) 🔺
- **Fantom Opera** (Chain ID: 250) 👻

### Testnets
- **Ethereum Goerli** (Chain ID: 5) ⟠
- **BSC Testnet** (Chain ID: 97) 🟡
- **Polygon Mumbai** (Chain ID: 80001) 🟣
- **Avalanche Fuji** (Chain ID: 43113) 🔺
- **Fantom Testnet** (Chain ID: 4002) 👻
- **ESR Testnet** (Chain ID: 25062019) 🟢

## 💰 Fee Structure

### Transaction Fees
- **Swap Fee**: $3 USDT per transaction
- **Bridge Fee**: $3 USDT per transaction + token-specific fees
- **LP Fees**: 0.3% of swap volume (standard AMM fee)

### Fee Distribution
- **ESR Stakers**: 100% of $3 USDT fees distributed proportionally
- **LP Providers**: 0.3% swap fees from trading volume
- **Farmers**: ESR token emissions for LP staking

## 🚀 Production Checklist

Before going live:

- [ ] **Smart Contract Audits**: Get contracts audited by professionals
- [ ] **Testnet Testing**: Deploy and test on testnets first  
- [ ] **Multi-sig Setup**: Use multi-signature wallets for admin functions
- [ ] **Relayer Security**: Secure relayer private keys and infrastructure
- [ ] **Fee Token Setup**: Ensure USDT contracts are properly configured
- [ ] **Monitoring**: Set up contract monitoring and alerts
- [ ] **Documentation**: Update all contract addresses and configurations
- [ ] **Emergency Procedures**: Establish incident response procedures
- [ ] **Insurance**: Consider smart contract insurance coverage

Before going live:

- [ ] **Smart Contract Audits**: Get contracts audited by professionals
- [ ] **Testnet Testing**: Deploy and test on testnets first  
- [ ] **Multi-sig Setup**: Use multi-signature wallets for admin functions
- [ ] **Relayer Security**: Secure relayer private keys and infrastructure
- [ ] **Fee Token Setup**: Ensure USDT contracts are properly configured
- [ ] **Monitoring**: Set up contract monitoring and alerts
- [ ] **Documentation**: Update all contract addresses and configurations
- [ ] **Emergency Procedures**: Establish incident response procedures
- [ ] **Insurance**: Consider smart contract insurance coverage

## 🤝 Support & Community

### Getting Help
- **Documentation**: This README and inline code comments
- **Issues**: Report bugs via GitHub issues
- **Discussions**: Technical discussions and feature requests

### Contributing
- Fork the repository
- Create feature branches
- Submit pull requests
- Follow coding standards

## ⚠️ Important Disclaimers

### Security Notice
⚠️ **CRITICAL**: This is a complex DeFi system handling real value. Before mainnet deployment:
- **GET PROFESSIONAL AUDITS** for all smart contracts
- **TEST EXTENSIVELY** on testnets with real scenarios
- **USE MULTI-SIGNATURE** wallets for all admin functions
- **IMPLEMENT MONITORING** for all contract interactions
- **HAVE EMERGENCY PROCEDURES** ready for incident response
- **SECURE RELAYER INFRASTRUCTURE** with proper key management

### Legal Disclaimer
This software is provided "as is" without warranty of any kind. Users assume all risks associated with:
- Smart contract vulnerabilities
- Bridge failures or delays  
- Loss of funds due to bugs or exploits
- Regulatory compliance in their jurisdiction
- Fee collection and staking mechanisms

The developers are not responsible for any financial losses, legal issues, or other damages arising from the use of this software.

### Regulatory Compliance
Users are responsible for ensuring compliance with local laws and regulations regarding:
- Cryptocurrency trading and exchange
- Cross-border financial transfers
- Tax reporting and obligations
- KYC/AML requirements where applicable
- Staking and farming activities

### Security Notice
⚠️ **CRITICAL**: This is a complex DeFi system handling real value. Before mainnet deployment:
- **GET PROFESSIONAL AUDITS** for all smart contracts
- **TEST EXTENSIVELY** on testnets with real scenarios
- **USE MULTI-SIGNATURE** wallets for all admin functions
- **IMPLEMENT MONITORING** for all contract interactions
- **HAVE EMERGENCY PROCEDURES** ready for incident response
- **SECURE RELAYER INFRASTRUCTURE** with proper key management

### Legal Disclaimer
This software is provided "as is" without warranty of any kind. Users assume all risks associated with:
- Smart contract vulnerabilities
- Bridge failures or delays  
- Loss of funds due to bugs or exploits
- Regulatory compliance in their jurisdiction
- Fee collection and staking mechanisms

The developers are not responsible for any financial losses, legal issues, or other damages arising from the use of this software.

### Regulatory Compliance
Users are responsible for ensuring compliance with local laws and regulations regarding:
- Cryptocurrency trading and exchange
- Cross-border financial transfers
- Tax reporting and obligations
- KYC/AML requirements where applicable
- Staking and farming activities

---

**Built with ❤️ for the DeFi community**

*A truly decentralized, self-contained DEX and bridge solution with advanced staking and farming capabilities*

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core DEX functionality with AMM
- ✅ Cross-chain bridge with relayer system
- ✅ ESR staking system with USDT rewards
- ✅ LP farming platform with multiple pools
- ✅ Fee collection system ($3 USDT per transaction)
- ✅ Admin management tools for tokens and relayers
- ✅ Fully mobile-optimized responsive design

### Phase 2 (Upcoming)
- 🔄 Advanced analytics and reporting
- 🔄 Native mobile app development
- 🔄 Additional chain integrations
- 🔄 Governance token implementation
- 🔄 Advanced trading features
- 🔄 Institutional tools
- 🔄 Enhanced mobile UX optimizations

### Phase 3 (Future)
- 🔄 Cross-chain governance
- 🔄 Advanced DeFi integrations
- 🔄 Layer 2 scaling solutions
- 🔄 Enterprise partnerships
- 🔄 Advanced security features
- 🔄 Global expansion
- 🔄 Mobile-first feature innovations

## 🔧 Troubleshooting

### Hardhat Deployment Issues

If you encounter issues with Hardhat deployment:

1. **Check Network Configuration**
   - Verify RPC URLs in `hardhat.config.js`
   - Ensure private key is correctly set
   - Check network connectivity

2. **Gas Issues**
   - Adjust gas settings in `hardhat.config.js`
   - Ensure wallet has sufficient funds

3. **Contract Size Limits**
   - If contracts exceed size limits, try enabling optimization
   - Split large contracts if necessary

4. **Use Remix IDE Alternative**
   - Follow the "Alternative: Deploying with Remix IDE" section above
   - This provides a more visual, step-by-step approach

### Frontend Connection Issues

If the frontend can't connect to contracts:

1. **Check Contract Addresses**
   - Verify addresses in `src/constants/contracts.ts`
   - Ensure they match deployed contracts

2. **Network Mismatch**
   - Make sure wallet is connected to the correct network
   - Check chainId matches in configuration

3. **ABI Issues**
   - Verify ABIs match deployed contract versions
   - Regenerate ABIs if necessary

### Mobile-Specific Issues

For mobile-specific problems:

1. **Wallet Connection**
   - Use WalletConnect for better mobile compatibility
   - Ensure deep linking is properly configured

2. **UI Rendering**
   - Test on multiple device sizes
   - Use browser developer tools to simulate different devices

3. **Performance**
   - Reduce bundle size for faster loading on mobile
   - Optimize images and assets