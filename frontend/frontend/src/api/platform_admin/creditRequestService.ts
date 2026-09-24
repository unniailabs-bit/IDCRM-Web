import axiosInstance from "../axiosInstance";

export const creditRequestService = {
    getRequests: async () => {
        const response = await axiosInstance.get('/api/superadmin/superadmin/trust-messages');
        return response.data.data;
    }
};
