import Redis from 'ioredis';
import { config } from './env';

/**
 * Valkey/Redis client configuration
 * Provides a singleton instance for cache operations
 */
class ValkeyClient {
  private static instance: Redis | null = null;
  private static isConnected: boolean = false;

  /**
   * Get or create Valkey client instance
   */
  public static getInstance(): Redis {
    if (!ValkeyClient.instance) {
      ValkeyClient.instance = new Redis({
        host: config.VALKEY_HOST,
        port: config.VALKEY_PORT,
        password: config.VALKEY_PASSWORD,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        showFriendlyErrorStack: config.isDevelopment,
      });

      // Connection event handlers
      ValkeyClient.instance.on('connect', () => {
        console.log('✓ Valkey client connected');
        ValkeyClient.isConnected = true;
      });

      ValkeyClient.instance.on('ready', () => {
        console.log('✓ Valkey client ready');
      });

      ValkeyClient.instance.on('error', (err: Error) => {
        console.error('✗ Valkey client error:', err.message);
        ValkeyClient.isConnected = false;
      });

      ValkeyClient.instance.on('close', () => {
        console.log('✗ Valkey client disconnected');
        ValkeyClient.isConnected = false;
      });

      ValkeyClient.instance.on('reconnecting', () => {
        console.log('⟳ Valkey client reconnecting...');
      });
    }

    return ValkeyClient.instance;
  }

  /**
   * Check if Valkey client is connected
   */
  public static isClientConnected(): boolean {
    return ValkeyClient.isConnected;
  }

  /**
   * Gracefully disconnect the Valkey client
   */
  public static async disconnect(): Promise<void> {
    if (ValkeyClient.instance) {
      await ValkeyClient.instance.quit();
      ValkeyClient.instance = null;
      ValkeyClient.isConnected = false;
      console.log('✓ Valkey client disconnected gracefully');
    }
  }

  /**
   * Health check for Valkey connection
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const client = ValkeyClient.getInstance();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Valkey health check failed:', error);
      return false;
    }
  }
}

export const valkeyClient = ValkeyClient.getInstance();
export default ValkeyClient;
