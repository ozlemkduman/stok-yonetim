import { apiClient } from './client';

export interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  hire_date: string | null;
  salary: number | null;
  commission_rate: number;
  user_id: string | null;
  user_name?: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateEmployeeData {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  hire_date?: string;
  salary?: number;
  commission_rate?: number;
  user_id?: string;
  notes?: string;
  is_active?: boolean;
}

export type UpdateEmployeeData = Partial<CreateEmployeeData>;

export const employeesApi = {
  getAll: (params: Record<string, string | number> = {}) => apiClient.get<Employee[]>('/employees', params),
  getById: (id: string) => apiClient.get<Employee>(`/employees/${id}`),
  create: (data: CreateEmployeeData) => apiClient.post<Employee>('/employees', data),
  update: (id: string, data: UpdateEmployeeData) => apiClient.patch<Employee>(`/employees/${id}`, data),
  delete: (id: string) => apiClient.delete<{ message: string }>(`/employees/${id}`),
};
