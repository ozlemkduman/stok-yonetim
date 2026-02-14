import { apiClient, ApiResponse } from '../client';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: string;
  tenant_id: string | null;
  tenant_name: string | null;
  invited_by: string | null;
  inviter_name?: string;
  inviter_email?: string;
  existing_tenant_name?: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  invitationLink?: string;
}

export interface CreateInvitationData {
  email: string;
  role: string;
  tenantId?: string;
  tenantName?: string;
}

export const adminInvitationsApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'accepted' | 'expired';
  }): Promise<ApiResponse<Invitation[]>> {
    return apiClient.get<Invitation[]>('/admin/invitations', params);
  },

  async create(data: CreateInvitationData): Promise<ApiResponse<Invitation>> {
    return apiClient.post<Invitation>('/admin/invitations', data);
  },

  async resend(id: string): Promise<ApiResponse<Invitation>> {
    return apiClient.post<Invitation>(`/admin/invitations/${id}/resend`, {});
  },

  async cancel(id: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/admin/invitations/${id}`);
  },
};
