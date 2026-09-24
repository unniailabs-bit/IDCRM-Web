import axiosInstance from './axiosInstance';

export interface SchoolDashboardOverview {
  totalStudents: number;
  newAdmissions: number;
  totalClasses: number;
  totalDivisions: number;
  idsGenerated: number;
  creditBalance: number;
  totalTeachers: number;
  completionRate: number;
}

export interface ClasswiseIdStatus {
  class: string;
  students: number;
  completed: number;
}

export interface QuickStats {
  pendingApprovals: number;
  formsSubmitted: number;
  completedThisWeek: number;
  activeTeachers: number;
  completionRate: number;
}

export interface RecentActivity {
  id: string;
  activity: string;
  teacher: string;
  count: number;
  status: string;
  time: string;
}

export interface Notification {
  _id: string;
  id: number;
  school_id: number;
  teacher_id: number | null;
  class_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const schoolDashboardApi = {
  getOverview: async (): Promise<{ success: boolean; data: SchoolDashboardOverview }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: SchoolDashboardOverview }>(
        '/api/school/dashboard/overview'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching school dashboard overview:', error);
      throw error;
    }
  },

  getClasswiseIdStatus: async (): Promise<{ success: boolean; data: ClasswiseIdStatus[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: ClasswiseIdStatus[] }>(
        '/api/school/dashboard/classwise-id-status'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching classwise ID status:', error);
      throw error;
    }
  },

  getQuickStats: async (): Promise<{ success: boolean; data: QuickStats }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: QuickStats }>(
        '/api/school/dashboard/quick-stats'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  },

  getRecentActivity: async (): Promise<{ success: boolean; data: RecentActivity[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: RecentActivity[] }>(
        '/api/school/dashboard/recent-activity'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  sendNotification: async (data: {
    message: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post<{ success: boolean; message: string }>(
        '/api/school/notifications/create',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  },

  getNotifications: async (): Promise<{ success: boolean; data: Notification[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: Notification[] }>(
        '/api/school/notifications/'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  deleteNotification: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.delete<{ success: boolean; message: string }>(
        `/api/school/notifications/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  updateNotification: async (
    id: number,
    data: { message: string }
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.patch<{ success: boolean; message: string }>(
        `/api/school/notifications/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  },
};
