import { create } from 'zustand';

export interface ShiftInfo {
  id: string;
  title: string;
  shift_start: string;
  shift_end: string;
  hours_worked: number;
  break_time_minutes: number;
  is_late_arrival: boolean;
  attendance_status: 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE';
  crm_controlled: boolean;
}

interface ShiftState {
  shift: ShiftInfo | null;
  isLoading: boolean;
  error: string | null;

  setShift: (shift: ShiftInfo | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useShiftStore = create<ShiftState>((set) => ({
  shift: {
    id: 'shift-1',
    title: 'Morning Prime Shift',
    shift_start: `${new Date().toISOString().split('T')[0]}T08:00:00Z`,
    shift_end: `${new Date().toISOString().split('T')[0]}T16:00:00Z`,
    hours_worked: 4.8,
    break_time_minutes: 25,
    is_late_arrival: false,
    attendance_status: 'PRESENT',
    crm_controlled: true,
  },
  isLoading: false,
  error: null,

  setShift: (shift: ShiftInfo | null) => set({ shift, error: null }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
}));
