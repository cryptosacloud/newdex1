import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getContractAddresses } from '../constants/contracts'
import { getTokensByChain } from '../constants/tokens'
import STAKING_ABI from '../../abi/Staking/ESRStaking.json'
import ERC20_ABI from '../../abi/Tokens/DexBridgeToken.json'

export const useStakingContract = () => {
  const { provider, chainId, account } = useWallet()
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null)
  const [esrContract, setEsrContract] = useState<ethers.Contract | null>(null)
  const [usdtContract, setUsdtContract] = useState<ethers.Contract | null>(null)

  useEffect(() => {
    const initializeContracts = async () => {
      if (!provider || !chainId) {
        setStakingContract(null)
        setEsrContract(null)
        setUsdtContract(null)
        return
      }

      try {
        const addresses = getContractAddresses(chainId)
        if (!addresses) return

        const signer = await provider.getSigner()
        
        const staking = new ethers.Contract(addresses.staking, STAKING_ABI, signer)
        const esr = new ethers.Contract(addresses.dxbToken, ERC20_ABI, signer) // Using DXB as ESR
        
        // Get USDT address from tokens config
        const tokens = getTokensByChain(chainId)
        const usdtToken = tokens.find(token => token.symbol === 'USDT')
        
        if (usdtToken) {
          const usdt = new ethers.Contract(usdtToken.address, ERC20_ABI, signer)
          setUsdtContract(usdt)
        }

        setStakingContract(staking)
        setEsrContract(esr)
      } catch (error) {
        console.error('Error initializing staking contracts:', error)
      }
    }

    initializeContracts()
  }, [provider, chainId])

  const stakeESR = async (amount: string) => {
    if (!stakingContract || !esrContract || !account) {
      throw new Error('Contracts not available')
    }

    const addresses = getContractAddresses(chainId!)
    if (!addresses) throw new Error('Contract addresses not found')

    const amountWei = ethers.parseEther(amount)
    
    // Check allowance
    const allowance = await esrContract.allowance(account, addresses.staking)
    if (allowance < amountWei) {
      const approveTx = await esrContract.approve(addresses.staking, amountWei)
      await approveTx.wait()
    }

    const tx = await stakingContract.stake(amountWei)
    return tx.wait()
  }

  const unstakeESR = async (amount: string) => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const tx = await stakingContract.unstake(ethers.parseEther(amount))
    return tx.wait()
  }

  const claimAllRewards = async () => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const tx = await stakingContract.claimAllRewards()
    return tx.wait()
  }

  const getStakeInfo = async (userAddress: string) => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const info = await stakingContract.getStakeInfo(userAddress)
    return {
      amount: ethers.formatEther(info.amount),
      stakedAt: Number(info.stakedAt),
      lockEndsAt: Number(info.lockEndsAt),
      canUnstake: info.canUnstake,
      pendingRewards: ethers.formatUnits(info.pendingRewards, 6) // USDT has 6 decimals
    }
  }

  const getStakingStats = async () => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const stats = await stakingContract.getStakingStats()
    return {
      totalStaked: ethers.formatEther(stats._totalStaked),
      totalStakers: Number(stats._totalStakers),
      totalRewardsDistributed: ethers.formatUnits(stats._totalRewardsDistributed, 6),
      pendingRewards: ethers.formatUnits(stats._pendingRewards, 6),
      currentAPR: ethers.formatEther(stats._currentAPR)
    }
  }

  const checkFeeRequirements = async (userAddress: string) => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const requirements = await stakingContract.checkFeeRequirements(userAddress)
    return {
      hasBalance: requirements.hasBalance,
      hasAllowance: requirements.hasAllowance,
      balance: requirements.balance.toString(),
      allowance: requirements.allowance.toString()
    }
  }

  const distributeRewards = async () => {
    if (!stakingContract) throw new Error('Staking contract not available')
    
    const tx = await stakingContract.distributeRewards()
    return tx.wait()
  }

  return {
    stakingContract,
    esrContract,
    usdtContract,
    stakeESR,
    unstakeESR,
    claimAllRewards,
    getStakeInfo,
    getStakingStats,
    checkFeeRequirements,
    distributeRewards
  }
}
