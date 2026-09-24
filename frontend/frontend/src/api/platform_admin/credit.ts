import axiosInstance from '../axiosInstance';

const mapApiTypeToTransactionType = (apiType: string) => {
  switch (apiType) {
    case 'add':
      return 'Top-up';
    case 'edit':
      return 'Correction';
    case 'deduct':
      return 'Deduction';
    default:
      return 'Unknown';
  }
};

export const getTrustCreditSummary = async () => {
  try {
    const response = await axiosInstance.get('/api/superadmin/trust/credit');
    return response.data;
  } catch (error) {
    console.error('Error fetching trust credit summary:', error);
    throw error;
  }
};

export const topUpTrustCredits = async (
  trustId: number,
  data: { credit: number; reason: string }
) => {
  try {
    const response = await axiosInstance.post(`/api/superadmin/trust/${trustId}/credit`, data);
    return response.data;
  } catch (error) {
    console.error('Error topping up trust credits:', error);
    throw error;
  }
};

export const approveCreditRequest = async (messageId: number, data: { status: string }) => {
  try {
    const response = await axiosInstance.patch(
      `/api/superadmin/superadmin/trust-messages/${messageId}/status`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error approving trust credits request:', error);
    throw error;
  }
};
export const rejectCreditRequest = async (messageId: number, data: { status: string }) => {
  try {
    const response = await axiosInstance.patch(
      `/api/superadmin/superadmin/trust-messages/${messageId}/status`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting trust credits request:', error);
    throw error;
  }
};

export const getCreditHistory = async () => {
  try {
    const response = await axiosInstance.get('/api/superadmin/trust/credit/history');
    if (response.data.success) {
      response.data.data = response.data.data.map((item: any, index: number) => ({
        ...item,
        id: `${item.dateTime}-${index}`, // Create a unique ID
        date: new Date(item.dateTime).toLocaleString(),
        type: mapApiTypeToTransactionType(item.type),
        credits: item.type === 'deduct' ? -item.credits : item.credits,
      }));
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }
};
export const getCreditSummaryAll = async () => {
  try {
    const response = await axiosInstance.get('/api/superadmin/credit-summary-all');
    return response.data;
  } catch (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }
};

export const deductTrustCredits = async (
  trustId: number,
  data: { credit: number; reason: string }
) => {
  try {
    const response = await axiosInstance.post(
      `/api/superadmin/trust/${trustId}/deduct-credit`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error deducting trust credits:', error);
    throw error;
  }
};
