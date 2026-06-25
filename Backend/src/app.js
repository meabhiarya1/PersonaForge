import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { storageConfig } from './config/storage.js';
import logger from './config/logger.js';
import AppError from './utils/AppError.js';
import videoRoutes from './routes/video.routes.js';
import jobRoutes from './routes/job.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import { bullBoardRouter } from './config/bullBoard.js';
import { getReadiness } from './services/health/health.service.js';
import asyncHandler from './utils/asyncHandler.js';

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use('/temp', express.static(path.resolve(storageConfig.tempRoot)));
app.use('/api/videos', videoRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/webhooks', webhookRoutes);
app.get('/admin', (req, res) => {
  res.redirect('/admin/queues/');
});
app.use('/admin/queues', bullBoardRouter);

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.get(
  '/health/ready',
  asyncHandler(async (req, res) => {
    const readiness = await getReadiness();
    res.status(readiness.ready ? 200 : 503).json({
      success: readiness.ready,
      message: readiness.ready ? 'Ready' : 'Dependencies are not ready',
      data: readiness
    });
  })
);

app.use((req, res, next) => {
  next(new AppError('Route not found', 404));
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  logger.error('REQUEST_ERROR', {
    message: error.message,
    stack: error.stack,
    path: req.path
  });

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

export default app;
