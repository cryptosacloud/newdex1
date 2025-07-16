import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallet } from '../contexts/WalletContext'
import { getContractAddresses } from '../constants/contracts'

// Import ABIs
import FACTORY_ABI from '../../abi/DEX/Factory.json'
import ROUTER_ABI from '../../abi/DEX/Router.json'
import ERC20_ABI from '../../abi/Tokens/DexBridgeToken.json'

export const useDexContract = () => {
  const { provider, chainId, account } = useWallet()
  const [contracts, setContracts] = useState<{
    factory: ethers.Contract | null
    router: ethers.Contract | null
  }>({ factory: null, router: null })

  useEffect(() => {
    const initializeContracts = async () => {
      try {
        if (!provider || !chainId) {
          setContracts({ factory: null, router: null })
          return
        }

        const addresses = getContractAddresses(chainId)
        if (!addresses) {
          setContracts({ factory: null, router: null })
          return
        }

        const signer = await provider.getSigner()
        
        const factory = new ethers.Contract(addresses.factory, FACTORY_ABI, signer)
        const router = new ethers.Contract(addresses.router, ROUTER_ABI, signer)

        setContracts({ factory, router })
      } catch (error) {
        console.error('Error initializing contracts:', error)
        setContracts({ factory: null, router: null })
      }
    }

    initializeContracts()
  }, [provider, chainId])

  const getTokenContract = async (tokenAddress: string) => {
    if (!provider) return null
    const signer = await provider.getSigner()
    return new ethers.Contract(tokenAddress, ERC20_ABI, signer)
  }

  const swapExactTokensForTokens = async (
    amountIn: string,
    amountOutMin: string,
    path: string[],
    deadline: number
  ) => {
    if (!contracts.router || !account) throw new Error('Router not available')
    
    const tx = await contracts.router.swapExactTokensForTokens(
      ethers.parseEther(amountIn),
      ethers.parseEther(amountOutMin),
      path,
      account,
      deadline
    )
    
    return tx.wait()
  }

  const addLiquidity = async (
    tokenA: string,
    tokenB: string,
    amountADesired: string,
    amountBDesired: string,
    amountAMin: string,
    amountBMin: string,
    deadline: number
  ) => {
    if (!contracts.router || !account) throw new Error('Router not available')
    
    const tx = await contracts.router.addLiquidity(
      tokenA,
      tokenB,
      ethers.parseEther(amountADesired),
      ethers.parseEther(amountBDesired),
      ethers.parseEther(amountAMin),
      ethers.parseEther(amountBMin),
      account,
      deadline
    )
    
    return tx.wait()
  }

  const getAmountsOut = async (amountIn: string, path: string[]) => {
    if (!contracts.router) throw new Error('Router not available')
    
    const amounts = await contracts.router.getAmountsOut(
      ethers.parseEther(amountIn),
      path
    )
    
    return amounts.map((amount: bigint) => ethers.formatEther(amount))
  }

  const getPairAddress = async (tokenA: string, tokenB: string) => {
    if (!contracts.factory) throw new Error('Factory not available')
    
    return await contracts.factory.getPair(tokenA, tokenB)
  }

  const createPair = async (tokenA: string, tokenB: string) => {
    if (!contracts.factory) throw new Error('Factory not available')
    
    const tx = await contracts.factory.createPair(tokenA, tokenB)
    return tx.wait()
  }

  const getTokenBalance = async (tokenAddress: string, userAddress?: string) => {
    const token = await getTokenContract(tokenAddress)
    if (!token) throw new Error('Token contract not available')
    
    const address = userAddress || account
    if (!address) throw new Error('No address provided')
    
    const balance = await token.balanceOf(address)
    return ethers.formatEther(balance)
  }

  const approveToken = async (tokenAddress: string, spenderAddress: string, amount: string) => {
    const token = await getTokenContract(tokenAddress)
    if (!token) throw new Error('Token contract not available')
    
    const tx = await token.approve(spenderAddress, ethers.parseEther(amount))
    return tx.wait()
  }

  const getTokenAllowance = async (tokenAddress: string, spenderAddress: string) => {
    const token = await getTokenContract(tokenAddress)
    if (!token || !account) throw new Error('Token contract or account not available')
    
    const allowance = await token.allowance(account, spenderAddress)
    return ethers.formatEther(allowance)
  }

  const checkFeeRequirements = async (userAddress?: string) => {
    if (!contracts.router) throw new Error('Router not available')
    
    const address = userAddress || account
    if (!address) throw new Error('No address provided')
    
    try {
      const requirements = await contracts.router.checkFeeRequirements(address)
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
    contracts,
    getTokenContract,
    swapExactTokensForTokens,
    addLiquidity,
    getAmountsOut,
    getPairAddress,
    createPair,
    getTokenBalance,
    approveToken,
    getTokenAllowance,
    checkFeeRequirements
  }
}
