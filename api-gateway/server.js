const app = require('./app');
const config = require('config');

// Get server configuration
const PORT = process.env.PORT || config.get('server.port');
const HOST = config.get('server.host');

// Start the server
const server = app.listen(PORT, HOST, () => {
  console.log(`API Gateway running at http://${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

// Handle graceful shutdown
function gracefulShutdown() {
  console.log('Initiating graceful shutdown...');
  
  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });
  
  // Force shutdown after timeout
  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});