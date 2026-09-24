import axiosInstance from './axiosInstance';

export const classService = {
  getClassesBySchool: async (schoolId: string | number) => {
    try {
      const response = await axiosInstance.get(`/api/school/class/school/${schoolId}`);
      // console.log('Get classes by school API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get classes by school API error:', error);
      throw error;
    }
  },
};


