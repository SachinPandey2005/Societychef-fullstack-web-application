import { SettlementService } from './settlement.service';
import { ReconciliationService } from './reconciliation.service';
import { ReportsService } from './reports.service';

export interface BackgroundJobStatus {
  job_id: string;
  name: string;
  schedule: string;
  last_run_at: string;
  next_run_at: string;
  status: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  last_result?: any;
}

export class SchedulerService {
  private static jobs: Map<string, BackgroundJobStatus> = new Map([
    [
      'AUTOMATIC_SETTLEMENT_GENERATOR',
      {
        job_id: 'AUTOMATIC_SETTLEMENT_GENERATOR',
        name: 'Automated Batch Settlement Generator',
        schedule: 'Weekly (Every Sunday 8:00 PM)',
        last_run_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        next_run_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'SUCCESS',
      },
    ],
    [
      'PAYMENT_RECONCILIATION_ENGINE',
      {
        job_id: 'PAYMENT_RECONCILIATION_ENGINE',
        name: 'Payment & Settlement Chain Reconciliation',
        schedule: 'Daily (Every Midnight 12:00 AM)',
        last_run_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        next_run_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        status: 'SUCCESS',
      },
    ],
    [
      'SCHEDULED_REPORTS_DISPATCH',
      {
        job_id: 'SCHEDULED_REPORTS_DISPATCH',
        name: 'Daily & Weekly Executive Reports Dispatch',
        schedule: 'Daily (8:00 AM)',
        last_run_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        next_run_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        status: 'SUCCESS',
      },
    ],
  ]);

  static async runJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Background job #${jobId} not registered`);

    job.status = 'RUNNING';
    job.last_run_at = new Date().toISOString();

    try {
      let result;
      if (jobId === 'AUTOMATIC_SETTLEMENT_GENERATOR') {
        const todayDate = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        result = await SettlementService.bulkGenerateSettlements(sevenDaysAgo, todayDate);
      } else if (jobId === 'PAYMENT_RECONCILIATION_ENGINE') {
        result = await ReconciliationService.runPaymentReconciliation();
      } else if (jobId === 'SCHEDULED_REPORTS_DISPATCH') {
        result = await ReportsService.getExecutiveFinanceSummary();
      }

      job.status = 'SUCCESS';
      job.last_result = result;
      return { success: true, job };
    } catch (error: any) {
      job.status = 'FAILED';
      job.last_result = { error: error.message };
      throw error;
    }
  }

  static getJobStatuses(): BackgroundJobStatus[] {
    return Array.from(this.jobs.values());
  }
}
