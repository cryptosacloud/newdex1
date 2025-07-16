import React, { useState, useEffect } from 'react'
import { Grid as BridgeIcon, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { CHAIN_CONFIG, isTestnetChain } from '../constants/chainConfig'
import { useWallet } from '../contexts/WalletContext'
import { useBridgeContract } from '../hooks/useBridgeContract'
import { getTokensByChain } from '../constants/tokens'

interface BridgeProps {
  testnetMode: boolean;
}

const Bridge: React.FC<BridgeProps> = ({ testnetMode }) => {
  const { isConnected, account, chainId } = useWallet()
  const { lockTokens, burnAndBridge, getUserTransactions, estimateBridgeFee, checkFeeRequirements, getAllTransactions } = useBridgeContract()
  
  // Get chains based on testnet mode
  const availableChains = Object.entries(CHAIN_CONFIG)
    .filter(([_, config]) => config.isTestnet === testnetMode)
    .map(([id, config]) => ({
      id: parseInt(id),
      name: config.chainName,
      symbol: config.nativeCurrency.symbol,
      icon: getChainIcon(parseInt(id))
    }));
  
  const [fromChain, setFromChain] = useState(availableChains[0] || { id: 1, name: 'Ethereum', symbol: 'ETH', icon: '⟠' })
  const [toChain, setToChain] = useState(availableChains[1] || { id: 56, name: 'BSC', symbol: 'BNB', icon: '🟡' })
  const [amount, setAmount] = useState('')
  const [destinationAddress, setDestinationAddress] = useState('')
  const [selectedToken, setSelectedToken] = useState('')
  const [bridgeFee, setBridgeFee] = useState('0')
  const [isBridging, setIsBridging] = useState(false)
  const [userTransactions, setUserTransactions] = useState<string[]>([])
  const [feeWarning, setFeeWarning] = useState('')

  // Get available tokens for current chain
  const availableTokens = chainId ? getTokensByChain(chainId) : []

  // Helper function to get chain icon
  function getChainIcon(chainId: number) {
    const icons: Record<number, string> = {
      1: '⟠', // Ethereum
      5: '⟠', // Goerli
      56: '🟡', // BSC
      97: '🟡', // BSC Testnet
      137: '🟣', // Polygon
      80001: '🟣', // Mumbai
      42161: '🔵', // Arbitrum
      43114: '🔺', // Avalanche
      43113: '🔺', // Fuji
      250: '👻', // Fantom
      4002: '👻', // Fantom Testnet
      2612: '🟢', // ESR Mainnet
      25062019: '🟢', // ESR Testnet
    };
    return icons[chainId] || '🔗';
  }

  const currentChainIsTestnet = chainId ? isTestnetChain(chainId) : false;

  useEffect(() => {
    if (amount && selectedToken) {
      estimateFee()
    }
  }, [amount, selectedToken])

  useEffect(() => {
    if (account) {
      checkUSDTFeeRequirements()
      loadUserTransactions()
    }
  }, [account])

  const checkUSDTFeeRequirements = async () => {
    if (!account) return
    
    try {
      const feeStatus = await checkFeeRequirements(account)
      if (!feeStatus.hasBalance || !feeStatus.hasAllowance) {
        setFeeWarning('You need $3 USDT balance and approval for bridge fees')
      } else {
        setFeeWarning('')
      }
    } catch (error) {
      setFeeWarning('Unable to verify USDT fee requirements')
    }
  }

  const estimateFee = async () => {
    if (!selectedToken || !amount) return
    
    try {
      const fee = await estimateBridgeFee(selectedToken, amount)
      setBridgeFee(fee)
    } catch (error) {
      console.error('Error estimating fee:', error)
      setBridgeFee('0')
    }
  }

  const loadUserTransactions = async () => {
    if (!account) return
    
    try {
      const txs = await getUserTransactions(account)
      setUserTransactions(txs)
    } catch (error) {
      console.error('Error loading transactions:', error)
    }
  }

  const handleBridge = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!selectedToken) {
      alert('Please select a token')
      return
    }
    
    try {
      setIsBridging(true)
      const destination = destinationAddress || account!
      
      // Check if we need to lock or burn tokens based on token origin
      const token = availableTokens.find(t => t.address === selectedToken)
      const isNativeToken = token?.chainId === chainId
      
      if (isNativeToken) {
        // Lock tokens on source chain
        await lockTokens(selectedToken, amount, toChain.id, destination)
      } else {
        // Burn wrapped tokens
        await burnAndBridge(selectedToken, amount, toChain.id, destination)
      }
      
      alert('Bridge transaction initiated! Please wait for confirmation on the destination chain.')
      setAmount('')
      setDestinationAddress('')
      loadUserTransactions()
    } catch (error) {
      console.error('Bridge failed:', error)
      alert('Bridge transaction failed. Please try again.')
    } finally {
      setIsBridging(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-2 mb-6">
          <BridgeIcon className="w-6 h-6" />
          <h2 className="text-xl font-bold">Cross-Chain Bridge</h2>
        </div>

        <div className="space-y-6">
          {/* Chain Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                From
              </label>
              <select
                value={fromChain.id}
                onChange={(e) => setFromChain(availableChains.find(c => c.id === Number(e.target.value))!)}
                className="input-field"
              >
                {availableChains.map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-6 h-6 text-gray-400" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To
              </label>
              <select
                value={toChain.id}
                onChange={(e) => setToChain(availableChains.find(c => c.id === Number(e.target.value))!)}
                className="input-field"
              >
                {availableChains.filter(c => c.id !== fromChain.id).map((chain) => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="input-field mb-4"
            >
              <option value="">Select a token</option>
              {availableTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - {token.name}
                </option>
              ))}
            </select>
            
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount
            </label>
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-field text-right text-xl font-semibold"
            />
          </div>

          {/* Destination Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Destination Address (Optional)
            </label>
            <input
              type="text"
              placeholder="0x... (leave empty to use connected wallet)"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Bridge Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Bridge Fee</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">$3 USDT</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Token Fee</span>
              <span className="font-medium">{bridgeFee} tokens</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Estimated Time</span>
              <span className="font-medium">
                {fromChain.id === 43114 || toChain.id === 43114 ? '2-5 minutes' : 
                 fromChain.id === 250 || toChain.id === 250 ? '1-3 minutes' : '5-10 minutes'}
              </span>
            </div>
            {parseFloat(bridgeFee) > parseFloat(amount) * 0.1 && (
              <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>High bridge fee relative to amount</span>
              </div>
            )}
            {feeWarning && (
              <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{feeWarning}</span>
              </div>
            )}
          </div>

          {/* Bridge Button */}
          <button
            onClick={handleBridge}
            disabled={!amount || !selectedToken || !isConnected || isBridging || !!feeWarning}
            className="w-full btn-primary py-4 text-lg font-semibold"
          >
            {!isConnected ? 'Connect Wallet' : isBridging ? 'Bridging...' : 'Bridge Tokens'}
          </button>
        </div>
      </div>

      {/* Bridge History */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Bridge History</h3>
        <div className="space-y-3">
          {userTransactions.length > 0 ? (
            userTransactions.slice(0, 5).map((txId) => (
              <div key={txId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div>
                    <p className="font-medium text-sm">{txId.slice(0, 10)}...</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Bridge Transaction
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Processing
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <BridgeIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No bridge transactions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Bridge
