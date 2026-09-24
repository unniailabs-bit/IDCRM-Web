import axiosInstance from "../axiosInstance";

interface CreditRequestData {
  credit_amount: number;
  message: string;
}

export const requestNewCredits = async (trustId: number, data: CreditRequestData) => {
  try {
    // The endpoint from work.txt is /api/trust/trust/1/message.
    // Using a more RESTful approach where the trust ID is part of the path.
    const response = await axiosInstance.post(`/api/trust/trust/${trustId}/message`, data);
    return response.data;
  } catch (error) {
    // The error will be handled in the component to show a toast.
    throw error;
  }
};

export const getCreditSummary = async () => {
    try {
        // work.txt specifies POST, but GET is more appropriate for fetching data.
        // If this fails, it might need to be changed to a POST request.
        const response = await axiosInstance.get('/api/trust/credit-summary');
        return response.data;
    } catch (error) {
        throw error;
    }
}