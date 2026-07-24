// server.js
// Application entrypoint: middleware wiring, DB connection, and startup.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// ---------------- Security Middleware ----------------
app.use(helmet());

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      // In development, allow any localhost origin
      if (env.nodeEnv === 'development' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      // Allow any Vercel preview/production URL for this project
      if (/^https:\/\/pulseguard-ai.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      // Allow any Netlify preview/production URL for this project
      if (/^https:\/\/pulseguard-ai.*\.netlify\.app$/.test(origin)) {
        return callback(null, true);
      }
      // Allow any Render URL for this project
      if (/^https:\/\/pulseguard-ai.*\.onrender\.com$/.test(origin)) {
        return callback(null, true);
      }
      // Check against CLIENT_URL (supports comma-separated list)
      const allowedOrigins = (env.clientUrl || '').split(',').map(s => s.trim()).filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In production, if no specific match, allow the origin for flexibility
      if (env.nodeEnv === 'production') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ---------------- Logging ----------------
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ---------------- Rate Limiter ----------------
const limiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ---------------- Health Check ----------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pulseguard-ai-backend',
  });
});

// ---------------- API Routes ----------------
app.use('/api/v1', apiRoutes);

// ---------------- Error Middleware ----------------
app.use(notFound);
app.use(errorHandler);

// ---------------- Startup ----------------
const startServer = async () => {
  try {
    console.log("\n========== PulseGuard Startup ==========");
    console.log("STEP 1 - Starting server...");

    console.log("STEP 2 - Connecting to MongoDB...");
    await connectDB();
    console.log("✅ STEP 2 Completed - MongoDB Connected");

    console.log("STEP 3 - Loading Reminder Engine...");
    const { initReminderEngine } = require('./services/reminder.service');
    console.log("✅ Reminder module loaded");

    console.log("STEP 4 - Initializing Reminder Engine...");
    initReminderEngine();
    console.log("✅ Reminder Engine Initialized");

    console.log(`STEP 5 - Starting Express on port ${env.port}...`);

    const server = app.listen(env.port, () => {
      console.log("✅ STEP 6 - Express Server Started");
      console.log(`🌍 http://localhost:${env.port}`);
      logger.info(
        `PulseGuard AI backend running in ${env.nodeEnv} mode on port ${env.port}`
      );
    });

    process.on('unhandledRejection', (err) => {
      console.error("❌ Unhandled Rejection:", err);
      logger.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err) => {
      console.error("❌ Uncaught Exception:", err);
      logger.error(`Uncaught Exception: ${err.message}`);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log("⚠️ SIGTERM received");
      logger.info('SIGTERM received. Shutting down gracefully.');
      server.close(() => process.exit(0));
    });

  } catch (err) {
    console.error("\n❌ SERVER FAILED TO START");
    console.error(err);
  }
};

startServer();

module.exports = app;