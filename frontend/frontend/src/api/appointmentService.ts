import axiosInstance from './axiosInstance';

export interface TeacherAppointment {
    id?: string | number;
    school_id: number;
    teacher_name: string;
    designation: string;
    email: string;
    phone_number: string;
    available_from: string;
    available_to: string;
    operational_notes?: string;
    status: 'active' | 'inactive';
}

export const appointmentService = {
    getAppointments: async (school_id: number | string) => {
        try {
            const response = await axiosInstance.get(`/api/school/appointments/${school_id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    },

    createAppointment: async (data: TeacherAppointment) => {
        try {
            const response = await axiosInstance.post('/api/school/appointments/', data);
            return response.data;
        } catch (error) {
            console.error('Error creating appointment:', error);
            throw error;
        }
    },

    updateAppointment: async (id: string | number, data: Partial<TeacherAppointment>) => {
        try {
            const response = await axiosInstance.patch(`/api/school/appointments/${id}`, data);
            return response.data;
        } catch (error) {
            console.error(`Error updating appointment ${id}:`, error);
            throw error;
        }
    },

    deleteAppointment: async (id: string | number) => {
        try {
            const response = await axiosInstance.delete(`/api/school/appointments/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting appointment ${id}:`, error);
            throw error;
        }
    }
};
