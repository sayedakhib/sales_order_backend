import app from './app.js';
import env from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    // connect to the DB first - no point listening if we can't reach it
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[server] Sales Order API running on http://localhost:${env.port}`);
      console.log(`[server] environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    // couldn't reach the DB (or something else broke) - bail out
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

start();
