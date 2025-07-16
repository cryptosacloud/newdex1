import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowLeftRight, Droplets, Grid as Bridge, BarChart3, Gift, Sprout, Shield, Menu, X } from 'lucide-react'
import { useWallet } from '../../contexts/WalletContext'
import { isTestnetChain } from '../../constants/chainConfig'

interface NavigationProps {
  testnetMode: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ testnetMode }) => {
  const { account } = useWallet()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const navItems = [
    { path: '/', label: 'Swap', icon: ArrowLeftRight },
    { path: '/pools', label: 'Pools', icon: Droplets },
    { path: '/bridge', label: 'Bridge', icon: Bridge },
    { path: '/stake', label: 'Stake', icon: Gift },
    { path: '/farm', label: 'Farm', icon: Sprout },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]

  // Mock admin check - replace with actual owner verification
  const isAdmin = account === '0x...' // Replace with actual admin check
  
  // Add testnet indicator to navigation items when in testnet mode
  const navItemsWithMode = navItems.map(item => ({
    ...item,
    label: testnetMode ? `${item.label} ${item === 'Bridge' ? '(Testnet)' : ''}` : item.label
  }));

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        {/* Mobile menu button */}
        <div className="flex md:hidden items-center justify-between py-4">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-bold">DexBridge</span>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex justify-center">
          <div className="flex space-x-6">
            {navItemsWithMode.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
            
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                <Shield className="w-4 h-4" />
                <span className="font-medium">Admin</span>
              </NavLink>
            )}
          </div>
        </div>
        
        {/* Mobile navigation menu */}
        {isMenuOpen && (
          <div className="md:hidden py-2 space-y-1">
            {navItemsWithMode.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 py-3 px-4 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
            
            {isAdmin && (
              <NavLink
                to="/admin"
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 py-3 px-4 rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </NavLink>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navigation