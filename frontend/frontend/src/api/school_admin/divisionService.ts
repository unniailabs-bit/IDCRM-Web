import axiosInstance from '../axiosInstance'; // Adjust path as needed

const API_URL = '/api/school';

interface UpdateDivisionData {
  division_name: string;
  teacher_id?: number | null;
  expected_students: number;
}

export const divisionService = {
  deleteDivision: async (divisionId: number) => {
    try {
      const response = await axiosInstance.delete(`${API_URL}/class/division/delete/${divisionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting division ${divisionId}:`, error);
      throw error;
    }
  },

  updateDivision: async (divisionId: number, data: UpdateDivisionData) => {
    try {
      const response = await axiosInstance.patch(`${API_URL}/class/division/update/${divisionId}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating division ${divisionId}:`, error);
      throw error;
    }
  },
};
