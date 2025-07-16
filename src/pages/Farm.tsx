import React, { useState, useEffect } from 'react'
import { Sprout, TrendingUp, DollarSign, Clock } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useFarmingContract } from '../hooks/useFarmingContract'
import TestnetBadge from '../components/TestnetBadge'
import NetworkSwitcher from '../components/NetworkSwitcher'

interface Pool {
  id: number
  name: string
  lpToken: string
  allocPoint: number
  totalStaked: string
  isActive: boolean
  apr: string
  userStaked: string
  pendingRewards: string
}

interface FarmProps {
  testnetMode: boolean;
}

const Farm: React.FC<FarmProps> = ({ testnetMode }) => {
  const { isConnected, account } = useWallet()
  const { 
    deposit, 
    withdraw, 
    harvest, 
    harvestAll,
    getAllPools, 
    getUserInfo, 
    pendingESR,
    getFarmingStats,
    farmingContract
  } = useFarmingContract()
  
  const [pools, setPools] = useState<Pool[]>([])
  const [farmingStats, setFarmingStats] = useState({
    totalPools: 0,
    totalAllocPoint: 0,
    esrPerSecond: '0',
    totalValueLocked: '0'
  })
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isHarvesting, setIsHarvesting] = useState(false)
  const [showStakeModal, setShowStakeModal] = useState(false)

  useEffect(() => {
    if (farmingContract) {
      loadPools()
      loadFarmingStats()
    }
  }, [farmingContract])

  useEffect(() => {
    if (account && farmingContract) {
      loadUserData()
    }
  }, [account, pools, farmingContract])

  const loadPools = async () => {
    if (!farmingContract) return
    
    try {
      const poolData = await getAllPools()
      const formattedPools: Pool[] = poolData.lpTokens.map((lpToken: string, index: number) => ({
        id: index,
        name: poolData.names[index],
        lpToken,
        allocPoint: poolData.allocPoints[index],
        totalStaked: poolData.totalStaked[index].toString(),
        isActive: poolData.isActive[index],
        apr: '0', // Calculate based on emissions and TVL
        userStaked: '0',
        pendingRewards: '0'
      }))
      setPools(formattedPools)
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  const loadFarmingStats = async () => {
    if (!farmingContract) return
    
    try {
      const stats = await getFarmingStats()
      setFarmingStats(stats)
    } catch (error) {
      console.error('Error loading farming stats:', error)
    }
  }

  const loadUserData = async () => {
    if (!account || !farmingContract) return
    
    try {
      const updatedPools = await Promise.all(
        pools.map(async (pool) => {
          const userInfo = await getUserInfo(pool.id, account)
          const pending = await pendingESR(pool.id, account)
          
          return {
            ...pool,
            userStaked: userInfo.amount,
            pendingRewards: pending
          }
        })
      )
      setPools(updatedPools)
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return

    try {
      setIsStaking(true)
      await deposit(selectedPool.id, stakeAmount)
      alert('LP tokens staked successfully!')
      setStakeAmount('')
      setShowStakeModal(false)
      loadUserData()
    } catch (error) {
      console.error('Staking failed:', error)
      alert('Staking failed. Please try again.')
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async () => {
    if (!selectedPool || !unstakeAmount) return

    try {
      setIsUnstaking(true)
      await withdraw(selectedPool.id, unstakeAmount)
      alert('LP tokens unstaked successfully!')
      setUnstakeAmount('')
      setShowStakeModal(false)
      loadUserData()
    } catch (error) {
      console.error('Unstaking failed:', error)
      alert('Unstaking failed. Please try again.')
    } finally {
      setIsUnstaking(false)
    }
  }

  const handleHarvest = async (poolId: number) => {
    try {
      setIsHarvesting(true)
      await harvest(poolId)
      alert('Rewards harvested successfully!')
      loadUserData()
    } catch (error) {
      console.error('Harvest failed:', error)
      alert('Harvest failed. Please try again.')
    } finally {
      setIsHarvesting(false)
    }
  }

  const handleHarvestAll = async () => {
    try {
      setIsHarvesting(true)
      await harvestAll()
      alert('All rewards harvested successfully!')
      loadUserData()
    } catch (error) {
      console.error('Harvest all failed:', error)
      alert('Harvest all failed. Please try again.')
    } finally {
      setIsHarvesting(false)
    }
  }

  const calculateAPR = (pool: Pool) => {
    // Simplified APR calculation
    // In production, you'd need price oracles and more complex calculations
    const poolWeight = pool.allocPoint / farmingStats.totalAllocPoint
    const esrPerDay = parseFloat(farmingStats.esrPerSecond) * 86400
    const poolESRPerDay = esrPerDay * poolWeight
    
    if (parseFloat(pool.totalStaked) === 0) return '0'
    
    // Assuming 1 ESR = $1 and 1 LP = $1 for simplification
    const dailyRewardValue = poolESRPerDay
    const poolValue = parseFloat(pool.totalStaked)
    const dailyAPR = (dailyRewardValue / poolValue) * 100
    const annualAPR = dailyAPR * 365
    
    return annualAPR.toFixed(1)
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Connect your wallet to start farming with LP tokens and earn ESR rewards.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">LP Farming</h1>
          <TestnetBadge className="ml-2" />
        </div>
        <div className="flex items-center space-x-4">
          <div className="card p-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Pending</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {pools.reduce((sum, pool) => sum + parseFloat(pool.pendingRewards), 0).toFixed(4)} ESR
              </p>
            </div>
          </div>
          <button
            onClick={handleHarvestAll}
            disabled={isHarvesting}
            className="btn-primary"
          >
            {isHarvesting ? 'Harvesting...' : 'Harvest All'}
          </button>
        </div>
      </div>

      {/* Farming Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Sprout className="w-8 h-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold">{farmingStats.totalPools}</span>
          </div>
          <h3 className="font-semibold">Active Pools</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">LP Farming Pools</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold">
              {parseFloat(farmingStats.esrPerSecond).toFixed(2)}
            </span>
          </div>
          <h3 className="font-semibold">ESR/Second</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Emission Rate</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold">
              ${parseFloat(farmingStats.totalValueLocked).toLocaleString()}
            </span>
          </div>
          <h3 className="font-semibold">Total TVL</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Value Locked</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            <span className="text-2xl font-bold">{farmingStats.totalAllocPoint}</span>
          </div>
          <h3 className="font-semibold">Total Weight</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Allocation Points</p>
        </div>
      </div>

      {/* Farming Pools */}
      <div className="space-y-4">
        {pools.map((pool) => (
          <div key={pool.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Sprout className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{pool.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Weight: {pool.allocPoint} | Status: {pool.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">APR</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {calculateAPR(pool)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Staked</p>
                  <p className="font-semibold">{parseFloat(pool.totalStaked).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your Stake</p>
                  <p className="font-semibold">{parseFloat(pool.userStaked).toFixed(4)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending ESR</p>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {parseFloat(pool.pendingRewards).toFixed(4)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedPool(pool)
                      setShowStakeModal(true)
                    }}
                    className="btn-primary"
                    disabled={!pool.isActive}
                  >
                    Stake
                  </button>
                  {parseFloat(pool.pendingRewards) > 0 && (
                    <button
                      onClick={() => handleHarvest(pool.id)}
                      disabled={isHarvesting}
                      className="btn-secondary"
                    >
                      Harvest
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stake/Unstake Modal */}
      {showStakeModal && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-6">Manage {selectedPool.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stake LP Tokens
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={handleStake}
                  disabled={isStaking || !stakeAmount}
                  className="w-full btn-primary mt-2"
                >
                  {isStaking ? 'Staking...' : 'Stake'}
                </button>
              </div>
              
              {parseFloat(selectedPool.userStaked) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unstake LP Tokens
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="input-field"
                    max={selectedPool.userStaked}
                  />
                  <button
                    onClick={handleUnstake}
                    disabled={isUnstaking || !unstakeAmount}
                    className="w-full btn-secondary mt-2"
                  >
                    {isUnstaking ? 'Unstaking...' : 'Unstake'}
                  </button>
                </div>
              )}
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span>Your Staked:</span>
                  <span>{parseFloat(selectedPool.userStaked).toFixed(4)} LP</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Pending Rewards:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {parseFloat(selectedPool.pendingRewards).toFixed(4)} ESR
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pool APR:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {calculateAPR(selectedPool)}%
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setShowStakeModal(false)}
                className="w-full btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Farm