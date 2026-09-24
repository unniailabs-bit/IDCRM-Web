import axiosInstance from './axiosInstance';

export interface DivisionData {
  class_id?: number;
  class_name: string;
  division_name: string;
  class_teacher: string;
  teacher_id?: number | null;
  expected_students: number;
}

export const addDivision = async (data: DivisionData) => {
  const response = await axiosInstance.post(`/api/school/class/division`, data);
  return response.data;
};

export const updateDivision = async (divisionId: number, data: Partial<DivisionData>) => {
  const response = await axiosInstance.put(`/class/division/${divisionId}`, data);
  return response.data;
};

export const deleteDivision = async (divisionId: number) => {
  const response = await axiosInstance.delete(`/class/division/${divisionId}`);
  return response.data;
};
