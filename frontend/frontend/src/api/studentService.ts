import axiosInstance from './axiosInstance';

export const studentService = {
  // ✅ Get all students for a specific school
  getStudentsBySchool: async (schoolId: string | number) => {
    try {
      const response = await axiosInstance.get(`/api/school/student/school/${schoolId}`);
      // console.log('Get students by school API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Get students by school API error:', error);
      throw error;
    }
  },

  // ✅ Get public students list for a specific school (new endpoint)
  getPublicStudents: async (schoolId: string | number) => {
    try {
      const response = await axiosInstance.get(`/api/student/public/list?school_id=${schoolId}`);
      return response.data;
    } catch (error) {
      console.error('Get public students API error:', error);
      throw error;
    }
  },

  // ✅ Get divisions by class
  getDivisionsByClass: async (className: string) => {
    try {
      const response = await axiosInstance.get(`/api/school/class/class/${className}/divisions`);
      // console.log('Get divisions for class API response:', response.data);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // console.log(`No divisions found for class ${className}.`);
        return { success: true, data: [] }; // Return empty array for 404
      }
      console.error(`Get divisions for class ${className} API error:`, error);
      throw error;
    }
  },

  // ✅ Add a new student
  addStudent: async (studentData: {
    name: string;
    roll_number: number | string;
    parent_phone: string;
    class_name: string;
    division_name: string;
  }) => {
    try {
      // console.log("student data,", studentData)
      const response = await axiosInstance.post(`/api/school/student/create`, studentData);
      // console.log('Add student API response:', response.data);
      return response.data; // expected: { success, message, data }
    } catch (error) {
      console.error('Add student API error:', error);
      throw error;
    }
  },

  // ✅ Update student details
  updateStudent: async (studentId: string | number, updateData: any) => {
    try {
      // console.log(`Updating student ${studentId}:`, updateData);
      const response = await axiosInstance.patch(`/api/school/update/${studentId}`, updateData);
      // console.log('Update student API response:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Update student ${studentId} API error:`, error);
      throw error;
    }
  },
};
