import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { initiativesRouter } from './routes/initiatives.js';
import { assetsRouter } from './routes/assets.js';
import { metricsRouter } from './routes/metrics.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/initiatives', initiativesRouter);
  app.use('/api/assets', assetsRouter);
  app.use('/api/metrics', metricsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
