import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getContractAddresses } from '../constants/contracts'
import FARMING_ABI from '../../abi/farming/LPFarming.json'
import ERC20_ABI from '../../abi/Tokens/DexBridgeToken.json'
import { ethers } from 'ethers'

interface FarmingStats {
  totalPools: number;
  totalAllocPoint: number;
  esrPerSecond: string;
  totalValueLocked: string;
}

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
          console.warn('Farming contract address not found for chain:', chainId)
          setFarmingContract(null)
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

    try {  
      try {
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
      } catch (error) {
        console.error('Error in deposit:', error)
        throw error
      }
    } catch (error) {
      console.error('Farming contract not available for deposit:', error)
      throw error
    }
  }

  const withdraw = async (pid: number, amount: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const tx = await farmingContract.withdraw(pid, ethers.parseEther(amount))
      return tx.wait()
    } catch (error) {
      console.error('Error in withdraw:', error)
      throw error
    }
  }

  const harvest = async (pid: number) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const tx = await farmingContract.harvest(pid)
      return tx.wait()
    } catch (error) {
      console.error('Error in harvest:', error)
      throw error
    }
  }

  const harvestAll = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const tx = await farmingContract.harvestAll()
      return tx.wait()
    } catch (error) {
      console.error('Error in harvestAll:', error)
      throw error
    }
  }

  const pendingESR = async (pid: number, userAddress: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const pending = await farmingContract.pendingESR(pid, userAddress)
      return ethers.formatEther(pending)
    } catch (error) {
      console.error('Error in pendingESR:', error)
      return '0'
    }
  }

  const getUserInfo = async (pid: number, userAddress: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const info = await farmingContract.getUserInfo(pid, userAddress)
      return {
        amount: ethers.formatEther(info.amount),
        rewardDebt: ethers.formatEther(info.rewardDebt),
        stakedAt: Number(info.stakedAt),
        pendingRewards: ethers.formatEther(info.pendingRewards)
      }
    } catch (error) {
      console.error('Error in getUserInfo:', error)
      return {
        amount: '0',
        rewardDebt: '0',
        stakedAt: 0,
        pendingRewards: '0'
      }
    }
  }

  const getAllPools = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const pools = await farmingContract.getAllPools()
      return {
        lpTokens: pools.lpTokens || [],
        allocPoints: (pools.allocPoints || []).map((ap: bigint) => Number(ap)),
        totalStaked: (pools.totalStaked || []).map((ts: bigint) => ethers.formatEther(ts)),
        isActive: pools.isActive || [],
        names: pools.names || []
      }
    } catch (error) {
      console.error('Error in getAllPools:', error)
      return {
        lpTokens: [],
        allocPoints: [],
        totalStaked: [],
        isActive: [],
        names: []
      }
    }
  }

  const getFarmingStats = async (): Promise<FarmingStats> => {
    if (!farmingContract) throw new Error('Contract not available')
    
    const defaultStats: FarmingStats = {
      totalPools: 0,
      totalAllocPoint: 0,
      esrPerSecond: '0',
      totalValueLocked: '0'
    }
    
    try {
      // First try the direct getFarmingStats function
      if (farmingContract.getFarmingStats && typeof farmingContract.getFarmingStats === 'function') {
        try {
          const stats = await farmingContract.getFarmingStats();
          return {
            totalPools: Number(stats.totalPools || 0),
            totalAllocPoint: Number(stats._totalAllocPoint || 0),
            esrPerSecond: stats._esrPerSecond ? ethers.formatEther(stats._esrPerSecond) : '0',
            totalValueLocked: stats.totalValueLocked ? ethers.formatEther(stats.totalValueLocked) : '0'
          }
        } catch (error) {
          console.error('Error calling getFarmingStats:', error);
          // Fall through to the fallback approach
        }
      }
      
      console.warn('getFarmingStats function not available on farming contract');
      
      // Try to get pool length first
      const poolLength = await farmingContract.poolLength().catch(() => BigInt(0));
      let totalPoolCount = Number(poolLength);
      
      // If we can't get the farming stats directly, build them from other calls
      let totalValueLocked = BigInt(0);
      let totalAllocPoint = BigInt(0);
      
      // Try to get emission rate
      let esrPerSecondValue = BigInt(0);
      try {
        esrPerSecondValue = await farmingContract.esrPerSecond();
      } catch (error) {
        console.warn('Could not get esrPerSecond:', error);
      }
      
      // Try to get pools info if available
      try {
        const pools = await getAllPools();
        
        // Update total pools count if we got the pools
        if (pools && pools.lpTokens && Array.isArray(pools.lpTokens)) {
          totalPoolCount = pools.lpTokens.length;
        }
        
        // Calculate total alloc points
        if (pools && pools.allocPoints && Array.isArray(pools.allocPoints)) {
          totalAllocPoint = BigInt(pools.allocPoints.reduce((sum, ap) => sum + (ap || 0), 0));
        }
        
        // Calculate total value locked
        if (pools && pools.totalStaked && Array.isArray(pools.totalStaked)) {
          let tvlSum = BigInt(0);
          for (const stakedAmount of pools.totalStaked) {
            if (stakedAmount) {
              try {
                tvlSum += ethers.parseEther(stakedAmount);
              } catch (e) {
                console.warn('Error parsing staked amount:', e);
              }
            }
          }
          totalValueLocked = tvlSum;
        }
      } catch (poolError) {
        console.warn('Could not get complete pool information:', poolError);
      }
      
      return {
        totalPools: Number(poolLength),
        totalAllocPoint: Number(totalAllocPoint || 0),
        esrPerSecond: ethers.formatEther(esrPerSecondValue || 0),
        totalValueLocked: ethers.formatEther(totalValueLocked)
      };
    } catch (error) {
      console.error('Error fetching farming stats:', error)
      return defaultStats;
    }
  }

  const addPool = async (lpToken: string, allocPoint: number, name: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    // Validate inputs
    if (!lpToken) {
      throw new Error('LP token address is required');
    }
    
    if (!ethers.isAddress(lpToken)) {
      throw new Error('Invalid LP token address');
    }
    
    if (!name || name.trim() === '') {
      throw new Error('Pool name is required');
    }
    
    if (isNaN(allocPoint) || allocPoint < 0) {
      throw new Error('Allocation points must be a positive number');
    }
    
    try {
      const tx = await farmingContract.addPool(lpToken, allocPoint, name, true)
      return tx.wait()
    } catch (error) {
      console.error('Error in addPool:', error)
      throw error
    }
  }

  const setPool = async (pid: number, allocPoint: number) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    // Validate inputs
    if (isNaN(pid) || pid < 0) {
      throw new Error('Invalid pool ID');
    }
    
    if (isNaN(allocPoint) || allocPoint < 0) {
      throw new Error('Allocation points must be a positive number');
    }
    
    try {
      const tx = await farmingContract.setPool(pid, allocPoint, true)
      return tx.wait()
    } catch (error) {
      console.error('Error in setPool:', error)
      throw error
    }
  }

  const setPoolStatus = async (pid: number, isActive: boolean) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    // Validate inputs
    if (isNaN(pid) || pid < 0) {
      throw new Error('Invalid pool ID');
    }
    
    try {
      const tx = await farmingContract.setPoolStatus(pid, isActive)
      return tx.wait()
    } catch (error) {
      console.error('Error in setPoolStatus:', error)
      throw error
    }
  }

  const setEmissionRate = async (esrPerSecond: string) => {
    if (!farmingContract) throw new Error('Contract not available')
    
    // Validate emission rate
    const rate = parseFloat(esrPerSecond);
    if (isNaN(rate) || rate < 0) {
      throw new Error('Emission rate must be a positive number');
    }
    
    try {
      // Parse the emission rate with proper error handling
      let parsedRate;
      try {
        parsedRate = ethers.parseEther(esrPerSecond);
      } catch (parseError) {
        console.error('Error parsing emission rate:', parseError);
        throw new Error('Invalid emission rate format');
      }
      
      const tx = await farmingContract.setEmissionRate(parsedRate);
      return tx.wait();
    } catch (error) {
      console.error('Error in setEmissionRate:', error)
      throw error
    }
  }

  const massUpdatePools = async () => {
    if (!farmingContract) throw new Error('Contract not available')
    
    try {
      const tx = await farmingContract.massUpdatePools() 
      return tx.wait()
    } catch (error) {
      console.error('Error updating pools:', error)
      throw error
    }
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