import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { injectTracing } from './middleware/tracing.middleware';

const app = express();

// Trust exactly one reverse-proxy hop (Railway's own edge, confirmed via its
// x-railway-edge response header — the app sits directly behind it, nothing
// else in between). `true` (trust an unlimited proxy chain) is what
// express-rate-limit's own startup validation flags as insecure
// (ERR_ERL_PERMISSIVE_TRUST_PROXY, seen repeatedly in Railway's logs) — it
// lets a client spoof X-Forwarded-For to pick whatever IP the rate limiter
// keys on, and made the key generator's behavior depend on exactly which
// headers a given request happened to arrive with instead of a fixed hop
// count, a plausible source of the intermittent 500 on OTP verify reported
// directly ("Internal server error" on one developer's device, not
// reproducible from here) rather than a stable, demonstrable bug.
app.set('trust proxy', 1);

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

// Security Middlewares
app.use(helmet());
app.use(injectTracing);
const DEFAULT_ALLOWED_ORIGINS: string[] = [
  'https://societychef-crm.onrender.com',
  'https://admin.rasohi.com',
  'https://societychef-1.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'http://localhost:8084',
  'http://localhost:19006'
];

const parsedEnvOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allowedOriginsSet = new Set<string>([
  ...DEFAULT_ALLOWED_ORIGINS,
  ...parsedEnvOrigins
]);

const allowedOrigins = Array.from(allowedOriginsSet);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const isAllowed = allowedOrigins.some(allowed => {
      const cleanAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
      return cleanAllowed.toLowerCase() === cleanOrigin.toLowerCase();
    });

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'Accept',
    'Origin',
    'X-Requested-With',
    'X-Request-Timestamp',
    'X-Request-Nonce',
    'x-request-timestamp',
    'x-request-nonce',
    'x-tenant-id',
    'x-idempotency-key',
    'x-api-key',
    'x-maintenance-bypass',
    'x-trace-id',
    'traceparent',
    'x-webhook-signature',
    'x-webhook-timestamp',
    'x-razorpay-signature'
  ],
  optionsSuccessStatus: 200
}));

// Body Parsing & Optimization
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cookieParser());

// Request Logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Global API Rate Limiting (configured for Render reverse proxies)
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});
app.use('/api', limiter);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true,
    data: {
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    }
  });
});

// API Routes
import v1Routes from './routes';
app.use('/api/v1', v1Routes);

// Global Error Handler
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
