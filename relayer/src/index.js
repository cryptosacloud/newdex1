import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';

import logger from './utils/logger.js';
import database from './database/db.js';
import eventListener from './services/eventListener.js';
import transactionProcessor from './services/transactionProcessor.js';
import { sendAlert } from './utils/alerts.js';

import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

class RelayerService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      logger.info('Initializing DexBridge Relayer Service...');

      // Initialize database
      await database.initialize();

      // Initialize services
      await eventListener.initialize();
      await transactionProcessor.initialize();

      // Setup Express app
      this.setupMiddleware();
      this.setupRoutes();
      this.setupErrorHandling();

      // Setup scheduled tasks
      this.setupScheduledTasks();

      logger.info('Relayer service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize relayer service:', error);
      throw error;
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);
    
    // Admin routes
    this.app.use('/admin', adminRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'DexBridge Relayer',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      logger.error('Unhandled error:', error);
      
      if (res.headersSent) {
        return next(error);
      }

      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });

    // Handle process termination signals
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received');
      this.gracefulShutdown('SIGTERM');
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received');
      this.gracefulShutdown('SIGINT');
    });
  }

  setupScheduledTasks() {
    // Health check every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    });

    // Balance check every hour
    cron.schedule('0 * * * *', async () => {
      try {
        await this.checkRelayerBalances();
      } catch (error) {
        logger.error('Balance check failed:', error);
      }
    });

    // Daily statistics report
    cron.schedule('0 0 * * *', async () => {
      try {
        await this.sendDailyReport();
      } catch (error) {
        logger.error('Daily report failed:', error);
      }
    });
  }

  async performHealthCheck() {
    const listenerStatus = eventListener.getStatus();
    const processorStatus = transactionProcessor.getStatus();

    if (!listenerStatus.isListening) {
      logger.warn('Event listener is not running');
      await sendAlert({
        type: 'system_error',
        message: 'Event listener is not running',
        data: listenerStatus
      });
    }

    if (!processorStatus.isProcessing) {
      logger.warn('Transaction processor is not running');
      await sendAlert({
        type: 'system_error',
        message: 'Transaction processor is not running',
        data: processorStatus
      });
    }
  }

  async checkRelayerBalances() {
    try {
      const balances = await transactionProcessor.getAllBalances();
      const lowBalanceThreshold = 0.1; // 0.1 ETH equivalent

      for (const [chainId, balanceInfo] of Object.entries(balances)) {
        const balance = parseFloat(balanceInfo.balance);
        
        if (balance < lowBalanceThreshold) {
          await sendAlert({
            type: 'low_balance',
            message: `Low relayer balance on ${balanceInfo.name}`,
            data: {
              chainId,
              chainName: balanceInfo.name,
              balance: balanceInfo.balance,
              threshold: lowBalanceThreshold
            }
          });
        }
      }
    } catch (error) {
      logger.error('Balance check error:', error);
    }
  }

  async sendDailyReport() {
    try {
      const stats = await database.getBridgeStats(1); // Last 24 hours
      const totalEvents = stats.reduce((sum, stat) => sum + stat.total_events, 0);
      const totalSuccessful = stats.reduce((sum, stat) => sum + stat.successful, 0);
      const totalFailed = stats.reduce((sum, stat) => sum + stat.failed, 0);
      const totalVolume = stats.reduce((sum, stat) => sum + parseFloat(stat.total_volume || 0), 0);

      await sendAlert({
        type: 'daily_report',
        message: 'Daily Bridge Report',
        data: {
          period: '24 hours',
          totalEvents,
          successRate: totalEvents > 0 ? ((totalSuccessful / totalEvents) * 100).toFixed(2) + '%' : '0%',
          totalVolume: totalVolume.toFixed(4),
          failed: totalFailed
        }
      });
    } catch (error) {
      logger.error('Daily report error:', error);
    }
  }

  async start() {
    try {
      // Start the HTTP server
      this.server = this.app.listen(this.port, () => {
        logger.info(`Relayer service listening on port ${this.port}`);
      });

      // Start bridge services
      await eventListener.startListening();
      await transactionProcessor.startProcessing();

      // Send startup notification
      await sendAlert({
        type: 'system_startup',
        message: 'DexBridge Relayer Service started successfully',
        data: {
          port: this.port,
          timestamp: new Date().toISOString()
        }
      });

      logger.info('🚀 DexBridge Relayer Service is now running!');
    } catch (error) {
      logger.error('Failed to start relayer service:', error);
      throw error;
    }
  }

  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      logger.info('Shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Graceful shutdown initiated (${signal})`);

    try {
      // Stop accepting new requests
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }

      // Stop bridge services
      await eventListener.stopListening();
      await transactionProcessor.stopProcessing();

      // Close database connection
      await database.close();

      // Send shutdown notification
      await sendAlert({
        type: 'system_shutdown',
        message: `DexBridge Relayer Service shutting down (${signal})`,
        data: {
          signal,
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the service
async function main() {
  const relayer = new RelayerService();
  
  try {
    await relayer.initialize();
    await relayer.start();
  } catch (error) {
    logger.error('Failed to start relayer service:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default RelayerService;