import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { initSocketServer } from './realtime/socketServer';

const PORT = env.PORT || 8080;

const server = http.createServer(app);
initSocketServer(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = () => {
  logger.info('Received shutdown signal, closing server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
