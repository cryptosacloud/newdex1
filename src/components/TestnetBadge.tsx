import React from 'react'
import { useWallet } from '../contexts/WalletContext'
import { isTestnet } from '../constants/chains'

interface TestnetBadgeProps {
  className?: string;
}

const TestnetBadge: React.FC<TestnetBadgeProps> = ({ className = '' }) => {
  const { chainId } = useWallet()
  
  if (!chainId || !isTestnet(chainId)) {
    return null
  }
  
  return (
    <span className={`text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full ${className}`}>
      Testnet
    </span>
  )
}

export default TestnetBadge