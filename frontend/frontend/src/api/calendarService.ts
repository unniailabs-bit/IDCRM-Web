import axiosInstance from './axiosInstance';

export interface CalendarEvent {
  id?: string;
  title: string;
  type: 'HOLIDAY' | 'EVENT' | 'EXAM';
  calendar_date: string; // YYYY-MM-DD
  description?: string;
}

export const calendarService = {
  // Create a new event
  createEvent: async (data: CalendarEvent | { events: CalendarEvent[] }) => {
    const response = await axiosInstance.post('/api/school/calendar/create', data);
    return response.data;
  },

  // Get all events for a school (optionally filter by date range if needed, but usually fetches all or by month)
  // Assuming backend handles filtering or returns all for the year
  getEvents: async (schoolId: string | number) => {
    const response = await axiosInstance.get(`/api/school/calendar/${schoolId}`);
    return response.data;
  },

  // Also support fetching without ID if the route is just /school/calendar and infers from token
  getEventsByToken: async () => {
    const response = await axiosInstance.get('/api/school/calendar');
    return response.data;
  },

  // Update an event
  updateEvent: async (id: string, data: Partial<CalendarEvent>) => {
    const response = await axiosInstance.patch(`/api/school/calendar/${id}`, data);
    return response.data;
  },

  // Delete an event
  // Based on user screenshot, this might be a PATCH, but usually it's DELETE.
  // I will implement standard DELETE.
  deleteEvent: async (id: string) => {
    const response = await axiosInstance.delete(`/api/school/calendar/${id}`);
    return response.data;
  },

  // Delete a range of events
  deleteRange: async (data: { start_date: string; end_date: string; type: string }) => {
    // When sending body with DELETE in axios, use the 'data' property in config object
    const response = await axiosInstance.delete('/api/school/calendar/delete-range', { data });
    return response.data;
  },
};
