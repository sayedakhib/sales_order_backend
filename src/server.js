import app from './app.js';
import env from './config/env.js';
import { connectDB } from './config/db.js';

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[server] Sales Order API running on http://localhost:${env.port}`);
      console.log(`[server] environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err);
    process.exit(1);
  }
}

start();
