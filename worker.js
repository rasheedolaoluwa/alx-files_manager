import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import fileUtils from './utils/file';
import userUtils from './utils/user';
import basicUtils from './utils/basic';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('fileQueue');
const userQueue = new Queue('userQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  // Ensure that userId and fileId are provided, otherwise throw errors
  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!fileId) {
    console.log('Missing fileId');
    throw new Error('Missing fileId');
  }

  // Validate the fileId and userId formats
  if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) throw new Error('File not found');

  // Fetch file details using the provided fileId and userId
  const file = await fileUtils.getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  // Define options and generate thumbnails for the file at different widths
  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  widths.forEach(async (width) => {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
    } catch (err) {
      console.error(err.message);
    }
  });
});

userQueue.process(async (job) => {
  const { userId } = job.data;

  // Ensure that userId is provided, otherwise throw an error
  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  // Validate the userId format
  if (!basicUtils.isValidId(userId)) throw new Error('User not found');

  // Fetch user details using the provided userId
  const user = await userUtils.getUser({
    _id: ObjectId(userId),
  });

  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
});
