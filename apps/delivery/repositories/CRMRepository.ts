import { crmApi, SocietyItem } from '../api/crm.api';

export class CRMRepository {
  static async searchSocieties(query: string = ''): Promise<SocietyItem[]> {
    return crmApi.getSocieties(query);
  }
}

export default CRMRepository;
