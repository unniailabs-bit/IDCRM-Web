import axiosInstance from './axiosInstance';

export interface Subject {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const subjectsApi = {
  getAllSubjects: async (): Promise<{ success: boolean; data: Subject[] }> => {
    try {
      // Try super admin endpoint first (for platform admin), fallback to trust endpoint
      try {
        const response = await axiosInstance.get<{ success: boolean; data: Subject[] }>(
          '/api/superadmin/subjects/all'
        );
        return response.data;
      } catch (superAdminError: any) {
        // If super admin endpoint fails (401/403), try trust endpoint
        if (superAdminError.response?.status === 401 || superAdminError.response?.status === 403) {
          const response = await axiosInstance.get<{ success: boolean; data: Subject[] }>(
            '/api/trust/subjects/all'
          );
          return response.data;
        }
        throw superAdminError;
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  createSubject: async (subjectData: { name: string; description?: string }): Promise<{ success: boolean; message: string; data: Subject }> => {
    try {
      // Try super admin endpoint first (for platform admin), fallback to trust endpoint
      try {
        const response = await axiosInstance.post<{ success: boolean; message: string; data: Subject }>(
          '/api/superadmin/subjects/create',
          subjectData
        );
        return response.data;
      } catch (superAdminError: any) {
        // If super admin endpoint fails (401/403), try trust endpoint
        if (superAdminError.response?.status === 401 || superAdminError.response?.status === 403) {
          const response = await axiosInstance.post<{ success: boolean; message: string; data: Subject }>(
            '/api/trust/subjects/create',
            subjectData
          );
          return response.data;
        }
        throw superAdminError;
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
  },
};

