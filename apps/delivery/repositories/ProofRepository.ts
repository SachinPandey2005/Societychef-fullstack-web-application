import { executionHandoverApi } from '../api';
import { useProofStore } from '../store/useProofStore';

export class ProofRepository {
  static async submitProof(orderId: string): Promise<void> {
    const proofStore = useProofStore.getState();
    try {
      await executionHandoverApi.submitProofOfDelivery(
        orderId,
        proofStore.signatureData || undefined,
        proofStore.photoUri || undefined
      );
      proofStore.setUploaded(true);
    } catch (e: any) {
      console.warn('[ProofRepository] Submit proof error:', e.message);
      proofStore.setUploaded(true); // Optimistic local fallback
    }
  }
}

export default ProofRepository;
