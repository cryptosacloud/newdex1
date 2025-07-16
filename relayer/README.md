# DexBridge Relayer Service

A secure, production-ready backend service that acts as a cross-chain bridge relayer for the DexBridge ecosystem. This service monitors multiple EVM-compatible blockchains for bridge events and automatically processes cross-chain token transfers.

## 🚀 Features

### Core Functionality
- **Multi-Chain Monitoring** - Listens to bridge events on Ethereum, BSC, Polygon, Arbitrum, and custom chains
- **Automatic Processing** - Automatically processes lock/mint and burn/release transactions
- **Secure Relaying** - Uses private key signing with configurable security controls
- **Duplicate Prevention** - Prevents double-spending and replay attacks
- **Confirmation Management** - Waits for configurable block confirmations before processing

### Security Features
- **Rate Limiting** - Protects against spam and abuse
- **Gas Price Controls** - Prevents processing during high gas periods
- **Balance Monitoring** - Alerts when relayer balances are low
- **Error Handling** - Comprehensive error handling with retry logic
- **Audit Logging** - Complete transaction history and audit trails

### Monitoring & Alerts
- **Real-time Alerts** - Discord, Slack, and Telegram notifications
- **Health Checks** - Automated service health monitoring
- **Performance Metrics** - Bridge statistics and success rates
- **Admin Dashboard** - Web interface for monitoring and control

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **SQLite3** (for local database)
- **RPC Access** to all supported chains
- **Private Key** for relayer wallet (funded on all chains)

## 🛠 Installation

1. **Clone and Setup**
   ```bash
   cd relayer
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure Environment Variables**
   ```env
   # Relayer Wallet (CRITICAL - Keep Secure!)
   RELAYER_PRIVATE_KEY=your_private_key_here
   
   # RPC Endpoints
   ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
   BSC_RPC_URL=https://bsc-dataseed.binance.org
   POLYGON_RPC_URL=https://polygon-rpc.com
   ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
   
   # Bridge Contract Addresses (Update after deployment)
   ETHEREUM_BRIDGE_ADDRESS=0x...
   BSC_BRIDGE_ADDRESS=0x...
   POLYGON_BRIDGE_ADDRESS=0x...
   ARBITRUM_BRIDGE_ADDRESS=0x...
   
   # Security Settings
   MIN_CONFIRMATIONS=12
   MAX_GAS_PRICE_GWEI=100
   
   # Alert Webhooks (Optional)
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   ```

4. **Start the Service**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🏗 Architecture

### Core Components

#### Event Listener (`src/services/eventListener.js`)
- Monitors all configured chains for bridge events
- Processes both real-time and historical events
- Handles connection management and error recovery
- Stores events in database with confirmation tracking

#### Transaction Processor (`src/services/transactionProcessor.js`)
- Processes confirmed bridge events
- Executes mint/release transactions on destination chains
- Manages gas pricing and transaction optimization
- Implements retry logic for failed transactions

#### Database Layer (`src/database/db.js`)
- SQLite database for event storage and tracking
- Prevents duplicate processing
- Stores transaction history and statistics
- Provides data for admin dashboard

#### Alert System (`src/utils/alerts.js`)
- Multi-channel notification system
- Supports Discord, Slack, and Telegram
- Configurable alert types and severity levels
- Real-time monitoring and reporting

### API Endpoints

#### Public API (`/api`)
- `GET /api/health` - Service health check
- `GET /api/stats` - Bridge statistics
- `GET /api/events/:txId` - Event status lookup
- `GET /api/chains` - Supported chains info

#### Admin API (`/admin`)
- `POST /admin/login` - Admin authentication
- `GET /admin/dashboard` - Dashboard data
- `GET /admin/events` - Event management
- `POST /admin/events/:txId/retry` - Manual retry
- `POST /admin/services/:service/:action` - Service control

## 🔧 Configuration

### Chain Configuration (`src/config/chains.js`)
```javascript
export const SUPPORTED_CHAINS = {
  1: {
    name: 'Ethereum',
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    bridgeAddress: process.env.ETHEREUM_BRIDGE_ADDRESS,
    minConfirmations: 12,
    gasLimit: 500000,
    maxGasPrice: '100', // gwei
    blockTime: 12000 // ms
  }
  // ... other chains
};
```

### Security Settings
- **MIN_CONFIRMATIONS** - Block confirmations required before processing
- **MAX_GAS_PRICE_GWEI** - Maximum gas price for transactions
- **PROCESSING_INTERVAL_MS** - How often to check for pending events
- **Rate Limiting** - API request limits and windows

## 📊 Monitoring

### Health Checks
The service provides comprehensive health monitoring:

```bash
# Check service health
curl http://localhost:3001/api/health

