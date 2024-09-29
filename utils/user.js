import redisClient from './redis';
import dbClient from './db';

/**
 * Utility functions for working with user data
 */
const userUtils = {
  /**
   * Retrieves the user ID and corresponding Redis key from the request headers.
   * @request {request_object} The express request object
   * @return {object} An object containing the userId and Redis key,
   * or null values if the token is not found.
   */
  async getUserIdAndKey(request) {
    const obj = { userId: null, key: null };

    const xToken = request.header('X-Token');

    if (!xToken) return obj;

    obj.key = `auth_${xToken}`;

    obj.userId = await redisClient.get(obj.key);

    return obj;
  },

  /**
   * Fetches a user document from the database based on a query.
   * @query {object} The query object to find the user
   * @return {object} The user document object, or null if no user is found.
   */
  async getUser(query) {
    const user = await dbClient.usersCollection.findOne(query);
    return user;
  },
};

export default userUtils;
