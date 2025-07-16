import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, BRIDGE_ABI, getChainConfig } from '../config/chains.js';
import database from '../database/db.js';
import logger from '../utils/logger.js';
import { sendAlert } from '../utils/alerts.js';

class TransactionProcessor {
  constructor() {
    this.providers = new Map();
    this.contracts = new Map();
    this.wallet = null;
    this.isProcessing = false;
    this.processingInterval = null;
  }

  async initialize() {
    try {
      // Initialize relayer wallet
      const privateKey = process.env.RELAYER_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('RELAYER_PRIVATE_KEY not found in environment variables');
      }

      this.wallet = new ethers.Wallet(privateKey);
      logger.info(`Relayer wallet initialized: ${this.wallet.address}`);

      // Initialize providers and contracts for each chain
      for (const [chainId, config] of Object.entries(SUPPORTED_CHAINS)) {
        if (!config.rpcUrl || !config.bridgeAddress) {
          logger.warn(`Skipping chain ${chainId}: Missing RPC URL or bridge address`);
          continue;
        }

        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const walletWithProvider = this.wallet.connect(provider);
        const contract = new ethers.Contract(config.bridgeAddress, BRIDGE_ABI, walletWithProvider);

        this.providers.set(parseInt(chainId), provider);
        this.contracts.set(parseInt(chainId), contract);

        // Verify relayer is authorized
        try {
          const isAuthorized = await contract.relayers(this.wallet.address);
          if (!isAuthorized) {
            logger.warn(`Relayer not authorized on ${config.name} (Chain ID: ${chainId})`);
          } else {
            logger.info(`Relayer authorized on ${config.name} (Chain ID: ${chainId})`);
          }
        } catch (error) {
          logger.warn(`Could not verify relayer authorization on chain ${chainId}:`, error.message);
        }
      }

      logger.info('Transaction processor initialized successfully');
    } catch (error) {
      logger.error('Transaction processor initialization failed:', error);
      throw error;
    }
  }

  async startProcessing() {
    if (this.isProcessing) {
      logger.warn('Transaction processor is already running');
      return;
    }

    this.isProcessing = true;
    logger.info('Starting transaction processor...');

    // Process pending transactions every 30 seconds
    this.processingInterval = setInterval(async () => {
      try {
        await this.processPendingTransactions();
      } catch (error) {
        logger.error('Error in transaction processing cycle:', error);
      }
    }, parseInt(process.env.PROCESSING_INTERVAL_MS) || 30000);

    // Run initial processing
    await this.processPendingTransactions();
  }

  async processPendingTransactions() {
    try {
      const pendingEvents = await database.getPendingEvents();
      
      if (pendingEvents.length === 0) {
        logger.debug('No pending transactions to process');
        return;
      }

      logger.info(`Processing ${pendingEvents.length} pending transactions`);

      for (const event of pendingEvents) {
        await this.processEvent(event);
        
        // Add small delay between transactions to avoid nonce issues
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error('Error processing pending transactions:', error);
    }
  }

  async processEvent(event) {
    try {
      logger.info(`Processing event: ${event.tx_id} (${event.event_type})`);

      // Update confirmations
      await this.updateEventConfirmations(event);

      // Check if event has enough confirmations
      const targetConfig = getChainConfig(event.target_chain);
      if (event.confirmations < targetConfig.minConfirmations) {
        logger.debug(`Event ${event.tx_id} needs more confirmations: ${event.confirmations}/${targetConfig.minConfirmations}`);
        return;
      }

      // Check if event is already confirmed but not relayed
      if (event.status === 'pending') {
        await database.updateEventStatus(event.tx_id, 'confirmed');
        event.status = 'confirmed';
      }

      // Process confirmed events
      if (event.status === 'confirmed') {
        await this.relayTransaction(event);
      }

    } catch (error) {
      logger.error(`Error processing event ${event.tx_id}:`, error);
      await database.updateEventStatus(event.tx_id, 'failed', null, error.message);
      
      await sendAlert({
        type: 'processing_error',
        message: `Failed to process event ${event.tx_id}`,
        error: error.message,
        data: event
      });
    }
  }

  async updateEventConfirmations(event) {
    try {
      const sourceProvider = this.providers.get(event.source_chain);
      if (!sourceProvider) {
        throw new Error(`No provider for source chain ${event.source_chain}`);
      }

      const currentBlock = await sourceProvider.getBlockNumber();
      const confirmations = Math.max(0, currentBlock - event.block_number);

      if (confirmations !== event.confirmations) {
        await database.updateEventConfirmations(event.tx_id, confirmations);
        event.confirmations = confirmations;
      }
    } catch (error) {
      logger.error(`Error updating confirmations for ${event.tx_id}:`, error);
    }
  }

  async relayTransaction(event) {
    try {
      logger.info(`Relaying transaction: ${event.tx_id} from chain ${event.source_chain} to ${event.target_chain}`);

      const targetContract = this.contracts.get(event.target_chain);
      if (!targetContract) {
        throw new Error(`No contract for target chain ${event.target_chain}`);
      }

      const targetConfig = getChainConfig(event.target_chain);

      // Check gas price
      const provider = this.providers.get(event.target_chain);
      const gasPrice = await provider.getFeeData();
      const maxGasPriceWei = ethers.parseUnits(targetConfig.maxGasPrice, 'gwei');

      if (gasPrice.gasPrice > maxGasPriceWei) {
        logger.warn(`Gas price too high on chain ${event.target_chain}: ${ethers.formatUnits(gasPrice.gasPrice, 'gwei')} gwei`);
        return;
      }

      // Prepare transaction
      const txOptions = {
        gasLimit: targetConfig.gasLimit,
        gasPrice: gasPrice.gasPrice
      };

      // Execute relay transaction
      let tx;
      if (event.event_type === 'TokenLocked' || event.event_type === 'TokenBurned') {
        tx = await targetContract.releaseTokens(event.tx_id, txOptions);
      } else {
        throw new Error(`Unknown event type: ${event.event_type}`);
      }

      logger.info(`Relay transaction submitted: ${tx.hash} for event ${event.tx_id}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        await database.updateEventStatus(event.tx_id, 'completed', tx.hash);
        
        logger.info(`Successfully relayed transaction: ${event.tx_id} -> ${tx.hash}`);
        
        await sendAlert({
          type: 'successful_relay',
          message: `Successfully relayed transaction ${event.tx_id}`,
          data: {
            ...event,
            relayTxHash: tx.hash,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: gasPrice.gasPrice.toString()
          }
        });
      } else {
        throw new Error('Transaction failed');
      }

    } catch (error) {
      logger.error(`Failed to relay transaction ${event.tx_id}:`, error);
      
      // Check if it's a known error that should be retried
      const retryableErrors = [
        'network error',
        'timeout',
        'nonce too low',
        'replacement transaction underpriced'
      ];

      const shouldRetry = retryableErrors.some(err => 
        error.message.toLowerCase().includes(err)
      );

      if (shouldRetry) {
        logger.info(`Retryable error for ${event.tx_id}, will retry later`);
        return; // Don't mark as failed, will retry
      }

      await database.updateEventStatus(event.tx_id, 'failed', null, error.message);
      
      await sendAlert({
        type: 'relay_failed',
        message: `Failed to relay transaction ${event.tx_id}`,
        error: error.message,
        data: event
      });
    }
  }

  async stopProcessing() {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Transaction processor stopped');
  }

  async getRelayerBalance(chainId) {
    try {
      const provider = this.providers.get(chainId);
      if (!provider) {
        throw new Error(`No provider for chain ${chainId}`);
      }

      const balance = await provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      logger.error(`Error getting relayer balance for chain ${chainId}:`, error);
      return '0';
    }
  }

  async getAllBalances() {
    const balances = {};
    
    for (const chainId of this.providers.keys()) {
      const config = getChainConfig(chainId);
      balances[chainId] = {
        name: config.name,
        balance: await this.getRelayerBalance(chainId)
      };
    }

    return balances;
  }

  getStatus() {
    return {
      isProcessing: this.isProcessing,
      relayerAddress: this.wallet?.address,
      connectedChains: Array.from(this.providers.keys()),
      processingInterval: this.processingInterval ? 'active' : 'inactive'
    };
  }
}

export default new TransactionProcessor();