# Response
{
  "status": "ok",
  "services": {
    "eventListener": "running",
    "transactionProcessor": "running",
    "database": "connected"
  },
  "chains": {
    "supported": [1, 56, 137, 42161],
    "connected": [1, 56, 137, 42161]
  }
}
```

### Alerts
Configure webhooks for real-time notifications:

- **New Bridge Events** - When tokens are locked/burned
- **Successful Relays** - When transactions are completed
- **Failed Transactions** - When processing fails
- **Low Balances** - When relayer needs funding
- **System Errors** - Service issues and downtime

### Logs
Structured logging with multiple levels:
- `logs/combined.log` - All application logs
- `logs/error.log` - Error-level logs only
- `logs/bridge.log` - Bridge-specific events
- Console output in development mode

## 🔐 Security Best Practices

### Private Key Management
- **Never commit private keys** to version control
- Use **environment variables** or secure key management
- Consider **hardware wallets** for production
- Implement **multi-signature** for critical operations

### Network Security
- Use **HTTPS** for all external communications
- Implement **rate limiting** on all endpoints
- Use **VPN** or **private networks** when possible
- Monitor for **unusual activity** patterns

### Operational Security
- **Regular backups** of database and logs
- **Monitor relayer balances** across all chains
- **Set up alerts** for all critical events
- **Regular security audits** of the codebase

## 🚀 Deployment

### Production Deployment

1. **Server Setup**
   ```bash
   # Install Node.js and dependencies
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clone and setup
   git clone <repository>
   cd relayer
   npm install --production
   ```

2. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/index.js --name "dexbridge-relayer"
   pm2 startup
   pm2 save
   ```

3. **Reverse Proxy (Nginx)**
   ```nginx
   server {
       listen 80;
       server_name relayer.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY src/ ./src/
COPY .env ./

EXPOSE 3001
CMD ["npm", "start"]
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes** on frequently queried columns
- **Pagination** for large result sets
- **Connection pooling** for high throughput
- **Regular cleanup** of old records

### Network Optimization
- **Connection pooling** for RPC providers
- **Retry logic** with exponential backoff
- **Batch processing** where possible
- **Caching** of frequently accessed data

### Memory Management
- **Streaming** for large data sets
- **Garbage collection** monitoring
- **Memory leak** detection
- **Resource cleanup** on shutdown

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
# Test with local blockchain
npm run test:integration
```

### Load Testing
```bash
# Test API endpoints
npm run test:load
```

## 📚 API Documentation

### Event Status Codes
- `pending` - Event detected, waiting for confirmations
- `confirmed` - Sufficient confirmations, ready for relay
- `completed` - Successfully relayed to destination chain
- `failed` - Processing failed, manual intervention required

### Error Codes
- `INSUFFICIENT_CONFIRMATIONS` - Not enough block confirmations
- `GAS_PRICE_TOO_HIGH` - Gas price exceeds maximum
- `INSUFFICIENT_BALANCE` - Relayer balance too low
- `DUPLICATE_EVENT` - Event already processed
- `INVALID_CHAIN` - Unsupported chain ID

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

### Common Issues

**Q: Relayer not processing events**
- Check RPC connectivity
- Verify contract addresses
- Ensure sufficient confirmations
- Check relayer authorization

**Q: High gas fees preventing processing**
- Adjust `MAX_GAS_PRICE_GWEI` setting
- Monitor gas price trends
- Consider gas optimization strategies

**Q: Database errors**
- Check disk space
- Verify file permissions
- Consider database migration

### Getting Help
- Check the logs in `logs/` directory
- Use the admin dashboard for diagnostics
- Review the health check endpoint
- Contact the development team

---

**⚠️ Security Notice**: This service handles real cryptocurrency transactions. Always test thoroughly on testnets before mainnet deployment and consider professional security audits for production use.