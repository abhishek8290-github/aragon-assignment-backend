require('dotenv').config();
const express = require('express');
const router = require('./routes/router');

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const hpp = require('hpp');
const compression = require('compression');
const xss = require('xss-clean');
const morgan = require('morgan');

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const Sentry = require('@sentry/node');
const logger = require('./utils/logger');

const app = express();

/**
 * Basic logging (morgan) and a small winston-like console wrapper.
 * For production, replace console with a structured logger (winston/bunyan).
 */
app.use(morgan('combined', { stream: logger.stream }));

// Security middlewares
app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(compression());

// CORS - restrict via ALLOWED_ORIGINS env (comma-separated) if provided
const allowed = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  optionsSuccessStatus: 200,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
}));

// Rate limiter - basic global limiter; tune for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Parsers with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Conditional CSRF protection: enable only when USE_CSRF=true (opt-in for browser workflows)
if (process.env.USE_CSRF === 'true') {
  const csrfProtection = csurf({ cookie: true });
  // Apply CSRF protection to state-changing routes under /api
  app.use('/api', csrfProtection);
}

 // Simple logging middleware - logs method and path (uses winston)
 app.use((req, res, next) => {
   logger.info(`${req.method} ${req.path}`);
   next();
 });

const swaggerDocument = YAML.load('./openapi.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Initialize Sentry if configured and attach request handler
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

// Mount API routes
app.use('/api', router);

// 404 for unknown API endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Sentry error handler (captures errors) - only if SENTRY_DSN is present
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Log the error
  logger.error(err);
  if (process.env.SENTRY_DSN) {
    try {
      Sentry.captureException(err);
    } catch (e) {
      logger.error('Sentry capture failed', e);
    }
  }
  const status = err.status || 500;
  const message = (process.env.NODE_ENV === 'production') ? (err.message || 'Internal Server Error') : err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
