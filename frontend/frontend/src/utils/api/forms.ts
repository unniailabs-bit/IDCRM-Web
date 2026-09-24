import { apiCall } from './base';

export const formsApi = {
  getAll: async (schoolId: string) => {
    return apiCall(`/forms/${schoolId}`);
  },

  submit: async (schoolId: string, studentId: string, formData: any) => {
    return apiCall('/forms/submit', {
      method: 'POST',
      body: { schoolId, studentId, formData },
    });
  },

  teacherAction: async (
    formId: string,
    action: 'approved' | 'rejected',
    teacherId: string,
    remarks?: string
  ) => {
    return apiCall('/forms/teacher-action', {
      method: 'POST',
      body: { formId, action, teacherId, remarks },
    });
  },

  adminAction: async (
    formId: string,
    action: 'approved' | 'rejected',
    adminId: string,
    remarks?: string
  ) => {
    return apiCall('/forms/admin-action', {
      method: 'POST',
      body: { formId, action, adminId, remarks },
    });
  },
};
