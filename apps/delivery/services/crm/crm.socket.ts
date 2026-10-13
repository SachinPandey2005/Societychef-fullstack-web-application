import supabase from '../../api/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CRMDispatchPayload } from './crm.types';

let crmDispatchChannel: RealtimeChannel | null = null;

export const crmSocket = {
  connect: (partnerId: string, onDispatchReceived: (payload: CRMDispatchPayload) => void) => {
    if (crmDispatchChannel) {
      crmDispatchChannel.unsubscribe();
    }

    console.log(`[crmSocket] Connecting to CRM dispatch channel for partner: ${partnerId}`);

    crmDispatchChannel = supabase
      .channel('ops_crm_dispatch')
      .on('broadcast', { event: `dispatch:${partnerId}` }, ({ payload }) => {
        console.log('[crmSocket] Received dispatch broadcast payload from CRM', payload);
        onDispatchReceived(payload);
      })
      .subscribe((status) => {
        console.log(`[crmSocket] CRM channel connection status: ${status}`);
      });
  },

  disconnect: () => {
    if (crmDispatchChannel) {
      console.log('[crmSocket] Disconnecting from CRM dispatch channel');
      crmDispatchChannel.unsubscribe();
      crmDispatchChannel = null;
    }
  },
};

export default crmSocket;
