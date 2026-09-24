import axiosInstance from '../axiosInstance';

export const approvalService = {
  updateTrustStatus: async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await axiosInstance.put(`/api/superadmin/trusts/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating trust status for ID ${id}:`, error);
      throw error;
    }
  },

  updateSchoolStatus: async (id: number, status: 'approved' | 'rejected') => {
    try {
      // Assuming a similar endpoint for schools
      const response = await axiosInstance.put(`/api/superadmin/schools/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error(`Error updating school status for ID ${id}:`, error);
      throw error;
    }
  },
};
