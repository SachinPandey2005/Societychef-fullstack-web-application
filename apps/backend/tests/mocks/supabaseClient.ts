export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'admin-uuid-1234',
    email: 'admin@gmail.com',
    user_metadata: { role: 'admin' }
  }
};

export const mockUser = {
  id: 'admin-uuid-1234',
  email: 'admin@gmail.com',
  phone: '+919999999999'
};

export const mockProfile = {
  id: 'admin-uuid-1234',
  email: 'admin@gmail.com',
  phone: '+919999999999',
  name: 'Production Admin',
  role: 'admin',
  status: 'active'
};

const inMemoryProfiles: Record<string, any> = {
  'admin-uuid-1234': mockProfile,
};

let lastQueryVal: string | null = null;
let lastInsertRecord: any = null;

export const supabase = {
  auth: {
    signInWithPassword: jest.fn().mockImplementation(async ({ email, password }) => {
      if (email === 'admin@gmail.com' && password === 'Admin@1234') {
        return { data: { session: mockSession, user: mockUser }, error: null };
      }
      return { data: { session: null, user: null }, error: new Error('Invalid credentials') };
    }),
    verifyOtp: jest.fn().mockResolvedValue({ data: { session: mockSession, user: mockUser }, error: null }),
    signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
    refreshSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    getUser: jest.fn().mockImplementation(async (token?: string) => {
      if (!token || token.includes('dev_signature') || token === 'invalid_garbage_token') {
        return { data: { user: null }, error: new Error('Invalid JWT') };
      }
      return { data: { user: mockUser }, error: null };
    }),
    admin: {
      createUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      updateUserById: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      listUsers: jest.fn().mockResolvedValue({ data: { users: [mockUser] }, error: null })
    }
  },
  from: jest.fn().mockImplementation((table: string) => {
    const builder: any = {
      select: jest.fn().mockImplementation(() => builder),
      insert: jest.fn().mockImplementation((data: any) => {
        lastInsertRecord = Array.isArray(data) ? data[0] : data;
        if (table === 'profiles' && lastInsertRecord?.id) {
          inMemoryProfiles[lastInsertRecord.id] = { ...lastInsertRecord };
        }
        return builder;
      }),
      update: jest.fn().mockImplementation((data: any) => {
        if (lastQueryVal && inMemoryProfiles[lastQueryVal]) {
          inMemoryProfiles[lastQueryVal] = { ...inMemoryProfiles[lastQueryVal], ...data };
        }
        return builder;
      }),
      delete: jest.fn().mockImplementation(() => builder),
      eq: jest.fn().mockImplementation((field: string, val: any) => {
        lastQueryVal = val;
        return builder;
      }),
      gte: jest.fn().mockImplementation(() => builder),
      lte: jest.fn().mockImplementation(() => builder),
      order: jest.fn().mockImplementation(() => builder),
      in: jest.fn().mockImplementation(() => builder),
      limit: jest.fn().mockImplementation(() => builder),
      maybeSingle: jest.fn().mockImplementation(async () => {
        if (lastQueryVal && inMemoryProfiles[lastQueryVal]) {
          return { data: inMemoryProfiles[lastQueryVal], error: null };
        }
        if (lastQueryVal && lastQueryVal !== 'admin-uuid-1234') {
          return { data: null, error: null };
        }
        return { data: mockProfile, error: null };
      }),
      single: jest.fn().mockImplementation(async () => {
        if (lastInsertRecord) {
          const rec = lastInsertRecord;
          lastInsertRecord = null;
          return { data: rec, error: null };
        }
        if (lastQueryVal && inMemoryProfiles[lastQueryVal]) {
          return { data: inMemoryProfiles[lastQueryVal], error: null };
        }
        if (lastQueryVal && lastQueryVal !== 'admin-uuid-1234') {
          return { data: null, error: { code: 'PGRST116', message: 'Record not found' } };
        }
        return { data: mockProfile, error: null };
      }),
    };
    return builder;
  }),
  rpc: jest.fn().mockResolvedValue({ data: {}, error: null })
};

export const createClient = jest.fn(() => supabase);
