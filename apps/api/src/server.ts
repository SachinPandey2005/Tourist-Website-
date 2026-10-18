import { app } from './app.js';
import { env } from './config/env.js';
import { disconnectDatabase } from './config/database.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 VoyageVista API running in [${env.NODE_ENV}] mode at http://localhost:${PORT}`);
  console.log(`🩺 Health check accessible at http://localhost:${PORT}/api/health`);
});

// Safe graceful shutdown mechanism
let isShuttingDown = false;

async function handleShutdown(signal: string, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);

  // Force close after 10 seconds if hanging
  const forceExitTimer = setTimeout(() => {
    console.error('⚠️ Shutdown timed out. Forcing process termination.');
    process.exit(1);
  }, 10000);

  server.close(async (err) => {
    if (err) {
      console.error('Error closing HTTP server:', err);
    } else {
      console.log('🔒 HTTP listener closed to incoming connections.');
    }

    try {
      await disconnectDatabase();
    } finally {
      clearTimeout(forceExitTimer);
      console.log('👋 Process termination complete.');
      process.exit(exitCode);
    }
  });
}

// Process lifecycle hooks
process.on('SIGTERM', () => handleShutdown('SIGTERM', 0));
process.on('SIGINT', () => handleShutdown('SIGINT', 0));

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection at:', reason);
  handleShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception thrown:', error);
  handleShutdown('uncaughtException', 1);
});
