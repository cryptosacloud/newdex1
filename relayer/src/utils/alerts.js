import axios from 'axios';
import logger from './logger.js';

class AlertService {
  constructor() {
    this.discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL;
    this.telegramBot = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
  }

  async sendAlert(alert) {
    try {
      const message = this.formatMessage(alert);
      
      // Send to all configured channels
      const promises = [];
      
      if (this.discordWebhook) {
        promises.push(this.sendDiscordAlert(message, alert));
      }
      
      if (this.slackWebhook) {
        promises.push(this.sendSlackAlert(message, alert));
      }
      
      if (this.telegramBot && this.telegramChatId) {
        promises.push(this.sendTelegramAlert(message, alert));
      }

      await Promise.allSettled(promises);
      
      logger.info(`Alert sent: ${alert.type}`);
    } catch (error) {
      logger.error('Error sending alert:', error);
    }
  }

  formatMessage(alert) {
    const timestamp = new Date().toISOString();
    let message = `🔗 **DexBridge Relayer Alert**\n`;
    message += `**Type:** ${alert.type}\n`;
    message += `**Time:** ${timestamp}\n`;
    message += `**Message:** ${alert.message}\n`;

    if (alert.data) {
      if (alert.data.txId) {
        message += `**Transaction ID:** ${alert.data.txId}\n`;
      }
      if (alert.data.sourceChain && alert.data.targetChain) {
        message += `**Route:** Chain ${alert.data.sourceChain} → Chain ${alert.data.targetChain}\n`;
      }
      if (alert.data.amount && alert.data.tokenAddress) {
        message += `**Amount:** ${alert.data.amount} tokens\n`;
        message += `**Token:** ${alert.data.tokenAddress}\n`;
      }
      if (alert.data.relayTxHash) {
        message += `**Relay TX:** ${alert.data.relayTxHash}\n`;
      }
    }

    if (alert.error) {
      message += `**Error:** ${alert.error}\n`;
    }

    return message;
  }

  async sendDiscordAlert(message, alert) {
    try {
      const color = this.getAlertColor(alert.type);
      
      const payload = {
        embeds: [{
          title: '🔗 DexBridge Relayer Alert',
          description: message,
          color: color,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'DexBridge Relayer Service'
          }
        }]
      };

      await axios.post(this.discordWebhook, payload);
    } catch (error) {
      logger.error('Error sending Discord alert:', error);
    }
  }

  async sendSlackAlert(message, alert) {
    try {
      const color = this.getSlackColor(alert.type);
      
      const payload = {
        attachments: [{
          color: color,
          title: '🔗 DexBridge Relayer Alert',
          text: message,
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      await axios.post(this.slackWebhook, payload);
    } catch (error) {
      logger.error('Error sending Slack alert:', error);
    }
  }

  async sendTelegramAlert(message, alert) {
    try {
      const url = `https://api.telegram.org/bot${this.telegramBot}/sendMessage`;
      
      const payload = {
        chat_id: this.telegramChatId,
        text: message,
        parse_mode: 'Markdown'
      };

      await axios.post(url, payload);
    } catch (error) {
      logger.error('Error sending Telegram alert:', error);
    }
  }

  getAlertColor(type) {
    const colors = {
      'new_bridge_event': 0x3498db, // Blue
      'successful_relay': 0x2ecc71, // Green
      'relay_failed': 0xe74c3c,    // Red
      'processing_error': 0xf39c12, // Orange
      'low_balance': 0xf1c40f,     // Yellow
      'system_error': 0x9b59b6     // Purple
    };
    
    return colors[type] || 0x95a5a6; // Gray default
  }

  getSlackColor(type) {
    const colors = {
      'new_bridge_event': '#3498db',
      'successful_relay': '#2ecc71',
      'relay_failed': '#e74c3c',
      'processing_error': '#f39c12',
      'low_balance': '#f1c40f',
      'system_error': '#9b59b6'
    };
    
    return colors[type] || '#95a5a6';
  }
}

export const sendAlert = async (alert) => {
  const alertService = new AlertService();
  await alertService.sendAlert(alert);
};

export default AlertService;