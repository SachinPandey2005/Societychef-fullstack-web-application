import { createContext } from 'react';

/**
 * Socket / Realtime context template
 */
export const RealtimeContext = createContext<any>(null);

export default {
  RealtimeContext,
};
