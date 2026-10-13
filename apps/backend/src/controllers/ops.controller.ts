import { Request, Response } from 'express';
import { JobService } from '../services/job.service';
import { SessionService } from '../services/session.service';
import { sendSuccess } from '../utils/response';

export class OpsController {
  static async businessMetrics(req: Request, res: Response) {
    const jobMetrics = JobService.getMetrics();
    const metrics = {
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      jobs: jobMetrics,
    };
    sendSuccess(res, 'System Metrics', metrics);
  }
  static async systemHealth(req: Request, res: Response) {
    try {
      res.json({
        status: 'ok',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      });
    } catch (err) {
      console.error('Failed to get system health', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // Stage 8: Dashboard APIs
  static async getMetrics(req: Request, res: Response) {
    try {
      const cpu = process.cpuUsage();
      const memory = process.memoryUsage();
      const activeSessions = SessionService.getActiveSessionCount();

      res.json({
        'api.errors': 0,
        'cpu.usage_user': cpu.user,
        'cpu.usage_system': cpu.system,
        'memory.heapUsed': memory.heapUsed,
        'memory.heapTotal': memory.heapTotal,
        'active.sessions': activeSessions || 1
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIncidents(req: Request, res: Response) {
    try {
      res.json({ incidents: [] });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async triggerAlert(req: Request, res: Response) {
    try {
      // For manual testing
      const { metricName, value } = req.body;
      const { AlertingService } = require('../services/alerting.service');
      AlertingService.evaluateMetricThreshold(metricName, value);
      res.json({ message: 'Alert evaluation triggered' });
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
