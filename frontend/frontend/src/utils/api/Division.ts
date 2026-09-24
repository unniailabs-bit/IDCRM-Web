import { api } from './base';

export const addDivision = async (classId: number, divisionName: string) => {
  try {
    const response = await api.post('/divisions', {
      class_id: classId,
      division_name: divisionName,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding division:', error);
    throw error;
  }
};
