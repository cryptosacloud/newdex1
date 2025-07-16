import React from 'react'
import Header from './Header'
import Navigation from './Navigation'
import TestnetModeToggle from '../TestnetModeToggle'

interface LayoutProps {
  children: React.ReactNode
  testnetMode: boolean
  setTestnetMode: (mode: boolean) => void
}

const Layout: React.FC<LayoutProps> = ({ children, testnetMode, setTestnetMode }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header testnetMode={testnetMode} />
      <div className="container mx-auto px-4 py-2 flex justify-end">
        <TestnetModeToggle 
          testnetMode={testnetMode} 
          setTestnetMode={setTestnetMode} 
        />
      </div>
      <Navigation testnetMode={testnetMode} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}

export default Layout