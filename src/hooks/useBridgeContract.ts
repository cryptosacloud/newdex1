import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getContractAddresses } from '../constants/contracts'
import BRIDGE_ABI from '../../abi/Bridge/BridgeCore.json'
import ERC20_ABI from '../../abi/Tokens/DexBridgeToken.json'

export interface BridgeTransaction {
  txId: string
  user: string
  token: string
  amount: string
  fee: string
  sourceChain: number
  targetChain: number
  targetAddress: string
  timestamp: number
  status: BridgeStatus
}

export enum BridgeStatus {
  Pending = 0,
  Locked = 1,
  Released = 2,
  Completed = 3,
  Failed = 4
}

export const useBridgeContract = () => {
  const { provider, chainId, account } = useWallet()
  const [bridgeContract, setBridgeContract] = useState<ethers.Contract | null>(null)

  useEffect(() => {
    if (!provider || !chainId) {
      setBridgeContract(null)
      return
    }

    const addresses = getContractAddresses(chainId)
    if (!addresses) {
      setBridgeContract(null)
      return
    }

    const loadContract = async () => {
      try {
        const signer = await provider.getSigner()
        const bridge = new ethers.Contract(addresses.bridge, BRIDGE_ABI, signer)
        setBridgeContract(bridge)
      } catch (error) {
        console.error('Error loading bridge contract:', error)
        setBridgeContract(null)
      }
    }

    loadContract()
  }, [provider, chainId])

  const lockTokens = async (
    tokenAddress: string,
    amount: string,
    targetChain: number,
    targetAddress: string = ''
  ) => {
    try {
      if (!bridgeContract || !account) throw new Error('Bridge contract not available')
      
      const destination = targetAddress || account
      
      // First approve the token
      const signer = await provider!.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)
      const amountWei = ethers.parseEther(amount)
      
      try {
        const bridgeAddress = await bridgeContract.getAddress()
        const allowance = await tokenContract.allowance(account, bridgeAddress)
        if (allowance < amountWei) {
          const approveTx = await tokenContract.approve(bridgeAddress, amountWei)
          await approveTx.wait()
        }
        
        const tx = await bridgeContract.lockTokens(
          tokenAddress,
          amountWei,
          targetChain,
          destination
        )
        
        return tx.wait()
      } catch (error) {
        console.error('Error in lockTokens:', error)
        throw error
      }
    } catch (error) {
      console.error('Bridge contract not available for lockTokens:', error)
      throw error
    }
  }

  const burnAndBridge = async (
    tokenAddress: string,
    amount: string,
    targetChain: number,
    targetAddress: string = ''
  ) => {
    try {
      if (!bridgeContract || !account) throw new Error('Bridge contract not available')
      
      const destination = targetAddress || account
      try {
        const tx = await bridgeContract.burnAndBridge(
          tokenAddress,
          ethers.parseEther(amount),
          targetChain,
          destination
        )
        
        return tx.wait()
      } catch (error) {
        console.error('Error in burnAndBridge:', error)
        throw error
      }
    } catch (error) {
      console.error('Bridge contract not available for burnAndBridge:', error)
      throw error
    }
  }

  const getTransaction = async (txId: string): Promise<BridgeTransaction> => {
    if (!bridgeContract) {
      console.warn('Bridge contract not available for getTransaction')
      return {
        txId,
        user: '',
        token: '',
        amount: '0',
        fee: '0',
        sourceChain: 0,
        targetChain: 0,
        targetAddress: '',
        timestamp: 0,
        status: BridgeStatus.Pending
      }
    }
    
    try {
      const tx = await bridgeContract.getTransaction(txId)
      return {
        txId: tx.txId || txId,
        user: tx.user || '',
        token: tx.token || '',
        amount: tx.amount ? ethers.formatEther(tx.amount) : '0',
        fee: tx.fee ? ethers.formatEther(tx.fee) : '0',
        sourceChain: tx.sourceChain ? Number(tx.sourceChain) : 0,
        targetChain: tx.targetChain ? Number(tx.targetChain) : 0,
        targetAddress: tx.targetAddress || '',
        timestamp: tx.timestamp ? Number(tx.timestamp) : 0,
        status: (tx.status || 0) as BridgeStatus
      }
    } catch (error) {
      console.error('Error getting transaction details:', error)
      return {
        txId,
        user: '',
        token: '',
        amount: '0',
        fee: '0',
        sourceChain: 0,
        targetChain: 0,
        targetAddress: '',
        timestamp: 0,
        status: BridgeStatus.Pending
      }
    }
  }

  const getUserTransactions = async (userAddress?: string): Promise<string[]> => {
    if (!bridgeContract) {
      console.warn('Bridge contract not available for getUserTransactions')
      return []
    }
    
    const address = userAddress || account
    if (!address) {
      return []
    }
    
    try {
      const txs = await bridgeContract.getUserTransactions(address)
      return txs || []
    } catch (error) {
      console.error('Error getting user transactions:', error)
      return []
    }
  }
  
  const getAllTransactions = async (): Promise<string[]> => {
    if (!bridgeContract) {
      console.warn('Bridge contract not available for getAllTransactions')
      return []
    }
    
    try {
      // Check if the function exists before calling it
      if (bridgeContract.getAllTransactions && typeof bridgeContract.getAllTransactions === 'function') {
        return await bridgeContract.getAllTransactions()
      } else {
        console.warn('getAllTransactions function not available on bridge contract')
        return []
      }
    } catch (error) {
      console.error('Error getting all transactions:', error)
      return []
    }
  }

  const estimateBridgeFee = async (tokenAddress: string, amount: string) => {
    if (!bridgeContract) throw new Error('Bridge contract not available')

    try {
      try {
        const tokenInfo = await bridgeContract.supportedTokens(tokenAddress)
        const amountBN = ethers.parseEther(amount)
        const feeBN = (amountBN * BigInt(tokenInfo.fee || 250)) / BigInt(10000)
        return ethers.formatEther(feeBN)
      } catch (error) {
        console.error('Error getting token info:', error)
        // Default to 2.5% fee if we can't get the actual fee
        return ethers.formatEther((ethers.parseEther(amount) * BigInt(250)) / BigInt(10000))
      }
    } catch (error) {
      console.error('Bridge contract not available for estimateBridgeFee:', error)
      return '0'
    }
  }

  const checkFeeRequirements = async (userAddress?: string) => {
    if (!bridgeContract) throw new Error('Bridge contract not available')
    
    const address = userAddress || account
    if (!address) throw new Error('No address provided')
    
    try {
      const requirements = await bridgeContract.checkFeeRequirements(address)
      return {
        hasBalance: requirements.hasBalance,
        hasAllowance: requirements.hasAllowance,
        balance: requirements.balance.toString(),
        allowance: requirements.allowance.toString()
      }
    } catch (error) {
      console.error('Error checking fee requirements:', error)
      return {
        hasBalance: false,
        hasAllowance: false,
        balance: '0',
        allowance: '0'
      }
    }
  }

  return {
    bridgeContract,
    lockTokens,
    burnAndBridge,
    getTransaction,
    getUserTransactions,
    getAllTransactions,
    estimateBridgeFee,
    checkFeeRequirements
  }
}
