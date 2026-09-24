import axiosInstance from '../axiosInstance';

interface TrustRegistrationData {
  trust_name: string;
  registration_number: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  full_name: string;
  designation: string;
  admin_email: string;
  admin_phone: string;
  username: string;
  password?: string;
}

export const registerTrust = async (registrationData: TrustRegistrationData) => {
  try {
    const response = await axiosInstance.post('/api/trust/register', registrationData);
    // console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error registering trust:', error);
    throw error;
  }
};
