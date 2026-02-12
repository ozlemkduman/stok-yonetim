import { apiClient, ApiResponse } from './client';

export interface FieldRoute {
  id: string;
  name: string;
  route_date: string;
  assigned_to: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  visit_count?: number;
  completed_count?: number;
}

export interface FieldVisit {
  id: string;
  route_id: string;
  customer_id: string | null;
  contact_id: string | null;
  visit_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  visit_type: 'sales' | 'support' | 'collection' | 'delivery' | 'meeting' | 'other';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_time: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  notes: string | null;
  outcome: string | null;
  photos: string[];
  created_at: string;
  updated_at: string;
  customer_name?: string;
  contact_name?: string;
}

export interface VisitInput {
  customer_id?: string;
  contact_id?: string;
  visit_type: string;
  address?: string;
  scheduled_time?: string;
  notes?: string;
}

export interface CreateRouteInput {
  name: string;
  route_date: string;
  assigned_to?: string;
  notes?: string;
  estimated_duration_minutes?: number;
  visits?: VisitInput[];
}

export interface TodayStats {
  totalRoutes: number;
  completedRoutes: number;
  totalVisits: number;
  completedVisits: number;
}

export interface RouteDetailStats {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  skippedVisits: number;
  inProgressVisits: number;
}

export interface AssignedUser {
  id: string;
  name: string;
}

export interface RouteDetail {
  route: FieldRoute;
  visits: FieldVisit[];
  stats: RouteDetailStats;
  assignedUser: AssignedUser | null;
}

const getRoutes = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
}): Promise<ApiResponse<FieldRoute[]>> => {
  return apiClient.get<FieldRoute[]>('/field-team/routes', params as Record<string, string | number>);
};

const getRoute = (id: string): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.get<FieldRoute>(`/field-team/routes/${id}`);
};

const getRouteVisits = (routeId: string): Promise<ApiResponse<FieldVisit[]>> => {
  return apiClient.get<FieldVisit[]>(`/field-team/routes/${routeId}/visits`);
};

const getRouteDetail = (id: string): Promise<ApiResponse<RouteDetail>> => {
  return apiClient.get<RouteDetail>(`/field-team/routes/${id}/detail`);
};

const getTodayStats = (): Promise<ApiResponse<TodayStats>> => {
  return apiClient.get<TodayStats>('/field-team/routes/stats/today');
};

const createRoute = (data: CreateRouteInput): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.post<FieldRoute>('/field-team/routes', data);
};

const updateRoute = (id: string, data: Partial<CreateRouteInput>): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.patch<FieldRoute>(`/field-team/routes/${id}`, data);
};

const startRoute = (id: string): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.post<FieldRoute>(`/field-team/routes/${id}/start`, {});
};

const completeRoute = (id: string): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.post<FieldRoute>(`/field-team/routes/${id}/complete`, {});
};

const cancelRoute = (id: string): Promise<ApiResponse<FieldRoute>> => {
  return apiClient.post<FieldRoute>(`/field-team/routes/${id}/cancel`, {});
};

const deleteRoute = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/field-team/routes/${id}`);
};

const getVisit = (id: string): Promise<ApiResponse<FieldVisit>> => {
  return apiClient.get<FieldVisit>(`/field-team/visits/${id}`);
};

const updateVisit = (
  id: string,
  data: { status?: string; notes?: string; outcome?: string }
): Promise<ApiResponse<FieldVisit>> => {
  return apiClient.patch<FieldVisit>(`/field-team/visits/${id}`, data);
};

const checkInVisit = (
  id: string,
  location?: { latitude: number; longitude: number }
): Promise<ApiResponse<FieldVisit>> => {
  return apiClient.post<FieldVisit>(`/field-team/visits/${id}/check-in`, location || {});
};

const checkOutVisit = (
  id: string,
  data?: { outcome?: string; latitude?: number; longitude?: number }
): Promise<ApiResponse<FieldVisit>> => {
  return apiClient.post<FieldVisit>(`/field-team/visits/${id}/check-out`, data || {});
};

const skipVisit = (id: string, notes?: string): Promise<ApiResponse<FieldVisit>> => {
  return apiClient.post<FieldVisit>(`/field-team/visits/${id}/skip`, { notes });
};

const deleteVisit = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/field-team/visits/${id}`);
};

export const fieldTeamApi = {
  getRoutes,
  getRoute,
  getRouteVisits,
  getRouteDetail,
  getTodayStats,
  createRoute,
  updateRoute,
  startRoute,
  completeRoute,
  cancelRoute,
  deleteRoute,
  getVisit,
  updateVisit,
  checkInVisit,
  checkOutVisit,
  skipVisit,
  deleteVisit,
};
