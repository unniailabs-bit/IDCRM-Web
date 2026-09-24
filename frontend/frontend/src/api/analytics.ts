import axiosInstance from './axiosInstance';

export interface AnalyticsOverview {
  totalStudents: number;
  totalIdCards: number;
  creditsUsed: number;
  creditsRemaining: number;
  creditsAllocated: number;
  creditBalance: number;
  totalSchools: number;
  totalTeachers: number;
  successRate: number;
  studentsGrowth: number;
  idCardsGrowth: number;
}

export interface MonthlyTrend {
  month: string;
  students: number;
  idCards: number;
  credits: number;
}

export interface SchoolPerformance {
  school: string;
  students: number;
  creditsUsed: number;
  idCards: number;
}

export interface CreditDistribution {
  name: string;
  value: number;
  color: string;
}

export interface IdCardStatus {
  name: string;
  value: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  school: string;
  action: string;
  date: string;
  credits: number;
}

export const analyticsApi = {
  getOverview: async (): Promise<{ success: boolean; data: AnalyticsOverview }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: AnalyticsOverview }>(
        '/api/trust/analytics/overview'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    }
  },

  getMonthlyTrends: async (): Promise<{ success: boolean; data: MonthlyTrend[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: MonthlyTrend[] }>(
        '/api/trust/analytics/monthly-trends'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      throw error;
    }
  },

  getSchoolPerformance: async (): Promise<{ success: boolean; data: SchoolPerformance[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: SchoolPerformance[] }>(
        '/api/trust/analytics/school-performance'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching school performance:', error);
      throw error;
    }
  },

  getCreditDistribution: async (): Promise<{ success: boolean; data: CreditDistribution[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: CreditDistribution[] }>(
        '/api/trust/analytics/credit-distribution'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching credit distribution:', error);
      throw error;
    }
  },

  getIdCardStatus: async (): Promise<{ success: boolean; data: IdCardStatus[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: IdCardStatus[] }>(
        '/api/trust/analytics/id-card-status'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching ID card status:', error);
      throw error;
    }
  },

  getRecentActivity: async (): Promise<{ success: boolean; data: RecentActivity[] }> => {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: RecentActivity[] }>(
        '/api/trust/analytics/recent-activity'
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },
};

