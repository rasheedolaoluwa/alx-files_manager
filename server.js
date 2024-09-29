import express from 'express';
import controllerRouting from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Attach routing controllers to the app
controllerRouting(app);

// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
