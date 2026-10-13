import { CRMEvent } from './crm.types';

export const CRM_EVENTS: Record<CRMEvent, string> = {
  ORDER_DISPATCHED: 'crm:order_dispatched',
  ASSIGNMENT_ACCEPTED: 'crm:assignment_accepted',
  ASSIGNMENT_REJECTED: 'crm:assignment_rejected',
  LOCATION_UPDATED: 'crm:location_updated',
  STATUS_CHANGED: 'crm:status_changed',
};

export default CRM_EVENTS;
