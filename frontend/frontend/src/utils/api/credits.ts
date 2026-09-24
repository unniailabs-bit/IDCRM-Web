import { apiCall } from './base';

export const creditsApi = {
  get: async (schoolId: string) => {
    return apiCall(`/credits/${schoolId}`);
  },

  allocate: async (schoolId: string, amount: number, description: string, performedBy: string) => {
    return apiCall('/credits/allocate', {
      method: 'POST',
      body: { schoolId, amount, description, performedBy },
    });
  },

  use: async (schoolId: string, amount: number, description: string) => {
    return apiCall('/credits/use', {
      method: 'POST',
      body: { schoolId, amount, description },
    });
  },

  getTransactions: async (schoolId: string) => {
    return apiCall(`/credits/transactions/${schoolId}`);
  },
};
