import React, { useState } from 'react';
import { Settings as SettingsIcon, Network, Wallet, Shield } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import NetworkSettings from '../components/Settings/NetworkSettings';

const Settings = () => {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('networks');

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <SettingsIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Please connect your wallet to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center space-x-2 mb-8">
        <SettingsIcon className="w-8 h-8 text-primary-600" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('networks')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'networks'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Networks</span>
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'wallet'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Wallet</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security</span>
        </button>
      </div>

      {/* Content */}
      <div className="card p-6">
        {activeTab === 'networks' && <NetworkSettings />}
        
        {activeTab === 'wallet' && (
          <div className="text-center py-8">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Wallet Settings</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Wallet settings coming soon.
            </p>
          </div>
        )}
        
        {activeTab === 'security' && (
          <div className="text-center py-8">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Security Settings</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Security settings coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;