import { ObjectId } from 'mongodb';

/**
 * Utility module with basic helper functions
 */
const basicUtils = {
  /**
   * Verifies if a given ID is a valid MongoDB ObjectId
   * @param {string|number} id - The ID to be checked
   * @return {boolean} - Returns true if the ID is valid, false otherwise
   */
  isValidId(id) {
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
