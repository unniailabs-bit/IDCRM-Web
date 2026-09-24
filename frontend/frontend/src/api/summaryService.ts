import axiosInstance from './axiosInstance';

export interface SchoolSummaryData {
  class_name: string;
  division: string;
  total_forms: number;
  approved: number;
  rejected: number;
  pending: number;
}

export const summaryService = {
  getSchoolSummary: async () => {
    try {
      const response = await axiosInstance.get('/api/school/school-summary');
      // console.log('School Summary API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('School Summary API error:', error);
      throw error;
    }
  },
  getSchoolSummaryCsv: async () => {
    try {
      const response = await axiosInstance.get('/api/school/school-summary?export=csv');
      // console.log('School Summary CSV API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('School Summary CSV API error:', error);
      throw error;
    }
  },
};