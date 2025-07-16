import express from 'express';
import rateLimit from 'express-rate-limit';
import database from '../database/db.js';
import eventListener from '../services/eventListener.js';
import transactionProcessor from '../services/transactionProcessor.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Rate limiting for admin routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

router.use(adminLimiter);

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Simple token verification for demo purposes
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [username, timestamp] = decoded.split(':');
    
    // Check if token is less than 24 hours old
    if (Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000) {
      return res.status(403).json({ error: 'Token expired' });
    }
    
    req.user = { username };
    next();
  } catch (err) {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }
};

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Simple credential check (in production, use proper user management)
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple token generation for demo purposes
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

    res.json({ token, expiresIn: '24h' });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected routes
router.use(authenticateToken);

// Dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await database.getBridgeStats(7); // Last 7 days
    const recentEvents = await database.getRecentEvents(20);
    const listenerStatus = eventListener.getStatus();
    const processorStatus = transactionProcessor.getStatus();
    const balances = await transactionProcessor.getAllBalances();

    res.json({
      stats,
      recentEvents,
      services: {
        eventListener: listenerStatus,
        transactionProcessor: processorStatus
      },
      relayerBalances: balances
    });
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get bridge events with pagination and filtering
router.get('/events', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      sourceChain,
      targetChain,
      txId
    } = req.query;

    let query = 'SELECT * FROM bridge_events WHERE 1=1';
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

    if (txId) {
      query += ' AND tx_id LIKE ?';
      params.push(`%${txId}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const events = await database.db.all(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM bridge_events WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (sourceChain) {
      countQuery += ' AND source_chain = ?';
      countParams.push(parseInt(sourceChain));
    }

    if (targetChain) {
      countQuery += ' AND target_chain = ?';
      countParams.push(parseInt(targetChain));
    }

    if (txId) {
      countQuery += ' AND tx_id LIKE ?';
      countParams.push(`%${txId}%`);
    }

    const countResult = await database.db.get(countQuery, countParams);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Events query error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get specific event details
router.get('/events/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    const event = await database.getEventByTxId(txId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    logger.error('Event detail error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Manually retry failed event
router.post('/events/:txId/retry', async (req, res) => {
  try {
    const { txId } = req.params;
    const event = await database.getEventByTxId(txId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'failed') {
      return res.status(400).json({ error: 'Only failed events can be retried' });
    }

    // Reset event status to confirmed for retry
    await database.updateEventStatus(txId, 'confirmed', null, null);

    logger.info(`Event ${txId} marked for retry by admin`);
    res.json({ message: 'Event marked for retry' });
  } catch (error) {
    logger.error('Event retry error:', error);
    res.status(500).json({ error: 'Failed to retry event' });
  }
});

// Service control endpoints
router.post('/services/event-listener/:action', async (req, res) => {
  try {
    const { action } = req.params;

    switch (action) {
      case 'start':
        await eventListener.startListening();
        res.json({ message: 'Event listener started' });
        break;
      case 'stop':
        await eventListener.stopListening();
        res.json({ message: 'Event listener stopped' });
        break;
      case 'status':
        res.json(eventListener.getStatus());
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Event listener control error:', error);
    res.status(500).json({ error: 'Failed to control event listener' });
  }
});

router.post('/services/transaction-processor/:action', async (req, res) => {
  try {
    const { action } = req.params;

    switch (action) {
      case 'start':
        await transactionProcessor.startProcessing();
        res.json({ message: 'Transaction processor started' });
        break;
      case 'stop':
        await transactionProcessor.stopProcessing();
        res.json({ message: 'Transaction processor stopped' });
        break;
      case 'status':
        res.json(transactionProcessor.getStatus());
        break;
      default:
        res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    logger.error('Transaction processor control error:', error);
    res.status(500).json({ error: 'Failed to control transaction processor' });
  }
});

// Get relayer balances
router.get('/balances', async (req, res) => {
  try {
    const balances = await transactionProcessor.getAllBalances();
    res.json(balances);
  } catch (error) {
    logger.error('Balance query error:', error);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Get system logs
router.get('/logs', async (req, res) => {
  try {
    const { level = 'info', limit = 100 } = req.query;
    
    // This is a simplified log endpoint
    // In production, you might want to use a proper log aggregation service
    res.json({
      message: 'Log endpoint - implement based on your logging strategy',
      suggestion: 'Consider using ELK stack or similar for production log management'
    });
  } catch (error) {
    logger.error('Logs query error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;