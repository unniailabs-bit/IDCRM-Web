import { apiCall } from './base';

export const studentsApi = {
  getStudents: async (schoolId: string) => {
    return apiCall(`/students/${schoolId}`);
  },

  create: async (schoolId: string, studentData: any) => {
    return apiCall('/students', {
      method: 'POST',
      body: { schoolId, studentData },
    });
  },

  update: async (studentId: string, updates: any) => {
    return apiCall(`/students/${studentId}`, {
      method: 'PUT',
      body: updates,
    });
  },

  delete: async (studentId: string) => {
    return apiCall(`/students/${studentId}`, {
      method: 'DELETE',
    });
  },
};
