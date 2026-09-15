import apiClient from '../api/client';
import {
  User,
  UserQuotaResponse,
  UpgradeResponse,
  CustomerPortalResponse,
} from '../../types/api';

export const userService = {
  async getQuota(): Promise<UserQuotaResponse> {
    const response = await apiClient.get<UserQuotaResponse>('/user/quota');
    return response.data;
  },

  async upgradeSubscription(tier: 'premium' | 'pro'): Promise<UpgradeResponse> {
    const response = await apiClient.post<UpgradeResponse>('/user/upgrade', { tier });
    return response.data;
  },

  async getCustomerPortal(): Promise<CustomerPortalResponse> {
    const response = await apiClient.post<CustomerPortalResponse>('/user/portal');
    return response.data;
  },

  async downgradeToFree(): Promise<{ success: boolean; message: string; tier: string }> {
    const response = await apiClient.post<{ success: boolean; message: string; tier: string }>('/user/downgrade');
    return response.data;
  },

  async updateUsername(username: string): Promise<User> {
    const response = await apiClient.put<User>('/auth/username', { username });
    return response.data;
  },

  async checkUsernameAvailability(username: string): Promise<boolean> {
    const response = await apiClient.get<boolean>(`/auth/username/check?username=${encodeURIComponent(username)}`);
    return response.data;
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>('/user/delete-account');
    return response.data;
  },
};

export default userService;
