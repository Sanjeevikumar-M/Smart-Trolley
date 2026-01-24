// Heartbeat Manager - keeps session alive by sending periodic heartbeat requests
// Prevents session timeout when user is idle or performing slow operations

import api from './api';
import sessionManager from './sessionManager';

class HeartbeatManager {
  constructor() {
    this.heartbeatInterval = null;
    this.isRunning = false;
    this.HEARTBEAT_INTERVAL = 15000; // Send heartbeat every 15 seconds
  }

  /**
   * Start sending periodic heartbeat requests to keep session alive
   */
  start() {
    if (this.isRunning) {
      console.warn('Heartbeat already running');
      return;
    }

    const session = sessionManager.getSession();
    if (!session || !session.id) {
      console.debug('No valid session to send heartbeat');
      return;
    }

    this.isRunning = true;
    console.log('Starting heartbeat manager...');

    // Send initial heartbeat immediately
    this.sendHeartbeat();

    // Then send periodic heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Stop sending heartbeat requests
   */
  stop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isRunning = false;
    console.log('Stopped heartbeat manager');
  }

  /**
   * Send a heartbeat request to the backend
   */
  async sendHeartbeat() {
    try {
      const session = sessionManager.getSession();
      if (!session || !session.id) {
        this.stop();
        return;
      }

      const sessionId = session.id;
      await api.sessionHeartbeat(sessionId);
      sessionManager.updateLastActivity();
      console.debug(`[${new Date().toLocaleTimeString()}] Heartbeat sent for session: ${sessionId}`);
    } catch (error) {
      console.warn('Heartbeat failed:', error.message);
      // If heartbeat fails due to expiry or missing session, stop and clear local session
      const isInvalid = error?.status === 404 || error?.status === 400 || String(error?.message || '').toLowerCase().includes('expired');
      if (isInvalid) {
        console.error('Session invalid (expired/not found). Clearing and stopping heartbeat.');
        try {
          sessionManager.clearSession();
        } catch (_) {}
        this.stop();
      }
    }
  }

  /**
   * Check if heartbeat manager is currently running
   */
  isActive() {
    return this.isRunning;
  }
}

// Export singleton instance
export default new HeartbeatManager();
