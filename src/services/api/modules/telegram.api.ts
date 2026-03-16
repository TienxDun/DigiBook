import { apiClient, handleApiError } from '../client';

export interface TelegramLinkTokenResponse {
  token: string;
  startLink: string;
  expiresAtUtc: string;
}

export interface TelegramLinkStatusResponse {
  isLinked: boolean;
  telegramChatId: string;
  hasPendingToken: boolean;
  pendingTokenExpiresAt?: string;
}

export const telegramApi = {
  async createLinkToken(userId: string): Promise<TelegramLinkTokenResponse> {
    try {
      const { data } = await apiClient.post<TelegramLinkTokenResponse>('/api/telegram/link-token', { userId });
      return data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async getLinkStatus(userId: string): Promise<TelegramLinkStatusResponse> {
    try {
      const { data } = await apiClient.get<TelegramLinkStatusResponse>(`/api/telegram/link-status/${userId}`);
      return data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  async unlink(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/telegram/unlink/${userId}`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
};
