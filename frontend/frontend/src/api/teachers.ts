import axiosInstance from './axiosInstance';

export interface Teacher {
  id: number;
  school_id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

export interface TeacherCreateData {
  name: string;
  email?: string;
  phone?: string;
  subject?: string;
  status?: 'Active' | 'Inactive';
  password: string;
}

export interface TeacherUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  status?: 'Active' | 'Inactive';
  password?: string;
}

export const teachersApi = {
  getAll: async (schoolId: number): Promise<{ success: boolean; data: Teacher[] }> => {
    const response = await axiosInstance.get(`/api/school/teacher/school/${schoolId}`);
    return response.data;
  },

  create: async (schoolId: number, teacherData: TeacherCreateData): Promise<{ success: boolean; message: string; data: Teacher }> => {
    const response = await axiosInstance.post('/api/school/teacher/create', { school_id: schoolId, ...teacherData });
    return response.data;
  },

  update: async (teacherId: number, updates: TeacherUpdateData): Promise<{ success: boolean; message: string; data: Teacher }> => {
    const response = await axiosInstance.patch(`/api/school/teacher/${teacherId}`, updates);
    return response.data;
  },

  delete: async (teacherId: number): Promise<{ success: boolean; message: string }> => {
    const response = await axiosInstance.delete(`/api/school/teacher/${teacherId}`);
    return response.data;
  },

  importTeachers: async (schoolId: number, formData: FormData): Promise<{ success: boolean; count: number; message: string; errors?: any[] }> => {
    const response = await axiosInstance.post(`/api/school/teacher/import-excel`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
