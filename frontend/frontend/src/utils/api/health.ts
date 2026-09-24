import { apiCall } from './base';

export const healthCheck = async () => {
  return apiCall('/health');
};
