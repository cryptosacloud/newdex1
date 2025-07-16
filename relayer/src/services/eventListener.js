import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, BRIDGE_ABI, getChainConfig } from '../config/chains.js';
import database from '../database/db.js';
import logger from '../utils/logger.js';
import { sendAlert } from '../utils/alerts.js';

class EventListener {
  constructor() {
    this.providers = new Map();
    this.contracts = new Map();
    this.isListening = false;
    this.listeners = new Map();
  }

  async initialize() {
    try {
      // Initialize providers and contracts for each chain
      for (const [chainId, config] of Object.entries(SUPPORTED_CHAINS)) {
        if (!config.rpcUrl || !config.bridgeAddress) {
          logger.warn(`Skipping chain ${chainId}: Missing RPC URL or bridge address`);
          continue;
        }

        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const contract = new ethers.Contract(config.bridgeAddress, BRIDGE_ABI, provider);

        this.providers.set(parseInt(chainId), provider);
        this.contracts.set(parseInt(chainId), contract);

        logger.info(`Initialized provider for ${config.name} (Chain ID: ${chainId})`);
      }

      logger.info('Event listener initialized successfully');
    } catch (error) {
      logger.error('Event listener initialization failed:', error);
      throw error;
    }
  }

  async startListening() {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    this.isListening = true;
    logger.info('Starting event listeners for all chains...');

    for (const [chainId, contract] of this.contracts) {
      await this.startChainListener(chainId, contract);
    }

    // Also start historical event processing
    this.startHistoricalProcessing();
  }

