import React, { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, Users, Activity, Droplets, Grid as BridgeIcon } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useDexContract } from '../hooks/useDexContract'
import { useStakingContract } from '../hooks/useStakingContract'
import { useFarmingContract } from '../hooks/useFarmingContract'
import { useBridgeContract } from '../hooks/useBridgeContract'
import { isTestnetChain } from '../constants/chainConfig'
import TestnetBadge from '../components/TestnetBadge'

interface AnalyticsProps {
  testnetMode: boolean;
}

interface AnalyticsData {
  totalValueLocked: string
  volume24h: string
  activeUsers: number
  totalTransactions: number
  totalStaked: string
  totalFarmingTVL: string
  totalRewardsDistributed: string
  totalPools: number
  bridgeTransactions: number
  bridgeVolume: string
}

const Analytics: React.FC<AnalyticsProps> = ({ testnetMode }) => {
  const { chainId, isConnected } = useWallet()
  const { contracts, getAllPairs, getPairReserves } = useDexContract()
  const { getStakingStats } = useStakingContract()
  const { getFarmingStats } = useFarmingContract()
  const { getAllTransactions } = useBridgeContract()
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalValueLocked: '0',
    volume24h: '0',
    activeUsers: 0,
    totalTransactions: 0,
    totalStaked: '0',
    totalFarmingTVL: '0',
    totalRewardsDistributed: '0',
    totalPools: 0,
    bridgeTransactions: 0,
    bridgeVolume: '0'
  })
  const [loading, setLoading] = useState(false)
  
  const currentIsTestnet = chainId ? isTestnetChain(chainId) : false;

  useEffect(() => {
    if (isConnected && contracts.factory) {
      loadAnalyticsData()
    }
  }, [isConnected, contracts.factory])

  const loadAnalyticsData = async () => {
    try {
      let pairs = []
      if (contracts.factory) {
        pairs = await getAllPairs()
      }
      
      // Load DEX data
      let dexTVL = 0
      let totalPools = 0
      try {
        const pairs = await getAllPairs()
        totalPools = pairs.length
        
        for (const pairAddress of pairs.slice(0, 10)) { // Limit to prevent RPC overload
          try {
            const reserves = await getPairReserves(pairAddress)
            dexTVL += parseFloat(reserves.reserve0) + parseFloat(reserves.reserve1)
          } catch (error) {
            console.error('Error loading pair reserves:', error)
          }
        }
      } catch (error) {
        console.error('Error loading DEX data:', error)
      }

      // Load staking stats
      let stakingStats = { 
        totalStaked: '0', 
        totalRewardsDistributed: '0',
        totalStakers: 0
      }
      try {
        stakingStats = await getStakingStats()
      } catch (error) {
        console.error('Error loading staking stats:', error)
      }

      // Load farming stats
      let farmingStats = { 
        totalValueLocked: '0',
        totalPools: 0
      }
      try {
        farmingStats = await getFarmingStats()
      } catch (error) {
        console.error('Error loading farming stats:', error)
      }

      // Load bridge stats
      let bridgeStats = {
        transactions: 0,
        volume: '0'
      }
      try {
        const bridgeTxs = await getAllTransactions()
        bridgeStats.transactions = bridgeTxs.length
        // Volume calculation would require getting transaction details
      } catch (error) {
        console.error('Error loading bridge stats:', error)
      }

      // Calculate total TVL
      const totalTVL = dexTVL + parseFloat(stakingStats.totalStaked) + parseFloat(farmingStats.totalValueLocked)

      setAnalyticsData({
        totalValueLocked: totalTVL.toFixed(2),
        volume24h: '0', // Would need event tracking for real volume
        activeUsers: stakingStats.totalStakers,
        totalTransactions: bridgeStats.transactions,
        totalStaked: stakingStats.totalStaked,
        totalFarmingTVL: farmingStats.totalValueLocked,
        totalRewardsDistributed: stakingStats.totalRewardsDistributed,
        totalPools,
        bridgeTransactions: bridgeStats.transactions,
        bridgeVolume: bridgeStats.volume
      })
    } catch (error) {
      console.error('Error loading analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      title: 'Total Value Locked',
      value: `$${parseFloat(analyticsData.totalValueLocked).toLocaleString()}`,
      change: '+0%',
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Active Users',
      value: analyticsData.activeUsers.toLocaleString(),
      change: '+0%',
      icon: Users,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Total Pools',
      value: analyticsData.totalPools.toLocaleString(),
      change: '+0%',
      icon: Droplets,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Bridge Transactions',
      value: analyticsData.bridgeTransactions.toLocaleString(),
      change: '+0%',
      icon: BridgeIcon,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <TestnetBadge className="ml-2" />
      </div>

      {currentIsTestnet && (
        <div className="card p-4 mb-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
          <p className="text-purple-800 dark:text-purple-200">
            <strong>Testnet Mode:</strong> You are viewing analytics for testnet data. These numbers reflect actual on-chain data from the testnet.
          </p>
        </div>
      )}

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <span className={`text-sm font-medium ${stat.color}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                <p className="text-gray-600 dark:text-gray-400">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">DEX Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Pools</span>
                  <span className="font-semibold">{analyticsData.totalPools}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">DEX TVL</span>
                  <span className="font-semibold">
                    ${(parseFloat(analyticsData.totalValueLocked) - parseFloat(analyticsData.totalStaked) - parseFloat(analyticsData.totalFarmingTVL)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">24h Volume</span>
                  <span className="font-semibold">${analyticsData.volume24h}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Staking Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total ESR Staked</span>
                  <span className="font-semibold">{parseFloat(analyticsData.totalStaked).toLocaleString()} ESR</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Rewards Distributed</span>
                  <span className="font-semibold">${parseFloat(analyticsData.totalRewardsDistributed).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Stakers</span>
                  <span className="font-semibold">{analyticsData.activeUsers}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Farming Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Farming TVL</span>
                  <span className="font-semibold">${parseFloat(analyticsData.totalFarmingTVL).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Active Farming Pools</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Bridge Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Transactions</span>
                  <span className="font-semibold">{analyticsData.bridgeTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bridge Volume</span>
                  <span className="font-semibold">${analyticsData.bridgeVolume}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">TVL Chart</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    TVL history will be available as data accumulates
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Volume Chart</h3>
              <div className="h-64 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Volume tracking will be available once swap events are indexed
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Protocol Health */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6">Protocol Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold mb-2">Liquidity Health</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {parseFloat(analyticsData.totalValueLocked) > 0 ? 'Active' : 'Initializing'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold mb-2">Trading Activity</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {parseFloat(analyticsData.volume24h) > 0 ? 'Active' : 'Awaiting trades'}
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h4 className="font-semibold mb-2">User Engagement</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {parseFloat(analyticsData.totalStaked) > 0 ? 'Growing' : 'Starting'}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Analytics
