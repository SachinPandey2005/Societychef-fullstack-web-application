import { CRMRepository } from '../../repositories/CRMRepository';

export const crmRepository = {
  getAvailableSocieties: async (query: string = '') => {
    return CRMRepository.searchSocieties(query);
  },
};

export default crmRepository;
