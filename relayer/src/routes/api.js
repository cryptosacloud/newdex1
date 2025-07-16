import express from 'express';
import rateLimit from 'express-rate-limit';
import database from '../database/db.js';
import eventListener from '../services/eventListener.js';
import transactionProcessor from '../services/transactionProcessor.js';
import { SUPPORTED_CHAINS } from '../config/chains.js';

const router = express.Router();

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.use(apiLimiter);

// Health check endpoint
router.get('/health', (req, res) => {
  const listenerStatus = eventListener.getStatus();
  const processorStatus = transactionProcessor.getStatus();

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      eventListener: listenerStatus.isListening ? 'running' : 'stopped',
      transactionProcessor: processorStatus.isProcessing ? 'running' : 'stopped',
      database: 'connected' // Simplified check
    },
    chains: {
      supported: Object.keys(SUPPORTED_CHAINS).map(id => parseInt(id)),
      connected: listenerStatus.connectedChains
    }
  };

  const allServicesRunning = 
    listenerStatus.isListening && 
    processorStatus.isProcessing;

  res.status(allServicesRunning ? 200 : 503).json(health);
});

// Get bridge statistics
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await database.getBridgeStats(parseInt(days));
    
    // Calculate totals
    const totals = stats.reduce((acc, stat) => {
      acc.totalEvents += stat.total_events;
      acc.successful += stat.successful;
      acc.failed += stat.failed;
      acc.totalVolume += parseFloat(stat.total_volume || 0);
      return acc;
    }, {
      totalEvents: 0,
      successful: 0,
      failed: 0,
      totalVolume: 0
    });

    res.json({
      period: `${days} days`,
      totals,
      byRoute: stats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get bridge event status
router.get('/events/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const event = await database.getEventByTxId(txId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Return public information only
    res.json({
      txId: event.tx_id,
      status: event.status,
      sourceChain: event.source_chain,
      targetChain: event.target_chain,
      amount: event.amount,
      confirmations: event.confirmations,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      relayTxHash: event.relay_tx_hash
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event status' });
  }
});

// Get recent bridge events (public)
router.get('/events', async (req, res) => {
  try {
    const { limit = 20, status, sourceChain, targetChain } = req.query;
    
    let query = 'SELECT tx_id, status, source_chain, target_chain, amount, confirmations, created_at, updated_at FROM bridge_events WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (sourceChain) {
      query += ' AND source_chain = ?';
      params.push(parseInt(sourceChain));
    }

    if (targetChain) {
      query += ' AND target_chain = ?';
      params.push(parseInt(targetChain));
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(Math.min(parseInt(limit), 100)); // Max 100 events

    const events = await database.db.all(query, params);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get supported chains
router.get('/chains', (req, res) => {
  const chains = Object.entries(SUPPORTED_CHAINS).map(([id, config]) => ({
    chainId: parseInt(id),
    name: config.name,
    minConfirmations: config.minConfirmations,
    blockTime: config.blockTime
  }));

  res.json(chains);
});

// Get relayer status (public info only)
router.get('/relayer/status', async (req, res) => {
  try {
    const listenerStatus = eventListener.getStatus();
    const processorStatus = transactionProcessor.getStatus();

    res.json({
      isOperational: listenerStatus.isListening && processorStatus.isProcessing,
      connectedChains: listenerStatus.connectedChains,
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch relayer status' });
  }
});

// Webhook endpoint for external monitoring
router.post('/webhook/status', (req, res) => {
  // This endpoint can be used by external monitoring services
  // to check if the relayer is responding
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Relayer is responding'
  });
});

export default router;