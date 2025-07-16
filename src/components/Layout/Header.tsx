import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useWallet } from '../../contexts/WalletContext'
import { isTestnetChain } from '../../constants/chainConfig'
import WalletButton from '../Wallet/WalletButton'
import ChainSelector from '../Wallet/ChainSelector'
import NetworkStatus from '../NetworkStatus'

interface HeaderProps {
  testnetMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ testnetMode }) => {
  const { theme, toggleTheme } = useTheme()
  const { isConnected, chainId } = useWallet()
  const currentIsTestnet = chainId ? isTestnetChain(chainId) : false;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">DB</span>
            </div>
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                DexBridge
              </h1>
              {testnetMode && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                  Testnet Mode
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isConnected && (
              <>
                <NetworkStatus />
                <ChainSelector />
              </>
            )}
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header