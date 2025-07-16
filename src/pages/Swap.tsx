import React, { useState, useEffect } from 'react'
import { ArrowUpDown, Settings, AlertCircle, X } from 'lucide-react'
import { Token } from '../constants/tokens'
import { useWallet } from '../contexts/WalletContext'
import { useDexContract } from '../hooks/useDexContract'
import TokenSelector from '../components/TokenSelector'
import TestnetBadge from '../components/TestnetBadge'

interface SwapProps {
  testnetMode: boolean;
}

const Swap: React.FC<SwapProps> = ({ testnetMode }) => {
  const { isConnected, account, chainId } = useWallet()
  const { 
    swapExactTokensForTokens, 
    getAmountsOut, 
    approveToken, 
    getTokenAllowance,
    checkFeeRequirements,
    contracts 
  } = useDexContract()
  
  const [fromToken, setFromToken] = useState<Token | null>(null)
  const [toToken, setToToken] = useState<Token | null>(null)
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [isSwapping, setIsSwapping] = useState(false)
  const [priceImpact, setPriceImpact] = useState('0')
  const [needsApproval, setNeedsApproval] = useState(false)
  const [feeWarning, setFeeWarning] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [tempSlippage, setTempSlippage] = useState(slippage)

  const calculateOutputAmount = async () => {
    if (!fromToken || !toToken || !fromAmount || !contracts.router) return
    
    try {
      const path = [fromToken.address, toToken.address]
      const amounts = await getAmountsOut(fromAmount, path)
      setToAmount(amounts[1])
      
      // Calculate price impact (simplified)
      const impact = Math.abs((parseFloat(amounts[0]) - parseFloat(amounts[1])) / parseFloat(amounts[0]) * 100)
      setPriceImpact(impact.toFixed(2))
    } catch (error) {
      console.error('Error calculating output amount:', error)
      setToAmount('0')
    }
  }

  const checkApproval = async () => {
    if (!fromToken || !fromAmount || !contracts.router || !account) return
    
    try {
      const allowance = await getTokenAllowance(fromToken.address, contracts.router.target as string)
      setNeedsApproval(parseFloat(allowance) < parseFloat(fromAmount))
    } catch (error) {
      console.error('Error checking approval:', error)
      setNeedsApproval(true)
    }
  }

  const checkUSDTFeeRequirements = async () => {
    if (!account) return
    
    try {
      const feeStatus = await checkFeeRequirements(account)
      if (!feeStatus.hasBalance || !feeStatus.hasAllowance) {
        setFeeWarning('You need $3 USDT balance and approval for swap fees')
      } else {
        setFeeWarning('')
      }
    } catch (error) {
      setFeeWarning('Unable to verify USDT fee requirements')
    }
  }

  useEffect(() => {
    if (fromToken && toToken && fromAmount) {
      calculateOutputAmount()
      checkApproval()
      checkUSDTFeeRequirements()
    }
  }, [fromToken, toToken, fromAmount, account])

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleApprove = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    
    if (!fromToken || !contracts.router) return
    
    try {
      setIsSwapping(true)
      await approveToken(fromToken.address, contracts.router.target as string, fromAmount)
      setNeedsApproval(false)
    } catch (error) {
      console.error('Approval failed:', error)
      alert('Approval failed. Please try again.')
    } finally {
      setIsSwapping(false)
    }
  }

  const handleSwap = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first')
      return
    }
    
    if (!fromToken || !toToken || !fromAmount || !toAmount) {
      alert('Please select tokens and enter amounts')
      return
    }
    
    try {
      setIsSwapping(true)
      const path = [fromToken.address, toToken.address]
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes
      const minAmountOut = (parseFloat(toAmount) * (100 - parseFloat(slippage)) / 100).toString()
      
      await swapExactTokensForTokens(fromAmount, minAmountOut, path, deadline)
      
      alert('Swap successful!')
      setFromAmount('')
      setToAmount('')
    } catch (error) {
      console.error('Swap failed:', error)
      alert('Swap failed. Please try again.')
    } finally {
      setIsSwapping(false)
    }
  }

  const handleSaveSettings = () => {
    setSlippage(tempSlippage)
    setShowSettings(false)
  }

  const handleCancelSettings = () => {
    setTempSlippage(slippage)
    setShowSettings(false)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Swap</h2>
          <div className="flex items-center space-x-2">
            <TestnetBadge />
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <TokenSelector
              selectedToken={fromToken}
              onTokenSelect={setFromToken}
              label="From"
            />
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="input-field text-right text-2xl font-semibold"
            />
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <TokenSelector
              selectedToken={toToken}
              onTokenSelect={setToToken}
              label="To"
            />
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              onChange={(e) => setToAmount(e.target.value)}
              className="input-field text-right text-2xl font-semibold"
              readOnly
            />
          </div>

          {/* Transaction Details */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Slippage Tolerance</span>
              <span className="font-medium">{slippage}%</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600 dark:text-gray-400">Swap Fee</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">$3 USDT</span>
            </div>
            {parseFloat(priceImpact) > 5 && (
              <div className="flex items-center space-x-2 text-sm text-orange-600 dark:text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span>High price impact: {priceImpact}%</span>
              </div>
            )}
            {feeWarning && (
              <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{feeWarning}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {needsApproval && isConnected ? (
            <button
              onClick={handleApprove}
              disabled={isSwapping || !fromToken}
              className="w-full btn-primary py-4 text-lg font-semibold"
            >
              {isSwapping ? 'Approving...' : `Approve ${fromToken?.symbol}`}
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!fromToken || !toToken || !fromAmount || !isConnected || isSwapping || !!feeWarning}
              className="w-full btn-primary py-4 text-lg font-semibold"
            >
              {!isConnected ? 'Connect Wallet' : isSwapping ? 'Swapping...' : 'Swap'}
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Swap Settings</h3>
              <button
                onClick={handleCancelSettings}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Slippage Tolerance
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['0.1', '0.5', '1.0'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTempSlippage(preset)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        tempSlippage === preset
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Custom"
                    value={tempSlippage}
                    onChange={(e) => setTempSlippage(e.target.value)}
                    className="input-field pr-8"
                    step="0.1"
                    min="0.1"
                    max="50"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    %
                  </span>
                </div>
                {parseFloat(tempSlippage) > 5 && (
                  <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                    High slippage tolerance may result in unfavorable trades
                  </p>
                )}
                {parseFloat(tempSlippage) < 0.1 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Very low slippage may cause transaction failures
                  </p>
                )}
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Transaction Fee</span>
                  <span className="font-medium text-orange-600 dark:text-orange-400">$3 USDT</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This fee is required for all swaps and goes to ESR stakers
                </p>
              </div>
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleCancelSettings}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 btn-primary"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Swap
