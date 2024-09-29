import redis from 'redis';
import { promisify } from 'util';

/**
 * Class to interact with the Redis service.
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
    });

    this.client.on('connect', () => {
      // Redis client successfully connected to the server.
    });
  }

  /**
   * Checks if the Redis connection is active.
   * @return {boolean} Returns true if connected, false otherwise.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Retrieves the value of a given key from Redis.
   * @param {string} key The key to search for in Redis.
   * @return {string} The value associated with the key.
   */
  async get(key) {
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Sets a key with a value in Redis and specifies its time-to-live (TTL).
   * @param {string} key The key to store in Redis.
   * @param {string} value The value to associate with the key.
   * @param {number} duration The TTL for the key in seconds.
   */
  async set(key, value, duration) {
    this.client.setex(key, duration, value);
  }

  /**
   * Deletes a key from Redis.
   * @param {string} key The key to remove from Redis.
   */
  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
