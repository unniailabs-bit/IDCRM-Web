import axiosInstance from './axiosInstance';

interface SchoolData {
  schoolName: string;
  trustId: number;
  schoolAdminName?: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  totalStudents?: number;
  password: string;
  section?: string;
  classes?: Array<{
    class_name: string;
    section?: string;
    divisions?: Array<{
      division_name: string;
      class_teacher?: string;
      teacher_id?: number | null;
      expected_students?: number;
    }>;
  }>;
}

interface UpdateSchoolData {
  schoolName: string;
  trustId: number;
  schoolAdminName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  totalStudents: number;
  password?: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  status?: string;
}

export const schoolService = {
  getAllSchools: async () => {
    try {
      const response = await axiosInstance.get('/api/school/all');
      // console.log("schools", response)
      return response.data;
    } catch (error) {
      console.error('Error fetching all schools:', error);
      throw error;
    }
  },

  createSchool: async (schoolData: SchoolData) => {
    try {
      const response = await axiosInstance.post('/api/school/create', schoolData);
      return response.data;
    } catch (error) {
      console.error('Error creating school:', error);
      throw error;
    }
  },

  updateSchool: async (id: number, schoolData: Partial<UpdateSchoolData>) => {
    try {
      const response = await axiosInstance.patch(`/api/school/${id}`, schoolData);
      return response.data;
    } catch (error) {
      console.error(`Error updating school with ID ${id}:`, error);
      throw error;
    }
  },

  deleteSchool: async (id: number) => {
    try {
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(
        `/api/school/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting school with ID ${id}:`, error);
      throw error;
    }
  },

  getSchoolById: async (id: number) => {
    try {
      const response = await axiosInstance.get(`/api/school/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching school with ID ${id}:`, error);
      throw error;
    }
  },

  // Classes Management
  getClasses: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(
      `/api/school/${schoolId}/classes`
    );
    return response.data;
  },

  createClass: async (schoolId: number, classData: { class_name: string; section?: string }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/classes`,
      classData
    );
    return response.data;
  },

  updateClass: async (
    schoolId: number,
    classId: number,
    classData: { class_name?: string; section?: string }
  ) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/classes/${classId}`,
      classData
    );
    return response.data;
  },

  deleteClass: async (schoolId: number, classId: number) => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/school/${schoolId}/classes/${classId}`
    );
    return response.data;
  },

  createDivision: async (
    schoolId: number,
    classId: number,
    divisionData: {
      division_name: string;
      class_teacher?: string;
      teacher_id?: number | null;
      expected_students?: number;
    }
  ) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/classes/${classId}/divisions`,
      divisionData
    );
    return response.data;
  },

  updateDivision: async (
    schoolId: number,
    classId: number,
    divisionId: number,
    divisionData: {
      division_name?: string;
      class_teacher?: string;
      teacher_id?: number | null;
      expected_students?: number;
    }
  ) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/classes/${classId}/divisions/${divisionId}`,
      divisionData
    );
    return response.data;
  },

  deleteDivision: async (schoolId: number, classId: number, divisionId: number) => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/school/${schoolId}/classes/${classId}/divisions/${divisionId}`
    );
    return response.data;
  },

  // Teachers Management
  getTeachers: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: Teacher[] }>(
      `/api/school/${schoolId}/teachers`
    );
    return response.data;
  },

  createTeacher: async (
    schoolId: number,
    teacherData: {
      name: string;
      email: string;
      phone?: string;
      password: string;
      subject?: string;
      status?: string;
    }
  ) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: Teacher }>(
      `/api/school/${schoolId}/teachers`,
      teacherData
    );
    return response.data;
  },

  updateTeacher: async (
    schoolId: number,
    teacherId: number,
    teacherData: Partial<Teacher & { password?: string }>
  ) => {
    const response = await axiosInstance.patch<{
      success: boolean;
      message: string;
      data: Teacher;
    }>(`/api/school/${schoolId}/teachers/${teacherId}`, teacherData);
    return response.data;
  },

  deleteTeacher: async (schoolId: number, teacherId: number) => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/school/${schoolId}/teachers/${teacherId}`
    );
    return response.data;
  },

  // Credentials Management
  getSchoolCredentials: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>(
      `/api/school/${schoolId}/credentials`
    );
    return response.data;
  },

  resetSchoolPassword: async (
    schoolId: number,
    data: { newPassword: string; sendEmail?: boolean }
  ) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/reset-password`,
      data
    );
    return response.data;
  },

  sendSchoolCredentials: async (schoolId: number, data?: { email?: string; password?: string }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/school/${schoolId}/send-credentials`,
      data || {}
    );
    return response.data;
  },
};
