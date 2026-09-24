import axiosInstance from '../axiosInstance';

const API_URL = '/api/school';

interface UpdateClassData {
  new_class_name: string;
  fee_amount?: number;
  late_fee_penalty?: number;
  // Removed section - it's now at school level
}

export const classAdminService = {
  updateClass: async (classId: number, data: UpdateClassData) => {
    try {
      const response = await axiosInstance.patch(`${API_URL}/class/update/${classId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating class ${classId}:`, error);
      throw error;
    }
  },

  deleteClass: async (classId: number) => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/class/delete/${classId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting class ${classId}:`, error);
      throw error;
    }
  },
};
