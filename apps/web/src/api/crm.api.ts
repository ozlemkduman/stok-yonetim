import { apiClient, ApiResponse } from './client';

export interface CrmContact {
  id: string;
  customer_id: string | null;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: 'website' | 'referral' | 'social' | 'cold_call' | 'event' | 'other' | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  assigned_to: string | null;
  last_contact_date: string | null;
  next_follow_up: string | null;
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface CrmActivity {
  id: string;
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject: string;
  description: string | null;
  status: 'planned' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  outcome: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contact_name?: string;
}

export interface CreateContactInput {
  customer_id?: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  status?: CrmContact['status'];
  source?: CrmContact['source'];
  notes?: string;
  custom_fields?: Record<string, unknown>;
  assigned_to?: string;
  next_follow_up?: string;
}

export interface CreateActivityInput {
  contact_id: string;
  type: CrmActivity['type'];
  subject: string;
  description?: string;
  status?: CrmActivity['status'];
  scheduled_at?: string;
  duration_minutes?: number;
  outcome?: Record<string, unknown>;
}

export interface ContactStats {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
}

const getContacts = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
}): Promise<ApiResponse<CrmContact[]>> => {
  return apiClient.get<CrmContact[]>('/crm/contacts', params as Record<string, string | number>);
};

const getContact = (id: string): Promise<ApiResponse<CrmContact>> => {
  return apiClient.get<CrmContact>(`/crm/contacts/${id}`);
};

const getContactStats = (): Promise<ApiResponse<ContactStats>> => {
  return apiClient.get<ContactStats>('/crm/contacts/stats');
};

const getContactActivities = (contactId: string): Promise<ApiResponse<CrmActivity[]>> => {
  return apiClient.get<CrmActivity[]>(`/crm/contacts/${contactId}/activities`);
};

const createContact = (data: CreateContactInput): Promise<ApiResponse<CrmContact>> => {
  return apiClient.post<CrmContact>('/crm/contacts', data);
};

const updateContact = (id: string, data: Partial<CreateContactInput>): Promise<ApiResponse<CrmContact>> => {
  return apiClient.patch<CrmContact>(`/crm/contacts/${id}`, data);
};

const deleteContact = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/crm/contacts/${id}`);
};

const getActivities = (params?: {
  page?: number;
  limit?: number;
  contactId?: string;
  type?: string;
  status?: string;
}): Promise<ApiResponse<CrmActivity[]>> => {
  return apiClient.get<CrmActivity[]>('/crm/activities', params as Record<string, string | number>);
};

const createActivity = (data: CreateActivityInput): Promise<ApiResponse<CrmActivity>> => {
  return apiClient.post<CrmActivity>('/crm/activities', data);
};

const updateActivity = (id: string, data: Partial<CreateActivityInput>): Promise<ApiResponse<CrmActivity>> => {
  return apiClient.patch<CrmActivity>(`/crm/activities/${id}`, data);
};

const completeActivity = (id: string): Promise<ApiResponse<CrmActivity>> => {
  return apiClient.post<CrmActivity>(`/crm/activities/${id}/complete`, {});
};

const deleteActivity = (id: string): Promise<ApiResponse<void>> => {
  return apiClient.delete<void>(`/crm/activities/${id}`);
};

export const crmApi = {
  getContacts,
  getContact,
  getContactStats,
  getContactActivities,
  createContact,
  updateContact,
  deleteContact,
  getActivities,
  createActivity,
  updateActivity,
  completeActivity,
  deleteActivity,
};
