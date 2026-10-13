import { Request, Response } from 'express';
import { PredictiveService } from '../services/predictive.service';
import { sendError, sendSuccess } from '../utils/response';
import { SimulationService } from '../services/simulation.service';
import { logger } from '../utils/logger';

export class BIController {
  /**
   * Stage 6: Executive Dashboard Forecast API
   */
  static async getForecast(req: Request, res: Response) {
    try {
      const metric = (req.query.metric as string) || 'revenue';
      const forecast = await PredictiveService.generateForecast(metric);
      res.json(forecast); // Keeping as is for BI metrics payload
    } catch (err) {
      logger.error('Failed to generate forecast', err);
      // Fallback for UI resilience
      sendError(res, 'AI Prediction Service Unavailable', { fallback: true }, 503);
    }
  }

  /**
   * Stage 9: Scenario Simulation API
   */
  static async simulateScenario(req: Request, res: Response) {
    try {
      const { scenario, parameters } = req.body;
      if (!scenario) return sendError(res, 'Missing scenario description', null, 400);

      const result = await SimulationService.runScenario(scenario, parameters);
      res.json(result);
    } catch (err) {
      logger.error('Failed to simulate scenario', err);
      sendError(res, 'AI Prediction Service Unavailable', { fallback: true }, 503);
    }
  }
}
