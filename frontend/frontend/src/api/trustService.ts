import axiosInstance from './axiosInstance';

interface TrustData {
  trustName: string;
  email: string;
  phone: string;
  address: string;
  password?: string; // Optional for updates
  city?: string;
  state?: string;
  pincode?: string;
  allotNoOfId?: string | number;
  allot_ids?: number; // Backend uses allot_ids
}

export const trustService = {
  getAllTrusts: async () => {
    try {
      const response = await axiosInstance.get('/api/trust/all');
      // console.log("response",response)
      return response.data;
    } catch (error) {
      console.error('Error fetching all trusts:', error);
      throw error;
    }
  },

  createTrust: async (trustData: TrustData) => {
    try {
      // console.log("trust data,",trustData)
      const response = await axiosInstance.post('/api/trust/create', trustData);
      return response.data;
    } catch (error) {
      console.error('Error creating trust:', error);
      throw error;
    }
  },

  updateTrust: async (id: number, trustData: TrustData) => {
    try {
      const response = await axiosInstance.patch(`/api/trust/${id}`, trustData);
      return response.data;
    } catch (error) {
      console.error(`Error updating trust with ID ${id}:`, error);
      throw error;
    }
  },

  getCreditSummary: async () => {
    try {
      const response = await axiosInstance.get('/api/trust/credit-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching credit summary:', error);
      throw error;
    }
  },

  getGeneratedIdsSummary: async () => {
    try {
      const response = await axiosInstance.get('/api/trust/generated-ids-summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching generated IDs summary:', error);
      throw error;
    }
  },
};
