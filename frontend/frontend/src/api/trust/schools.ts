import axiosInstance from "../axiosInstance";

interface DivisionData {
  division_name: string;
  class_teacher: string;
  teacher_id?: number | null;
  teacher_email?: string;
  teacher_phone?: string;
  teacher_password?: string;
  teacher_subject?: string;
  expected_students: number;
}

interface ClassData {
  class_name: string;
  divisions: DivisionData[];
}

interface SchoolData {
  schoolName: string;
  school_code: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  password: string;
  section: string;  // NEW: Section at school level
  classes: ClassData[];
}

interface SchoolDetails {
  id: number;
  trust_id: number;
  school_name: string;
  school_code: string;
  section: string;  // NEW: Section at school level
  email: string;
  phone: string;
  address: string;
  created_at: string;
  updated_at: string;
  classes: {
    id: number;
    class_name: string;
    created_at: string;
    updated_at: string;
    divisions: {
      id: number;
      division_name: string;
      class_teacher: string;
      expected_students: number;
      created_at: string;
      updated_at: string;
    }[];
  }[];
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  school_id: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: SchoolDetails[];
}

export const trustSchoolApi = {
  createSchool: async (schoolData: SchoolData) => {
    const response = await axiosInstance.post(
      "/api/trust/schools/create",
      schoolData
    );
    return response.data;
  },
  getAllSchools: async (trustId: number) => {
    const response = await axiosInstance.get<ApiResponse>(
      "/api/trust/schools/all",

    );

    // console.log(response.data)
    return response.data;
  },
  getSchoolById: async (schoolId: number) => {
    try {
      const response = await axiosInstance.get<ApiResponse>("/api/trust/schools/all");
      if (response.data.success && response.data.data) {
        const school = response.data.data.find((s: any) => s.id === schoolId);
        if (school) {
          return { success: true, data: school };
        }
      }
      return { success: false, message: "School not found" };
    } catch (error) {
      console.error("Error fetching school details:", error);
      throw error;
    }
  },
  // NEW: Get teachers for a school
  getTeachers: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: Teacher[] }>(
      `/api/trust/schools/${schoolId}/teachers`
    );
    return response.data;
  },
  // NEW: Quick create teacher for a school
  createTeacher: async (schoolId: number, teacherData: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    subject?: string;
    status?: string;
  }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: Teacher }>(
      `/api/trust/schools/${schoolId}/teachers`,
      teacherData
    );
    return response.data;
  },
  // Update school
  updateSchool: async (schoolId: number, schoolData: Partial<SchoolData>) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: SchoolDetails }>(
      `/api/trust/schools/${schoolId}`,
      schoolData
    );
    return response.data;
  },
  // Delete school
  deleteSchool: async (schoolId: number) => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/trust/schools/${schoolId}`
    );
    return response.data;
  },

  // Credentials Management
  getSchoolCredentials: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: any }>(
      `/api/trust/schools/${schoolId}/credentials`
    );
    return response.data;
  },

  resetSchoolPassword: async (schoolId: number, newPassword: string, sendEmail: boolean = false) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/trust/schools/${schoolId}/reset-password`,
      { newPassword, sendEmail }
    );
    return response.data;
  },

  sendSchoolCredentials: async (schoolId: number, email?: string, password?: string) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/trust/schools/${schoolId}/send-credentials`,
      { email, password }
    );
    return response.data;
  },

  // Classes Management
  getClasses: async (schoolId: number) => {
    const response = await axiosInstance.get<{ success: boolean; data: any[] }>(
      `/api/trust/schools/${schoolId}/classes`
    );
    return response.data;
  },

  createClass: async (schoolId: number, classData: { class_name: string }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/trust/schools/${schoolId}/classes`,
      classData
    );
    return response.data;
  },

  createDivision: async (schoolId: number, classId: number, divisionData: {
    division_name: string;
    class_teacher?: string;
    teacher_id?: number | null;
    expected_students?: number;
  }) => {
    const response = await axiosInstance.post<{ success: boolean; message: string; data: any }>(
      `/api/trust/schools/${schoolId}/classes/${classId}/divisions`,
      divisionData
    );
    return response.data;
  },

  // Teachers Management
  updateTeacher: async (schoolId: number, teacherId: number, updates: {
    name?: string;
    email?: string;
    phone?: string;
    subject?: string;
    status?: string;
    password?: string;
  }) => {
    const response = await axiosInstance.patch<{ success: boolean; message: string; data: any }>(
      `/api/trust/schools/${schoolId}/teachers/${teacherId}`,
      updates
    );
    return response.data;
  },

  deleteTeacher: async (schoolId: number, teacherId: number) => {
    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/trust/schools/${schoolId}/teachers/${teacherId}`
    );
    return response.data;
  },
};
