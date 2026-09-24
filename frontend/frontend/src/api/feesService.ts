import axiosInstance from './axiosInstance';

export interface FeeInstallment {
  id?: number;
  fee_plan_id?: number;
  installment_no?: number;
  installment_name: string;
  amount: string | number;
  due_date: string;
  status?: string;
  created_at?: string;
}

export interface FeeStructureApi {
  id?: number | string;
  school_id?: number | string;
  class_id: number | string;
  annual_fee: string | number;
  late_fee_penalty: string | number;
  number_of_installments: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  class_name?: string;
  section?: string;
  installments: FeeInstallment[];
}

export const feesService = {
  // Get fees
  getFeesBySchool: async (schoolId: string | number) => {
    try {
      // Updated endpoint to fetch all fees
      const response = await axiosInstance.get('/api/school/fees/all');
      return response.data;
    } catch (error) {
      console.error('Get fees by school API error:', error);
      throw error;
    }
  },

  createFee: async (data: FeeStructureApi) => {
    try {
      const response = await axiosInstance.post('/api/school/fees/create', data);
      return response.data;
    } catch (error) {
      console.error('Create fee API error:', error);
      throw error;
    }
  },

  updateFee: async (id: string | number, data: Partial<FeeStructureApi>) => {
    try {
      const response = await axiosInstance.patch(`/api/school/fees/update/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update fee API error:', error);
      throw error;
    }
  },

  deleteFee: async (id: string | number) => {
    try {
      const response = await axiosInstance.delete(`/api/school/fees/delete/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete fee API error:', error);
      throw error;
    }
  },
};
