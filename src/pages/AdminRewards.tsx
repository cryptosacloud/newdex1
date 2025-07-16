import React, { useState, useEffect } from 'react'
import { Settings, Plus, TrendingUp, DollarSign, Users, Activity, Pause, Play, Edit } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useFarmingContract } from '../hooks/useFarmingContract'
import { useStakingContract } from '../hooks/useStakingContract'
import { getContractAddresses } from '../constants/contracts'

interface Pool {
  id: number
  name: string
  lpToken: string
  allocPoint: number
  totalStaked: string
  isActive: boolean
  apr: string
}

interface RewardStats {
  totalESRDistributed: string
  totalUSDTCollected: string
  activeStakers: number
  activeFarmers: number
  totalTVL: string
  dailyEmissions: string
}

const AdminRewards: React.FC = () => {
  const { account, isConnected, chainId } = useWallet()
  const { 
    getAllPools, 
    getFarmingStats, 
    addPool, 
    setPool, 
    setPoolStatus, 
    setEmissionRate,
    massUpdatePools 
  } = useFarmingContract()
  const { getStakingStats, distributeRewards } = useStakingContract()
  
  const [pools, setPools] = useState<Pool[]>([])
  const [farmingStats, setFarmingStats] = useState({
    totalPools: 0,
    totalAllocPoint: 0,
    esrPerSecond: '0',
    totalValueLocked: '0'
  })
  const [rewardStats, setRewardStats] = useState<RewardStats>({
    totalESRDistributed: '0',
    totalUSDTCollected: '0',
    activeStakers: 0,
    activeFarmers: 0,
    totalTVL: '0',
    dailyEmissions: '0'
  })
  
  const [showAddPool, setShowAddPool] = useState(false)
  const [showEditPool, setShowEditPool] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [newPool, setNewPool] = useState({
    lpToken: '',
    allocPoint: '',
    name: ''
  })
  const [newEmissionRate, setNewEmissionRate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Check if user is admin (contract owner)
  const isAdmin = React.useMemo(() => {
    if (!account || !chainId) return false
    
    // For demo purposes, check if user is the deployer address from localhost
    const addresses = getContractAddresses(chainId)
    if (!addresses) return false
    
    // In production, you would check if account is the owner of the contracts
    // For now, we'll allow access if contracts are deployed
    return addresses.factory !== '0x0000000000000000000000000000000000000000'
  }, [account, chainId])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin])

  const loadData = async () => {
    try {
      await Promise.all([
        loadPools(),
        loadFarmingStats(),
        loadRewardStats()
      ])
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const loadPools = async () => {
    try {
      const poolData = await getAllPools()
      const formattedPools = poolData.lpTokens.map((lpToken: string, index: number) => ({
        id: index,
        name: poolData.names[index],
        lpToken,
        allocPoint: poolData.allocPoints[index],
        totalStaked: poolData.totalStaked[index],
        isActive: poolData.isActive[index],
        apr: calculateAPR(poolData.allocPoints[index], poolData.totalStaked[index])
      }))
      setPools(formattedPools)
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  const loadFarmingStats = async () => {
    try {
      const stats = await getFarmingStats()
      setFarmingStats(stats)
    } catch (error) {
      console.error('Error loading farming stats:', error)
    }
  }

  const loadRewardStats = async () => {
    try {
      const stakingStats = await getStakingStats()
      const farmingStats = await getFarmingStats()
      
      setRewardStats({
        totalESRDistributed: stakingStats.totalRewardsDistributed,
        totalUSDTCollected: stakingStats.totalRewardsDistributed, // Assuming 1:1 for demo
        activeStakers: stakingStats.totalStakers,
        activeFarmers: farmingStats.totalPools,
        totalTVL: (parseFloat(stakingStats.totalStaked) + parseFloat(farmingStats.totalValueLocked)).toString(),
        dailyEmissions: (parseFloat(farmingStats.esrPerSecond) * 86400).toString()
      })
    } catch (error) {
      console.error('Error loading reward stats:', error)
    }
  }

  const calculateAPR = (allocPoint: number, totalStaked: string) => {
    if (parseFloat(totalStaked) === 0 || farmingStats.totalAllocPoint === 0) return '0'
    
    const poolWeight = allocPoint / farmingStats.totalAllocPoint
    const esrPerDay = parseFloat(farmingStats.esrPerSecond) * 86400
    const poolESRPerDay = esrPerDay * poolWeight
    const dailyAPR = (poolESRPerDay / parseFloat(totalStaked)) * 100
    const annualAPR = dailyAPR * 365
    
    return annualAPR.toFixed(1)
  }

  const handleAddPool = async () => {
    if (!newPool.lpToken || !newPool.allocPoint || !newPool.name) {
      alert('Please fill in all fields')
      return
    }

    try {
      setIsLoading(true)
      await addPool(newPool.lpToken, parseInt(newPool.allocPoint), newPool.name)
      alert('Pool added successfully!')
      setNewPool({ lpToken: '', allocPoint: '', name: '' })
      setShowAddPool(false)
      loadData()
    } catch (error) {
      console.error('Add pool failed:', error)
      alert('Failed to add pool')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditPool = async () => {
    if (!selectedPool) return

    try {
      setIsLoading(true)
      await setPool(selectedPool.id, selectedPool.allocPoint)
      alert('Pool updated successfully!')
      setShowEditPool(false)
      setSelectedPool(null)
      loadData()
    } catch (error) {
      console.error('Edit pool failed:', error)
      alert('Failed to update pool')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePool = async (pool: Pool) => {
    try {
      setIsLoading(true)
      await setPoolStatus(pool.id, !pool.isActive)
      alert(`Pool ${pool.isActive ? 'paused' : 'activated'} successfully!`)
      loadData()
    } catch (error) {
      console.error('Toggle pool failed:', error)
      alert('Failed to toggle pool status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEmissionRate = async () => {
    if (!newEmissionRate) return

    try {
      setIsLoading(true)
      await setEmissionRate(newEmissionRate)
      alert('Emission rate updated successfully!')
      setNewEmissionRate('')
      loadData()
    } catch (error) {
      console.error('Update emission rate failed:', error)
      alert('Failed to update emission rate')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMassUpdate = async () => {
    try {
      setIsLoading(true)
      await massUpdatePools()
      alert('All pools updated successfully!')
      loadData()
    } catch (error) {
      console.error('Mass update failed:', error)
      alert('Failed to update pools')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDistributeRewards = async () => {
    try {
      setIsLoading(true)
      await distributeRewards()
      alert('Rewards distributed successfully!')
      loadData()
    } catch (error) {
      console.error('Distribute rewards failed:', error)
      alert('Failed to distribute rewards')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Admin Access Required</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to access the admin panel.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <Settings className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-500 dark:text-gray-400">
            You don't have permission to access the reward management panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Reward Management</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddPool(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pool</span>
          </button>
          <button
            onClick={handleMassUpdate}
            disabled={isLoading}
            className="btn-secondary"
          >
            Update All Pools
          </button>
          <button
            onClick={handleDistributeRewards}
            disabled={isLoading}
            className="btn-primary"
          >
            Distribute Rewards
          </button>
        </div>
      </div>

      {/* Reward Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span className="text-lg font-bold">${parseFloat(rewardStats.totalUSDTCollected).toFixed(0)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">USDT Collected</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold">{parseFloat(rewardStats.totalESRDistributed).toFixed(0)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">ESR Distributed</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span className="text-lg font-bold">{rewardStats.activeStakers}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Stakers</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-6 h-6 text-orange-600" />
            <span className="text-lg font-bold">{rewardStats.activeFarmers}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Pools</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-6 h-6 text-indigo-600" />
            <span className="text-lg font-bold">${parseFloat(rewardStats.totalTVL).toFixed(0)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total TVL</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-pink-600" />
            <span className="text-lg font-bold">{parseFloat(rewardStats.dailyEmissions).toFixed(0)}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Daily ESR</p>
        </div>
      </div>

      {/* Emission Rate Control */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Emission Rate Control</h3>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ESR per Second
            </label>
            <input
              type="number"
              placeholder={farmingStats.esrPerSecond}
              value={newEmissionRate}
              onChange={(e) => setNewEmissionRate(e.target.value)}
              className="input-field"
              step="0.001"
            />
          </div>
          <button
            onClick={handleUpdateEmissionRate}
            disabled={isLoading || !newEmissionRate}
            className="btn-primary mt-6"
          >
            Update Rate
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Current: {farmingStats.esrPerSecond} ESR/second ({(parseFloat(farmingStats.esrPerSecond) * 86400).toFixed(2)} ESR/day)
        </p>
      </div>

      {/* LP Pools Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6">LP Farming Pools</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Pool</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Weight</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">TVL</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">APR</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pools.map((pool) => (
                <tr key={pool.id} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {pool.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{pool.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{pool.lpToken.substring(0, 10)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{pool.allocPoint}</td>
                  <td className="py-3 px-4 text-right">${parseFloat(pool.totalStaked).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">{pool.apr}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      pool.isActive 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {pool.isActive ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPool(pool);
                          setShowEditPool(true);
                        }}
                        className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePool(pool)}
                        className={`p-1 ${
                          pool.isActive 
                            ? 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300' 
                            : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300'
                        }`}
                      >
                        {pool.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Pool Modal */}
      {showAddPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-6">Add New Farming Pool</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LP Token Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newPool.lpToken}
                  onChange={(e) => setNewPool({ ...newPool, lpToken: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocation Points
                </label>
                <input
                  type="number"
                  placeholder="100"
                  value={newPool.allocPoint}
                  onChange={(e) => setNewPool({ ...newPool, allocPoint: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pool Name
                </label>
                <input
                  type="text"
                  placeholder="WETH-USDT LP"
                  value={newPool.name}
                  onChange={(e) => setNewPool({ ...newPool, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddPool(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPool}
                  disabled={isLoading || !newPool.lpToken || !newPool.allocPoint || !newPool.name}
                  className="flex-1 btn-primary"
                >
                  {isLoading ? 'Adding...' : 'Add Pool'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pool Modal */}
      {showEditPool && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-6">Edit Pool: {selectedPool.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocation Points
                </label>
                <input
                  type="number"
                  value={selectedPool.allocPoint}
                  onChange={(e) => setSelectedPool({
                    ...selectedPool,
                    allocPoint: parseInt(e.target.value)
                  })}
                  className="input-field"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditPool(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditPool}
                  disabled={isLoading}
                  className="flex-1 btn-primary"
                >
                  {isLoading ? 'Updating...' : 'Update Pool'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminRewards
