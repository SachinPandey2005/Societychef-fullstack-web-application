import { create } from 'zustand';

export interface IncidentRecord {
  id: string;
  incident_type: 'ACCIDENT' | 'VEHICLE_BREAKDOWN' | 'CUSTOMER_MISCONDUCT' | 'CHEF_MISCONDUCT' | 'FOOD_DAMAGE' | 'ROAD_CLOSURE' | 'SAFETY_HAZARD' | 'MEDICAL_EMERGENCY';
  description: string;
  evidence_url: string | null;
  latitude: number | null;
  longitude: number | null;
  order_id: string | null;
  created_at: string;
}

interface IncidentState {
  incidents: IncidentRecord[];
  isLoading: boolean;
  error: string | null;

  setIncidents: (incidents: IncidentRecord[]) => void;
  addIncident: (incident: IncidentRecord) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useIncidentStore = create<IncidentState>((set) => ({
  incidents: [],
  isLoading: false,
  error: null,

  setIncidents: (incidents) => set({ incidents, error: null }),
  addIncident: (record) => set((state) => ({ incidents: [record, ...state.incidents] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

export default useIncidentStore;
