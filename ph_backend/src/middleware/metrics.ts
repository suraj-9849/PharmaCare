import { Request, Response, NextFunction } from 'express';
import { collectDefaultMetrics, register } from 'prom-client';
import { METRICS_ROUTE, METRICS_PREFIX } from '../constants/monitoring';

// Collect default Node.js metrics with prefix using the default global registry
collectDefaultMetrics({
  register,
  prefix: METRICS_PREFIX,
});

// Expose a middleware that mounts the metrics route on an express app
export const metricsMiddleware = (_req: Request, res: Response, _next: NextFunction) => {
  res.setHeader('Content-Type', register.contentType || 'text/plain; version=0.0.4');
  register
    .metrics()
    .then((metrics: string) => res.status(200).send(metrics))
    .catch((err: Error) => {
      console.error('Failed to gather metrics:', err);
      res.status(500).send('Error collecting metrics');
    });
};

export const metricsRoute = METRICS_ROUTE;

export default register;
