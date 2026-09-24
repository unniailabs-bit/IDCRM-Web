import axiosInstance from './axiosInstance';

export interface StudentFormData {
  id: number;
  roll_number: string;
  first_name: string;
  last_name: string;
  dob: string;
  gender: string;
  blood_group: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  street_address: string;
  city: string;
  state: string;
  pin_code: string;
  emergency_contact: string;
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  class_name?: string;
  division_name?: string;
  status?: string;
  fields_requiring_correction?: { [key: string]: boolean };
  correction_field_notes?: { [key: string]: string };
  correction_notes?: string;
  requires_correction?: boolean;
}

export const studentFormService = {
  // Get form with corrections
  getForm: async (formId: number): Promise<{ success: boolean; data: StudentFormData }> => {
    const response = await axiosInstance.get(`/api/school/student-forms/${formId}`);
    return response.data;
  },

  // Mark fields for correction
  markFieldsForCorrection: async (
    formId: number,
    data: {
      fields_requiring_correction: { [key: string]: boolean };
      correction_field_notes: { [key: string]: string };
      general_notes?: string;
    }
  ) => {
    const response = await axiosInstance.post(
      `/api/school/student-forms/${formId}/mark-fields-correction`,
      data
    );
    return response.data;
  },

  // Send correction link
  sendCorrectionLink: async (formId: number, sendVia: string) => {
    const response = await axiosInstance.post(
      `/api/school/student-forms/${formId}/send-correction-link`,
      { send_via: sendVia }
    );
    return response.data;
  },

  // Update student form
  updateForm: async (formId: number, data: Partial<StudentFormData>) => {
    const response = await axiosInstance.patch(
      `/api/school/student-forms/${formId}`,
      data
    );
    return response.data;
  },

  // Toggle form active
  toggleFormActive: async (formId: number, isActive: boolean) => {
    const response = await axiosInstance.patch(
      `/api/school/student-forms/${formId}/toggle-active`,
      { is_active: isActive }
    );
    return response.data;
  },
};

