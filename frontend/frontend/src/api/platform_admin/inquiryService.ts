import axiosInstance from '../axiosInstance';

export interface Inquiry {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    message: string;
    createdAt: string;
    updatedAt: string;
}

export interface InquiriesResponse {
    success: boolean;
    data: Inquiry[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const inquiryService = {
    getInquiries: async (page: number = 1, limit: number = 10): Promise<InquiriesResponse> => {
        try {
            const response = await axiosInstance.get(`/api/superadmin/book-demos`, {
                params: { page, limit },
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching inquiries:', error);
            throw error;
        }
    },
};