  async startChainListener(chainId, contract) {
    const config = getChainConfig(chainId);
    
    try {
      // Listen for TokenLocked events
      const lockedListener = contract.on('TokenLocked', async (txId, user, token, amount, targetChain, targetAddress, event) => {
        await this.handleBridgeEvent({
          txId,
          eventType: 'TokenLocked',
          sourceChain: chainId,
          targetChain: Number(targetChain),
          userAddress: user,
          tokenAddress: token,
          amount: amount.toString(),
          targetAddress,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      // Listen for TokenBurned events
      const burnedListener = contract.on('TokenBurned', async (txId, user, token, amount, event) => {
        // Get transaction details to find target chain
        const tx = await contract.getTransaction(txId);
        
        await this.handleBridgeEvent({
          txId,
          eventType: 'TokenBurned',
          sourceChain: chainId,
          targetChain: tx.targetChain,
          userAddress: user,
          tokenAddress: token,
          amount: amount.toString(),
          targetAddress: tx.targetAddress,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        });
      });

      this.listeners.set(`${chainId}-locked`, lockedListener);
      this.listeners.set(`${chainId}-burned`, burnedListener);

      logger.info(`Started event listeners for ${config.name} (Chain ID: ${chainId})`);
    } catch (error) {
      logger.error(`Failed to start listener for chain ${chainId}:`, error);
    }
  }

  async handleBridgeEvent(eventData) {
    try {
      logger.info(`New bridge event detected: ${eventData.eventType} - ${eventData.txId}`);

      // Check if event already processed
      const isProcessed = await database.isEventProcessed(eventData.txId);
      if (isProcessed) {
        logger.info(`Event already processed: ${eventData.txId}`);
        return;
      }

      // Get current block number for confirmation calculation
      const provider = this.providers.get(eventData.sourceChain);
      const currentBlock = await provider.getBlockNumber();
      const confirmations = Math.max(0, currentBlock - eventData.blockNumber);

      eventData.confirmations = confirmations;

      // Save event to database
      await database.saveBridgeEvent(eventData);

      // Send alert for new bridge event
      await sendAlert({
        type: 'new_bridge_event',
        message: `New ${eventData.eventType} event detected`,
        data: eventData
      });

      logger.info(`Bridge event saved: ${eventData.txId} (${confirmations} confirmations)`);
    } catch (error) {
      logger.error(`Error handling bridge event ${eventData.txId}:`, error);
    }
  }

  async startHistoricalProcessing() {
    // Process historical events every 30 seconds
    setInterval(async () => {
      if (!this.isListening) return;

      try {
        await this.processHistoricalEvents();
      } catch (error) {
        logger.error('Error in historical event processing:', error);
      }
    }, 30000);
  }

  async processHistoricalEvents() {
    for (const [chainId, contract] of this.contracts) {
      try {
        const config = getChainConfig(chainId);
        const provider = this.providers.get(chainId);
        
        const currentBlock = await provider.getBlockNumber();
        const lastProcessedBlock = await database.getLastProcessedBlock(chainId);
        
        // Process blocks in chunks to avoid RPC limits
        const fromBlock = Math.max(lastProcessedBlock + 1, currentBlock - 1000);
        const toBlock = currentBlock - config.minConfirmations;

        if (fromBlock > toBlock) {
          continue; // No new blocks to process
        }

        logger.debug(`Processing historical events for ${config.name}: blocks ${fromBlock} to ${toBlock}`);

        // Get TokenLocked events
        const lockedEvents = await contract.queryFilter('TokenLocked', fromBlock, toBlock);
        for (const event of lockedEvents) {
          await this.handleHistoricalEvent(chainId, event, 'TokenLocked');
        }

        // Get TokenBurned events
        const burnedEvents = await contract.queryFilter('TokenBurned', fromBlock, toBlock);
        for (const event of burnedEvents) {
          await this.handleHistoricalEvent(chainId, event, 'TokenBurned');
        }

        // Update last processed block
        await database.saveProcessedBlock(chainId, toBlock);

      } catch (error) {
        logger.error(`Error processing historical events for chain ${chainId}:`, error);
      }
    }
  }

  async handleHistoricalEvent(chainId, event, eventType) {
    try {
      const args = event.args;
      let eventData;

      if (eventType === 'TokenLocked') {
        eventData = {
          txId: args.txId,
          eventType: 'TokenLocked',
          sourceChain: chainId,
          targetChain: Number(args.targetChain),
          userAddress: args.user,
          tokenAddress: args.token,
          amount: args.amount.toString(),
          targetAddress: args.targetAddress,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
      } else if (eventType === 'TokenBurned') {
        // Get transaction details for target chain info
        const contract = this.contracts.get(chainId);
        const tx = await contract.getTransaction(args.txId);
        
        eventData = {
          txId: args.txId,
          eventType: 'TokenBurned',
          sourceChain: chainId,
          targetChain: tx.targetChain,
          userAddress: args.user,
          tokenAddress: args.token,
          amount: args.amount.toString(),
          targetAddress: tx.targetAddress,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
      }

      // Check if already processed
      const isProcessed = await database.isEventProcessed(eventData.txId);
      if (!isProcessed) {
        const provider = this.providers.get(chainId);
        const currentBlock = await provider.getBlockNumber();
        eventData.confirmations = Math.max(0, currentBlock - event.blockNumber);
        
        await database.saveBridgeEvent(eventData);
        logger.info(`Historical event processed: ${eventData.txId}`);
      }
    } catch (error) {
      logger.error(`Error handling historical event:`, error);
    }
  }

  async stopListening() {
    this.isListening = false;
    
    // Remove all event listeners
    for (const [key, listener] of this.listeners) {
      try {
        const [chainId, eventType] = key.split('-');
        const contract = this.contracts.get(parseInt(chainId));
        if (contract && listener) {
          contract.off(eventType === 'locked' ? 'TokenLocked' : 'TokenBurned', listener);
        }
      } catch (error) {
        logger.error(`Error removing listener ${key}:`, error);
      }
    }

    this.listeners.clear();
    logger.info('Event listeners stopped');
  }

  getStatus() {
    return {
      isListening: this.isListening,
      connectedChains: Array.from(this.providers.keys()),
      activeListeners: this.listeners.size
    };
  }
}

export default new EventListener();