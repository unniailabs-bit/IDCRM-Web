import axiosInstance from './axiosInstance';

export const authService = {
  login: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/api/superadmin/login', { email, password });
      // console.log('Login API response:', response.data);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },

  forgotPasswordSuperAdmin: async (email: string) => {
    try {
      const response = await axiosInstance.post('/api/superadmin/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Super Admin Forgot Password API error:', error);
      throw error;
    }
  },

  resetPasswordSuperAdmin: async (payload: any) => {
    try {
      const response = await axiosInstance.post('/api/superadmin/reset-password', payload);
      return response.data;
    } catch (error) {
      console.error('Super Admin Reset Password API error:', error);
      throw error;
    }
  },

  schoolAdminLogin: async (email: string, password: string) => {
    try {

      const response = await axiosInstance.post('/api/school/auth/login', { email, password });
      // console.log('School Admin Login API response:', response.data);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('School Admin Login API error:', error);
      throw error;
    }
  },

  forgotPasswordSchoolAdmin: async (email: string) => {
    try {
      const response = await axiosInstance.post('/api/school/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('School Admin Forgot Password API error:', error);
      throw error;
    }
  },

  resetPasswordSchoolAdmin: async (payload: any) => {
    try {
      const response = await axiosInstance.post('/api/school/auth/reset-password', payload);
      return response.data;
    } catch (error) {
      console.error('School Admin Reset Password API error:', error);
      throw error;
    }
  },

  loginTrustAdmin: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/api/trust/auth/login', { email, password });
      // console.log('Trust Admin Login API response:', response.data);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Trust Admin Login API error:', error);
      throw error;
    }
  },

  forgotPasswordTrustAdmin: async (email: string) => {
    try {
      const response = await axiosInstance.post('/api/trust/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Trust Admin Forgot Password API error:', error);
      throw error;
    }
  },

  resetPasswordTrustAdmin: async (payload: any) => {
    try {
      console.log('Reset Password Payload:', payload);
      const response = await axiosInstance.post('/api/trust/auth/reset-password', payload);
      return response.data;
    } catch (error) {
      console.error('Trust Admin Reset Password API error:', error);
      throw error;
    }
  },

  loginTeacher: async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/api/teacher/auth/login', { email, password });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Teacher Login API error:', error);
      throw error;
    }
  },

  selectTeacherProfile: async (selectionToken: string, teacherId: number) => {
    try {
      const response = await axiosInstance.post('/api/teacher/auth/select-profile', {
        selection_token: selectionToken,
        selection_type: 'teacher_school',
        teacher_id: teacherId,
      });
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Teacher Select Profile API error:', error);
      throw error;
    }
  },
  forgotPasswordTeacher: async (email: string) => {
    try {
      const response = await axiosInstance.post('/api/teacher/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Teacher Forgot Password API error:', error);
      throw error;
    }
  },

  resetPasswordTeacher: async (payload: any) => {
    try {
      const response = await axiosInstance.post('/api/teacher/auth/reset-password', payload);
      return response.data;
    } catch (error) {
      console.error('Teacher Reset Password API error:', error);
      throw error;
    }
  },
  changePasswordSuperAdmin: async (payload: any) => {
    try {
      const response = await axiosInstance.patch('/api/superadmin/update-profile', payload);
      return response.data;
    } catch (error) {
      console.error('Super Admin Update Profile API error:', error);
      throw error;
    }
  },
};
