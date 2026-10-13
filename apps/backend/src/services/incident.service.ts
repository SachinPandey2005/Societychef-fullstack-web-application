import { logger } from '../utils/logger';
import { internalEventBus, EVENTS } from '../events/eventEmitter';

export class IncidentService {
  /**
   * Stage 7: Incident Management. Creates an incident from an alert.
   */
  static async createIncidentFromAlert(alertData: any) {
    logger.info('Creating Incident from Alert', { alertData });
    const incidentId = `INC-${Date.now()}`;
    
    // In reality, save to DB
    const incident = {
      id: incidentId,
      status: 'OPEN',
      severity: alertData.severity,
      title: `High ${alertData.metricName} detected`,
      createdAt: new Date(),
    };

    internalEventBus.emit(EVENTS.INCIDENT_CREATED, { incidentId });
    return incident;
  }

  static async resolveIncident(incidentId: string, resolutionNotes: string) {
    logger.info(`Resolving Incident ${incidentId}`, { resolutionNotes });
    // In reality, update DB
    internalEventBus.emit(EVENTS.INCIDENT_RESOLVED, { incidentId });
    return { id: incidentId, status: 'RESOLVED', resolutionNotes };
  }
}
