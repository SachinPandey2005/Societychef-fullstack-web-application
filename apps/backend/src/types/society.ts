export interface Society {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  lat?: number;
  lng?: number;
  created_at?: string;
  updated_at?: string;
}

export type CreateSocietyInput = Omit<Society, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSocietyInput = Partial<CreateSocietyInput>;
