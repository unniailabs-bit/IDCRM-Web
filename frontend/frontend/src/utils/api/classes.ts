import { apiCall } from './base';

export const classesApi = {
  getAll: async (schoolId: string) => {
    return apiCall(`/classes/${schoolId}`);
  },

  create: async (schoolId: string, classData: any) => {
    return apiCall('/classes', {
      method: 'POST',
      body: { schoolId, classData },
    });
  },

  update: async (classId: string, updates: any) => {
    return apiCall(`/classes/${classId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  delete: async (classId: string) => {
    return apiCall(`/classes/${classId}`, {
      method: 'DELETE',
    });
  },
};
