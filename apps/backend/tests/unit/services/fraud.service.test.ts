import { FraudService } from '../../../src/services/fraud.service';
import { FraudRepository } from '../../../src/repositories/fraud.repository';
import { supabase } from '../../mocks/supabaseClient';
import { internalEventBus, EVENTS } from '../../../src/events/eventEmitter';

describe('Unit: FraudService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeActions', () => {
    it('should flag an account and create a case if actions dictate', async () => {
      // Mock repository calls
      jest.spyOn(FraudRepository, 'logActivity').mockResolvedValue();
      jest.spyOn(FraudRepository, 'createCase').mockResolvedValue({ id: 'case-1' } as any);
      const emitSpy = jest.spyOn(internalEventBus, 'emit');

      await FraudService.executeActions('user-1', 'order-1', 'ORDER', ['FLAG_ACCOUNT']);

      expect(FraudRepository.logActivity).toHaveBeenCalled();
      expect(FraudRepository.createCase).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(EVENTS.ACCOUNT_FLAGGED, { id: 'case-1' });
    });
  });
});
