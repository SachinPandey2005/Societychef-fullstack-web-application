import { Request, Response } from 'express';
import { GovernanceService } from '../services/governance.service';
import { DisasterRecoveryService } from '../services/dr.service';

export class GovernanceController {
  static async getDashboard(req: Request, res: Response) {
    const data = await GovernanceService.getGovernanceDashboard();
    res.json(data);
  }

  static async triggerBackup(req: Request, res: Response) {
    const adminId = req.user?.id || 'system';
    const result = await DisasterRecoveryService.triggerDatabaseBackup(adminId);
    res.json(result);
  }

  static async getDrReadiness(req: Request, res: Response) {
    const readiness = await DisasterRecoveryService.getRecoveryReadiness();
    res.json(readiness);
  }
}
