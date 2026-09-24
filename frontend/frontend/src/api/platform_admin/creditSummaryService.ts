import axiosInstance from '../axiosInstance';

export interface CreditSummary {
  total_allocated: number;
  total_used: number;
  total_remaining: number;
  total_ids_generated: number;
}

export const getCreditSummary = async (): Promise<CreditSummary | null> => {
  try {
    const response = await axiosInstance.get('/api/superadmin/credit-summary-all');
    if (response.data.success) {
      return response.data.data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching credit summary:', error);
    return null;
  }
};
