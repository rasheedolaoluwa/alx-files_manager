import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

/**
 * Function to define routing for controllers
 * @param {Express.Application} app - Express application instance
 */
function controllerRouting(app) {
  const router = express.Router();
  app.use('/', router);

  // App Controller Routes

  // Route to check the status of Redis and DB
  router.get('/status', (req, res) => {
    AppController.getStatus(req, res);
  });

  // Route to get statistics of users and files in DB
  router.get('/stats', (req, res) => {
    AppController.getStats(req, res);
  });

  // User Controller Routes

  // Route to create a new user in the DB
  router.post('/users', (req, res) => {
    UsersController.postNew(req, res);
  });

  // Route to retrieve the current user based on authentication token
  router.get('/users/me', (req, res) => {
    UsersController.getMe(req, res);
  });

  // Auth Controller Routes

  // Route to sign-in the user and generate an auth token
  router.get('/connect', (req, res) => {
    AuthController.getConnect(req, res);
  });

  // Route to sign-out the user using the authentication token
  router.get('/disconnect', (req, res) => {
    AuthController.getDisconnect(req, res);
  });

  // Files Controller Routes

  // Route to upload a new file to DB and disk
  router.post('/files', (req, res) => {
    FilesController.postUpload(req, res);
  });

  // Route to retrieve file details by its ID
  router.get('/files/:id', (req, res) => {
    FilesController.getShow(req, res);
  });

  // Route to list files for a specific parentId with pagination
  router.get('/files', (req, res) => {
    FilesController.getIndex(req, res);
  });

  // Route to make a file public by ID
  router.put('/files/:id/publish', (req, res) => {
    FilesController.putPublish(req, res);
  });

  // Route to make a file private by ID
  router.put('/files/:id/unpublish', (req, res) => {
    FilesController.putUnpublish(req, res);
  });

  // Route to retrieve the content of a file by ID
  router.get('/files/:id/data', (req, res) => {
    FilesController.getFile(req, res);
  });
}

export default controllerRouting;
