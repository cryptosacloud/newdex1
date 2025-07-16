# Remix IDE Deployment Guide

This folder contains clean, self-contained Solidity contracts and their corresponding ABIs for easy deployment using Remix IDE if Hardhat deployment fails.

## 📁 Folder Structure

```
remix-contracts/
├── DEX/
│   ├── Factory.sol          # DEX Factory contract
│   ├── Pair.sol             # LP Pair contract with built-in ERC20
│   └── Router.sol           # DEX Router with fee collection
├── Bridge/
│   └── BridgeCore.sol       # Cross-chain bridge with fee collection
├── Staking/
│   └── ESRStaking.sol       # ESR staking with USDT rewards
├── Farming/
│   └── LPFarming.sol        # LP farming with ESR emissions
└── Tokens/
    ├── DexBridgeToken.sol   # DXB/ESR token contract
    └── WETH.sol             # Wrapped ETH contract

abi/
├── DEX/
│   ├── Factory.json
│   └── Router.json
├── Bridge/
│   └── BridgeCore.json
├── Staking/
│   └── ESRStaking.json
└── Tokens/
    ├── DexBridgeToken.json
    └── WETH.json
```

## 🚀 Quick Deployment Steps

### 1. Open Remix IDE
Go to [https://remix.ethereum.org](https://remix.ethereum.org)

### 2. Create New Workspace
- Click "Create" → "Blank"
- Name it "DexBridge"

### 3. Upload Contracts
Copy the contracts from `remix-contracts/` folder into Remix:

1. **Create folder structure** in Remix file explorer
2. **Copy contract code** from each `.sol` file
3. **Paste into Remix** editor

### 4. Compile Contracts
- Go to "Solidity Compiler" tab
- Set compiler version to `0.8.19`
- Enable optimization (200 runs)
- Compile all contracts

### 5. Deploy in Order

#### Step 1: Deploy Tokens
1. **WETH.sol** - No constructor parameters
   - On Avalanche: Deploy as WAVAX
   - On Fantom: Deploy as WFTM
2. **DexBridgeToken.sol** - No constructor parameters (for both DXB and USDT)

#### Step 2: Deploy DEX
1. **Factory.sol** - No constructor parameters
2. **Router.sol** - Parameters:
   - `_factory`: Factory contract address
   - `_WETH`: WETH contract address  
   - `_usdtToken`: USDT contract address

#### Step 3: Deploy Staking
1. **ESRStaking.sol** - Parameters:
   - `_esrToken`: DXB token address (using as ESR)
   - `_usdtToken`: USDT token address
   - `_feeCollector`: Router contract address
   - `_rewardPool`: Your wallet address

#### Step 4: Deploy Bridge
1. **BridgeCore.sol** - Parameters:
   - `_chainId`: Current chain ID (1 for Ethereum, 56 for BSC, etc.)
     - Avalanche: 43114
     - Fantom: 250
   - `_feeCollector`: Your wallet address
   - `_usdtToken`: USDT token address

#### Step 5: Deploy Farming
1. **LPFarming.sol** - Parameters:
   - `_esrToken`: DXB token address
   - `_rewardPool`: Your wallet address
   - `_esrPerSecond`: Emission rate (e.g., "100000000000000000" for 0.1 ESR/second)
   - `_startTime`: Current timestamp

### 6. Configure Contracts

After deployment, call these functions:

#### Router Configuration
```solidity
router.setStakingContract(stakingContractAddress)
```

#### Bridge Configuration
```solidity
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

#### Staking Configuration
```solidity
staking.setFeeCollector(routerAddress)
```

## 📋 Contract Addresses Template

After deployment, update your frontend with these addresses:

```typescript
export const CONTRACT_ADDRESSES = {
  [chainId]: {
    factory: "0x...",      // Factory address
    router: "0x...",       // Router address
    bridge: "0x...",       // Bridge address
    staking: "0x...",      // ESR Staking address
    farming: "0x...",      // LP Farming address
    dxbToken: "0x...",     // DXB Token address
    weth: "0x..."          // WETH address
  }
}
```

### Avalanche Specific Notes
- Native token: AVAX
- Wrapped token: WAVAX (0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7)
- Primary DEX: Trader Joe
- Gas fees are typically very low

### Fantom Specific Notes
- Native token: FTM
- Wrapped token: WFTM (0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83)
- Primary DEX: SpookySwap
- Extremely low gas fees
## 🔧 Key Features

### Self-Contained Contracts
- All dependencies included in each file
- No external imports required
- Ready for Remix compilation

### Built-in Security
- Reentrancy protection
- Access control
- Pausable functionality
- Emergency withdrawal

### Fee Collection System
- $3 USDT fee on all swaps and bridges
- Automatic distribution to ESR stakers
- Configurable fee rates

### Cross-Chain Bridge
- Lock/mint and burn/release mechanisms
- Relayer-based processing
- Multi-chain support

## ⚠️ Important Notes

1. **Test First**: Always deploy on testnets before mainnet
2. **Verify Contracts**: Verify on block explorers after deployment
3. **Secure Keys**: Use hardware wallets for mainnet deployment
4. **Admin Functions**: Transfer ownership to multisig wallets
5. **Relayer Setup**: Configure authorized relayers for bridge

## 🆘 Troubleshooting

### Compilation Errors
- Ensure Solidity version is 0.8.19
- Enable optimization
- Check for missing semicolons or brackets

### Deployment Failures
- Check gas limits
- Verify constructor parameters
- Ensure sufficient ETH balance

### Configuration Issues
- Verify all addresses are correct
- Check function parameters
- Confirm transaction confirmations

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all contract addresses
3. Ensure proper configuration order
4. Test with small amounts first

This Remix fallback ensures you can always deploy the DexBridge ecosystem even if Hardhat encounters issues!