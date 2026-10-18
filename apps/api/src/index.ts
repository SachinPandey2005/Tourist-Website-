import 'dotenv/config';
import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

const server = app.listen(PORT, () => {
  console.log(`🚀 Tourist API server running at http://localhost:${PORT}`);
  console.log(`🩺 Health check accessible at http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
