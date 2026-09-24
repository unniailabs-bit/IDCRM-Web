import { projectId, publicAnonKey } from '../supabase/info';

export const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-9d5cfccf`;

interface ApiOptions {
  method?: string;
  body?: any;
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body } = options;

  const headers: HeadersInit = {
    Authorization: `Bearer ${publicAnonKey}`,
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      console.error(`API Error (${endpoint}):`, data);
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`Network Error (${endpoint}):`, error);
    throw error;
  }
}
