import 'dotenv/config';
import createApp from './app';
import connectDB from './config/database';
import config from './config';

const startServer = async (): Promise<void> => {
  // ─── Connect to MongoDB ──────────────────────────────────────────────────
  await connectDB();

  // ─── Start HTTP Server ───────────────────────────────────────────────────
  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log('\n┌─────────────────────────────────────────────┐');
    console.log(`│  🚀  Auth Module Server started              │`);
    console.log(`│  📡  Port:    ${config.port}                          │`);
    console.log(`│  🌍  Env:     ${config.nodeEnv.padEnd(20)} │`);
    console.log(`│  🔗  URL:     http://localhost:${config.port}         │`);
    console.log(`│  📋  API:     /api/${config.apiVersion}/auth                │`);
    console.log('└─────────────────────────────────────────────┘\n');
  });

  // ─── Graceful Shutdown ───────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);

    server.close(async () => {
      console.log('✅ HTTP server closed.');

      const { disconnectDB } = await import('./config/database');
      await disconnectDB();
      console.log('✅ Database connection closed.');

      process.exit(0);
    });

    // Force shutdown after 10s
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled Rejection ─────────────────────────────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('💥 Unhandled Promise Rejection:', reason);
    server.close(() => process.exit(1));
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    server.close(() => process.exit(1));
  });
};

startServer();
