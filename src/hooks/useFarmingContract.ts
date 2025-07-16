import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getContractAddresses } from '../constants/contracts'
import FARMING_ABI from '../../abi/farming/LPFarming.json'
import ERC20_ABI from '../../abi/Tokens/DexBridgeToken.json'

export const useFarmingContract = () => {
  const { provider, chainId, account } = useWallet()
  const [farmingContract, setFarmingContract] = useState<ethers.Contract | null>(null)

  useEffect(() => {
    const initializeContract = async () => {
      if (!provider || !chainId) {
        setFarmingContract(null)
        return
      }

      try {
        const addresses = getContractAddresses(chainId)
        if (!addresses?.farming) {
          console.error('Farming contract address not found for chain:', chainId)
          return
        }
        
        const signer = await provider.getSigner()
        const farming = new ethers.Contract(addresses.farming, FARMING_ABI, signer)
        setFarmingContract(farming)
      } catch (error) {
        console.error('Error initializing farming contract:', error)
      }
    }

    initializeContract()
  }, [provider, chainId])

  const getLPContract = async (lpTokenAddress: string) => {
    if (!provider) return null
    const signer = await provider.getSigner()
    return new ethers.Contract(lpTokenAddress, ERC20_ABI, signer)
  }

  const deposit = async (pid: number, amount: string) => {
    if (!farmingContract || !account) throw new Error('Contract not available')
    
    if (!chainId) throw new Error('Chain not connected')
    const addresses = getContractAddresses(chainId)
    if (!addresses?.farming) throw new Error('Farming contract address not found')

    const poolInfo = await farmingContract.getPoolInfo(pid)
    const lpContract = await getLPContract(poolInfo.lpToken)
    if (!lpContract) throw new Error('LP contract not available')

    const amountWei = ethers.parseEther(amount)
    
    // Check allowance
    const allowance = await lpContract.allowance(account, addresses.farming)
    if (allowance < amountWei) {
      const approveTx = await lpContract.approve(addresses.farming, amountWei)
      await approveTx.wait()
    }

    const tx = await farmingContract.deposit(pid, amountWei)
    return tx.wait()
  }

  const withdraw = async (pid: number, amount: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.withdraw(pid, ethers.parseEther(amount))
    return tx.wait()
  }

  const harvest = async (pid: number) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.harvest(pid)
    return tx.wait()
  }

  const harvestAll = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.harvestAll()
    return tx.wait()
  }

  const pendingESR = async (pid: number, userAddress: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const pending = await farmingContract.pendingESR(pid, userAddress)
    return ethers.formatEther(pending)
  }

  const getUserInfo = async (pid: number, userAddress: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const info = await farmingContract.getUserInfo(pid, userAddress)
    return {
      amount: ethers.formatEther(info.amount),
      rewardDebt: ethers.formatEther(info.rewardDebt),
      stakedAt: Number(info.stakedAt),
      pendingRewards: ethers.formatEther(info.pendingRewards)
    }
  }

  const getAllPools = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const pools = await farmingContract.getAllPools()
    return {
      lpTokens: pools.lpTokens,
      allocPoints: pools.allocPoints.map((ap: bigint) => Number(ap)),
      totalStaked: pools.totalStaked.map((ts: bigint) => ethers.formatEther(ts)),
      isActive: pools.isActive,
      names: pools.names
    }
  }

  const getFarmingStats = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const stats = await farmingContract.getFarmingStats()
    return {
      totalPools: Number(stats.totalPools),
      totalAllocPoint: Number(stats._totalAllocPoint),
      esrPerSecond: ethers.formatEther(stats._esrPerSecond),
      totalValueLocked: ethers.formatEther(stats.totalValueLocked)
    }
  }

  // Admin functions
  const addPool = async (lpToken: string, allocPoint: number, name: string, withUpdate: boolean = true) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.addPool(lpToken, allocPoint, name, withUpdate)
    return tx.wait()
  }

  const setPool = async (pid: number, allocPoint: number, withUpdate: boolean = true) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.setPool(pid, allocPoint, withUpdate)
    return tx.wait()
  }

  const setPoolStatus = async (pid: number, isActive: boolean) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.setPoolStatus(pid, isActive)
    return tx.wait()
  }

  const setEmissionRate = async (esrPerSecond: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.setEmissionRate(ethers.parseEther(esrPerSecond))
    return tx.wait()
  }

  const massUpdatePools = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const tx = await farmingContract.massUpdatePools()
    return tx.wait()
  }

  return {
    farmingContract,
    deposit,
    withdraw,
    harvest,
    harvestAll,
    pendingESR,
    getUserInfo,
    getAllPools,
    getFarmingStats,
    addPool,
    setPool,
    setPoolStatus,
    setEmissionRate,
    massUpdatePools
  }
}