import React, { useState, useEffect } from 'react'
import { Plus, Droplets, TrendingUp, DollarSign } from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useDexContract } from '../hooks/useDexContract'
import { getTokensByChain } from '../constants/tokens'
import TestnetBadge from '../components/TestnetBadge'

interface PoolsProps {
  testnetMode: boolean;
}

interface Pool {
  id: string
  token0: { symbol: string; name: string; address: string }
  token1: { symbol: string; name: string; address: string }
  pairAddress: string
  tvl: string
  apr: string
  volume24h: string
  userLiquidity: string
  reserve0: string
  reserve1: string
  totalSupply: string
}

const Pools: React.FC<PoolsProps> = ({ testnetMode }) => {
  const { isConnected, chainId, account } = useWallet()
  const { addLiquidity, getPairAddress, createPair, contracts, getAllPairs, getPairReserves, getTokenBalance } = useDexContract()
  const [activeTab, setActiveTab] = useState<'pools' | 'positions'>('pools')
  const [showAddLiquidity, setShowAddLiquidity] = useState(false)
  const [pools, setPools] = useState<Pool[]>([])
  const [userPositions, setUserPositions] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  
  const [tokenA, setTokenA] = useState('')
  const [tokenB, setTokenB] = useState('')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false)

  const availableTokens = chainId ? getTokensByChain(chainId) : []

  useEffect(() => {
    if (contracts.factory && chainId) {
      loadPools()
    }
  }, [contracts.factory, chainId])

  useEffect(() => {
    if (account && contracts.factory) {
      loadUserPositions()
    }
  }, [account, contracts.factory])

  const loadPools = async () => {
    if (!contracts.factory) return
    
    try {
      setLoading(true)
      const poolsData: Pool[] = []
      
      // Get all pairs from factory
      const pairAddresses = await getAllPairs().catch(() => [])
      
      for (let i = 0; i < Math.min(pairAddresses.length, 20); i++) {
        try {
          const pairAddress = pairAddresses[i]
          const reserves = await getPairReserves(pairAddress).catch(() => ({
            token0: ethers.ZeroAddress,
            token1: ethers.ZeroAddress,
            reserve0: '0',
            reserve1: '0',
            totalSupply: '0'
          }))
          
          // Get token info
          const token0Info = availableTokens.find(t => t.address.toLowerCase() === reserves.token0.toLowerCase())
          const token1Info = availableTokens.find(t => t.address.toLowerCase() === reserves.token1.toLowerCase())
          
          if (token0Info && token1Info) {
            // Calculate TVL (simplified - would need price oracles in production)
            const tvl = (parseFloat(reserves.reserve0) + parseFloat(reserves.reserve1)).toFixed(2)
            
            poolsData.push({
              id: i.toString(),
              token0: { 
                symbol: token0Info.symbol, 
                name: token0Info.name, 
                address: token0Info.address 
              },
              token1: { 
                symbol: token1Info.symbol, 
                name: token1Info.name, 
                address: token1Info.address 
              },
              pairAddress,
              tvl,
              apr: '0', // Would need historical data for real APR
              volume24h: '0', // Would need event tracking for volume
              userLiquidity: '0',
              reserve0: reserves.reserve0,
              reserve1: reserves.reserve1,
              totalSupply: reserves.totalSupply
            })
          }
        } catch (error) {
          console.error(`Error loading pair ${i}:`, error)
        }
      }
      
      setPools(poolsData)
    } catch (error) {
      console.error('Error loading pools:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPositions = async () => {
    if (!account || !contracts.factory) return
    
    try {
      const userPools: Pool[] = []

      for (const pool of pools) {
        try {
          const lpBalance = await getTokenBalance(pool.pairAddress, account).catch(() => '0')
          if (parseFloat(lpBalance) > 0) {
            userPools.push({
              ...pool,
              userLiquidity: lpBalance
            })
          }
        } catch (error) {
          console.error(`Error checking LP balance for ${pool.pairAddress}:`, error)
        }
      }
      
      setUserPositions(userPools)
    } catch (error) {
      console.error('Error loading user positions:', error)
    }
  }

  const handleAddLiquidity = async () => {
    if (!tokenA || !tokenB || !amountA || !amountB) {
      alert('Please fill in all fields')
      return
    }

    try {
      setIsAddingLiquidity(true)
      
      // Check if pair exists, create if not
      const pairAddress = await getPairAddress(tokenA, tokenB).catch(() => ethers.ZeroAddress)
      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        await createPair(tokenA, tokenB).catch(error => {
          console.error('Error creating pair:', error)
          throw new Error('Failed to create pair')
        })
      }
      
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
      const minAmountA = (parseFloat(amountA) * 0.95).toString() // 5% slippage
      const minAmountB = (parseFloat(amountB) * 0.95).toString()
      
      await addLiquidity(tokenA, tokenB, amountA, amountB, minAmountA, minAmountB, deadline)
      
      alert('Liquidity added successfully!')
      setShowAddLiquidity(false)
      setTokenA('')
      setTokenB('')
      setAmountA('')
      setAmountB('')
      
      // Reload pools and positions
      loadPools()
      loadUserPositions()
    } catch (error) {
      console.error('Add liquidity failed:', error)
      alert('Failed to add liquidity. Please try again.')
    } finally {
      setIsAddingLiquidity(false)
    }
  }

  const calculatePoolShare = (pool: Pool) => {
    if (parseFloat(pool.userLiquidity) === 0 || parseFloat(pool.totalSupply) === 0) return '0'
    try {
      return ((parseFloat(pool.userLiquidity) / parseFloat(pool.totalSupply)) * 100).toFixed(4)
    } catch (error) {
      return '0'
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">Liquidity Pools</h1>
          <TestnetBadge className="ml-2" />
        </div>
        <button 
          onClick={() => setShowAddLiquidity(true)}
          className="btn-primary flex items-center space-x-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Add Liquidity</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <Droplets className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="text-2xl font-bold">{pools.length}</span>
          </div>
          <h3 className="font-semibold">Active Pools</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Available Trading Pairs</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
            <span className="text-2xl font-bold">
              ${pools.reduce((sum, pool) => sum + parseFloat(pool.tvl), 0).toFixed(0)}
            </span>
          </div>
          <h3 className="font-semibold">Total TVL</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value Locked</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <span className="text-2xl font-bold">{userPositions.length}</span>
          </div>
          <h3 className="font-semibold">Your Positions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active LP Positions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('pools')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pools'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          All Pools
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'positions'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          My Positions
        </button>
      </div>

      {activeTab === 'pools' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">Loading pools...</p>
            </div>
          ) : pools.length > 0 ? (
            pools.map((pool) => (
              <div key={pool.id} className="card p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {pool.token0.symbol[0]}
                      </div>
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold -ml-2">
                        {pool.token1.symbol[0]}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {pool.token0.symbol}/{pool.token1.symbol}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pool.token0.name} / {pool.token1.name}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-4 md:gap-8">
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">TVL</p>
                      <p className="font-semibold">${pool.tvl}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reserve 0</p>
                      <p className="font-semibold">{parseFloat(pool.reserve0).toFixed(4)}</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Reserve 1</p>
                      <p className="font-semibold">{parseFloat(pool.reserve1).toFixed(4)}</p>
                    </div>
                    <button 
                      onClick={() => setShowAddLiquidity(true)}
                      className="btn-primary col-span-2 sm:col-span-1"
                    >
                      Add Liquidity
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 md:p-12 text-center">
              <Droplets className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No pools found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Be the first to create a liquidity pool!
              </p>
              <button 
                onClick={() => setShowAddLiquidity(true)}
                className="btn-primary"
              >
                Create First Pool
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'positions' && (
        <div className="space-y-4">
          {userPositions.length > 0 ? (
            userPositions.map((pool) => (
              <div key={pool.id} className="card p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {pool.token0.symbol[0]}
                      </div>
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold -ml-2">
                        {pool.token1.symbol[0]}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {pool.token0.symbol}/{pool.token1.symbol}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your LP Tokens: {parseFloat(pool.userLiquidity).toFixed(6)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Pool Share</p>
                      <p className="font-semibold">{calculatePoolShare(pool)}%</p>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Value</p>
                      <p className="font-semibold">
                        ${((parseFloat(pool.userLiquidity) / parseFloat(pool.totalSupply)) * parseFloat(pool.tvl)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-6 md:p-12 text-center">
              <Droplets className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No liquidity positions</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {isConnected 
                  ? "You don't have any liquidity positions yet."
                  : "Connect your wallet to view your liquidity positions."
                }
              </p>
              {isConnected && (
                <button 
                  onClick={() => setShowAddLiquidity(true)}
                  className="btn-primary"
                >
                  Add Your First Liquidity
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Liquidity Modal */}
      {showAddLiquidity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-4 md:p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-6">Add Liquidity</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token A
                </label>
                <select
                  value={tokenA}
                  onChange={(e) => setTokenA(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Token A</option>
                  {availableTokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount A
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountA}
                  onChange={(e) => setAmountA(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token B
                </label>
                <select
                  value={tokenB}
                  onChange={(e) => setTokenB(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select Token B</option>
                  {availableTokens.filter(token => token.address !== tokenA).map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount B
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={amountB}
                  onChange={(e) => setAmountB(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <strong>Important:</strong> Adding liquidity requires $3 USDT fee
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Make sure you have sufficient USDT balance and have approved the router contract
                </p>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddLiquidity(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLiquidity}
                  disabled={isAddingLiquidity}
                  className="flex-1 btn-primary"
                >
                  {isAddingLiquidity ? 'Adding...' : 'Add Liquidity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Pools
