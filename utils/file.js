import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import userUtils from './user';
import basicUtils from './basic';

/**
 * Module to handle file-related operations
 */
const fileUtils = {
  /**
   * Validates the request body when creating a file
   * @param {Object} request - Express request object
   * @returns {Object} - Returns object containing any error or validated parameters
   */
  async validateBody(request) {
    const {
      name, type, isPublic = false, data,
    } = request.body;

    let { parentId = 0 } = request.body;

    const typesAllowed = ['file', 'image', 'folder'];
    let msg = null;

    if (parentId === '0') parentId = 0;

    if (!name) {
      msg = 'Missing name';
    } else if (!type || !typesAllowed.includes(type)) {
      msg = 'Missing type';
    } else if (!data && type !== 'folder') {
      msg = 'Missing data';
    } else if (parentId && parentId !== '0') {
      let file;

      if (basicUtils.isValidId(parentId)) {
        file = await this.getFile({
          _id: ObjectId(parentId),
        });
      } else {
        file = null;
      }

      if (!file) {
        msg = 'Parent not found';
      } else if (file.type !== 'folder') {
        msg = 'Parent is not a folder';
      }
    }

    const obj = {
      error: msg,
      fileParams: {
        name,
        type,
        parentId,
        isPublic,
        data,
      },
    };

    return obj;
  },

  /**
   * Retrieves a file document from the database
   * @param {Object} query - MongoDB query object
   * @returns {Object} - Returns the file document if found
   */
  async getFile(query) {
    const file = await dbClient.filesCollection.findOne(query);
    return file;
  },

  /**
   * Retrieves all files from the database belonging to a parent ID
   * @param {Object} query - MongoDB aggregation query
   * @returns {Array} - Returns an array of files
   */
  async getFilesOfParentId(query) {
    const fileList = await dbClient.filesCollection.aggregate(query);
    return fileList;
  },

  /**
   * Saves a file to both the database and local storage
   * @param {string} userId - The user ID who owns the file
   * @param {Object} fileParams - The file's parameters
   * @param {string} FOLDER_PATH - Path where the file will be stored locally
   * @returns {Object} - Returns any errors and the newly created file
   */
  async saveFile(userId, fileParams, FOLDER_PATH) {
    const {
      name, type, isPublic, data,
    } = fileParams;
    let { parentId } = fileParams;

    if (parentId !== 0) parentId = ObjectId(parentId);

    const query = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (fileParams.type !== 'folder') {
      const fileNameUUID = uuidv4();

      // Decoding the Base64 data
      const fileDataDecoded = Buffer.from(data, 'base64');

      const path = `${FOLDER_PATH}/${fileNameUUID}`;

      query.localPath = path;

      try {
        await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
        await fsPromises.writeFile(path, fileDataDecoded);
      } catch (err) {
        return { error: err.message, code: 400 };
      }
    }

    const result = await dbClient.filesCollection.insertOne(query);

    const file = this.processFile(query);

    const newFile = { id: result.insertedId, ...file };

    return { error: null, newFile };
  },

  /**
   * Updates a file document in the database
   * @param {Object} query - MongoDB query to find the file
   * @param {Object} set - MongoDB update object
   * @returns {Object} - Returns the updated file document
   */
  async updateFile(query, set) {
    const fileList = await dbClient.filesCollection.findOneAndUpdate(
      query,
      set,
      { returnOriginal: false },
    );
    return fileList;
  },

  /**
   * Publishes or unpublishes a file (sets isPublic to true or false)
   * @param {Object} request - Express request object
   * @param {boolean} setPublish - True for publishing, false for unpublishing
   * @returns {Object} - Contains the updated file or error
   */
  async publishUnpublish(request, setPublish) {
    const { id: fileId } = request.params;

    if (!basicUtils.isValidId(fileId)) { return { error: 'Unauthorized', code: 401 }; }

    const { userId } = await userUtils.getUserIdAndKey(request);

    if (!basicUtils.isValidId(userId)) { return { error: 'Unauthorized', code: 401 }; }

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return { error: 'Unauthorized', code: 401 };

    const file = await this.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!file) return { error: 'Not found', code: 404 };

    const result = await this.updateFile(
      {
        _id: ObjectId(fileId),
        userId: ObjectId(userId),
      },
      { $set: { isPublic: setPublish } },
    );

    const {
      _id: id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    } = result.value;

    const updatedFile = {
      id,
      userId: resultUserId,
      name,
      type,
      isPublic,
      parentId,
    };

    return { error: null, code: 200, updatedFile };
  },

  /**
   * Processes a file document to remove internal fields and convert _id to id
   * @param {Object} doc - File document to process
   * @returns {Object} - Returns the processed file document
   */
  processFile(doc) {
    const file = { id: doc._id, ...doc };

    delete file.localPath;
    delete file._id;

    return file;
  },

  /**
   * Checks if the file is public or belongs to the current user
   * @param {Object} file - The file object
   * @param {string} userId - ID of the user
   * @returns {boolean} - True if public or owned by user, otherwise false
   */
  isOwnerAndPublic(file, userId) {
    if (
      (!file.isPublic && !userId)
      || (userId && file.userId.toString() !== userId && !file.isPublic)
    ) { return false; }

    return true;
  },

  /**
   * Retrieves the content of the file from the local filesystem
   * @param {Object} file - File object
   * @param {string} size - The requested size for image files
   * @returns {Object} - Returns the file data or an error
   */
  async getFileData(file, size) {
    let { localPath } = file;
    let data;

    if (size) localPath = `${localPath}_${size}`;

    try {
      data = await fsPromises.readFile(localPath);
    } catch (err) {
      return { error: 'Not found', code: 404 };
    }

    return { data };
  },
};

export default fileUtils;
