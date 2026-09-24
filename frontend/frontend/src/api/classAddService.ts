import axiosInstance from './axiosInstance';

export interface ClassData {
  class_name: string;
  fee_amount?: number;
  late_fee_penalty?: number;
  // Removed section - it's now at school level
}

export const addClass = async (data: ClassData) => {
  const response = await axiosInstance.post('/api/school/class/create', data);
  return response.data;
};
