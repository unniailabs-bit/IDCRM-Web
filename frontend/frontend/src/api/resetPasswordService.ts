import axiosInstance from './axiosInstance';

export const resetPasswordService = {
    /**
     * Search students by phone number (preview before reset)
     * GET /api/school/search-students-by-phone?phone=...
     */
    searchByPhone: async (phone: string) => {
        const response = await axiosInstance.get(
            `/api/school/search-students-by-phone?phone=${encodeURIComponent(phone)}`
        );
        return response.data;
    },

    /**
     * Reset password for all students linked to a phone number
     * POST /api/school/reset-student-password
     */
    resetPassword: async (phone: string, new_password: string) => {
        const response = await axiosInstance.post(`/api/school/reset-student-password`, {
            phone,
            new_password,
        });
        return response.data;
    },
};
