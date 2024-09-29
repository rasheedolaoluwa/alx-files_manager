import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import userUtils from '../utils/user';

/**
 * Controller for handling authentication-related tasks
 */
class AuthController {
  /**
   * Signs in the user and generates an authentication token.
   *
   * Using the Basic auth technique (Base64 of the <email>:<password>),
   * it finds the user associated with the provided email and password
   * (The password is stored as a SHA1 hash).
   * If no user is found, returns a 401 Unauthorized error.
   * If a user is found:
   * - Generates a random token using uuidv4
   * - Creates a Redis key `auth_<token>`
   * - Stores the user's ID in Redis for 24 hours
   * - Returns the token with a 200 status code.
   */
  static async getConnect(request, response) {
    const Authorization = request.header('Authorization') || '';

    const credentials = Authorization.split(' ')[1];

    if (!credentials) { return response.status(401).send({ error: 'Unauthorized' }); }

    const decodedCredentials = Buffer.from(credentials, 'base64').toString(
      'utf-8',
    );

    const [email, password] = decodedCredentials.split(':');

    if (!email || !password) { return response.status(401).send({ error: 'Unauthorized' }); }

    const sha1Password = sha1(password);

    const user = await userUtils.getUser({
      email,
      password: sha1Password,
    });

    if (!user) return response.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const hoursForExpiration = 24;

    await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

    return response.status(200).send({ token });
  }

  /**
   * Signs out the user by deleting their authentication token from Redis.
   *
   * Retrieves the user based on the provided token.
   * If not found, returns a 401 Unauthorized error.
   * If found, deletes the token from Redis and returns a 204 status code.
   */
  static async getDisconnect(request, response) {
    const { userId, key } = await userUtils.getUserIdAndKey(request);

    if (!userId) return response.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(key);

    return response.status(204).send();
  }
}

export default AuthController;
