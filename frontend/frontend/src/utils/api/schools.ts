import { apiCall } from './base';

export const schoolsApi = {
  getAll: async (trustId: string) => {
    return apiCall(`/schools/${trustId}`);
  },

  create: async (trustId: string, schoolData: any) => {
    return apiCall('/schools', {
      method: 'POST',
      body: { trustId, schoolData },
    });
  },

  update: async (schoolId: string, updates: any) => {
    return apiCall(`/schools/${schoolId}`, {
      method: 'PUT',
      body: updates,
    });
  },
};
