import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import logger from '../utils/logger.js';

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || './data/relayer.db';
  }

  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(this.dbPath);

      await this.createTables();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  async createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bridge_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tx_id TEXT UNIQUE NOT NULL,
        event_type TEXT NOT NULL,
        source_chain INTEGER NOT NULL,
        target_chain INTEGER NOT NULL,
        user_address TEXT NOT NULL,
        token_address TEXT NOT NULL,
        amount TEXT NOT NULL,
        target_address TEXT NOT NULL,
        block_number INTEGER NOT NULL,
        transaction_hash TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        confirmations INTEGER DEFAULT 0,
        relay_tx_hash TEXT,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chain_id INTEGER NOT NULL,
        block_number INTEGER NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(chain_id, block_number)
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS relayer_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        chain_id INTEGER NOT NULL,
        events_processed INTEGER DEFAULT 0,
        successful_relays INTEGER DEFAULT 0,
        failed_relays INTEGER DEFAULT 0,
        total_volume TEXT DEFAULT '0',
        UNIQUE(date, chain_id)
      )
    `);

    // Create indexes for better performance
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_bridge_events_status ON bridge_events(status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_bridge_events_chains ON bridge_events(source_chain, target_chain)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_processed_blocks_chain ON processed_blocks(chain_id)');
  }

  async saveBridgeEvent(eventData) {
    const query = `
      INSERT OR REPLACE INTO bridge_events 
      (tx_id, event_type, source_chain, target_chain, user_address, token_address, 
       amount, target_address, block_number, transaction_hash, confirmations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      eventData.txId,
      eventData.eventType,
      eventData.sourceChain,
      eventData.targetChain,
      eventData.userAddress,
      eventData.tokenAddress,
      eventData.amount,
      eventData.targetAddress,
      eventData.blockNumber,
      eventData.transactionHash,
      eventData.confirmations || 0
    ];

    this.db.prepare(query).run(params);
    logger.info(`Bridge event saved: ${eventData.txId}`);
  }

  async updateEventStatus(txId, status, relayTxHash = null, errorMessage = null) {
    const query = `
      UPDATE bridge_events 
      SET status = ?, relay_tx_hash = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tx_id = ?
    `;

    this.db.prepare(query).run([status, relayTxHash, errorMessage, txId]);
    logger.info(`Event status updated: ${txId} -> ${status}`);
  }

  async updateEventConfirmations(txId, confirmations) {
    const query = `
      UPDATE bridge_events 
      SET confirmations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE tx_id = ?
    `;

    this.db.prepare(query).run([confirmations, txId]);
  }

  async getPendingEvents() {
    const query = `
      SELECT * FROM bridge_events 
      WHERE status IN ('pending', 'confirmed') 
      ORDER BY created_at ASC
    `;

    return this.db.prepare(query).all();
  }

  async getEventByTxId(txId) {
    const query = 'SELECT * FROM bridge_events WHERE tx_id = ?';
    return this.db.prepare(query).get([txId]);
  }

  async isEventProcessed(txId) {
    const event = await this.getEventByTxId(txId);
    return event && event.status === 'completed';
  }

  async saveProcessedBlock(chainId, blockNumber) {
    const query = `
      INSERT OR REPLACE INTO processed_blocks (chain_id, block_number)
      VALUES (?, ?)
    `;

    this.db.prepare(query).run([chainId, blockNumber]);
  }

  async getLastProcessedBlock(chainId) {
    const query = `
      SELECT MAX(block_number) as block_number 
      FROM processed_blocks 
      WHERE chain_id = ?
    `;

    const result = this.db.prepare(query).get([chainId]);
    return result?.block_number || 0;
  }

  async getBridgeStats(days = 7) {
    const query = `
      SELECT 
        source_chain,
        target_chain,
        COUNT(*) as total_events,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CAST(amount AS REAL)) as total_volume
      FROM bridge_events 
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY source_chain, target_chain
    `;

    return this.db.prepare(query).all([days]);
  }

  async getRecentEvents(limit = 50) {
    const query = `
      SELECT * FROM bridge_events 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

    return this.db.prepare(query).all([limit]);
  }

  async close() {
    if (this.db) {
      await new Promise((resolve) => {
        this.db.close(resolve);
      });
      logger.info('Database connection closed');
    }
  }
}

export default new DatabaseManager();