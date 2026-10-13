import { supabase } from '../config/supabase';

export class ReportService {
  static async exportOrders(start_date: string, end_date: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', start_date)
      .lte('created_at', end_date);
    
    if (error) throw error;
    return this.convertToCSV(data);
  }

  static async exportSettlements(start_date: string, end_date: string) {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .gte('created_at', start_date)
      .lte('created_at', end_date);
    
    if (error) throw error;
    return this.convertToCSV(data);
  }

  private static convertToCSV(data: any[] | null): string {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
      return Object.values(row).map(val => {
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',');
    });
    return [headers, ...rows].join('\n');
  }
}

