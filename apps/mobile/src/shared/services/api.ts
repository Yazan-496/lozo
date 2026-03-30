import axios from 'axios';
import { useAuthStore } from '../stores/auth';

// Change this to your server URL
const BASE_URL = 'http://192.168.1.100:5000';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export { BASE_URL };

// Contacts API
export const contactsApi = {
  getContacts: () => api.get('/contacts'),
  getPending: () => api.get('/contacts/pending'),
  search: (query: string) => api.get(`/contacts/search?q=${query}`),
  sendRequest: (userId: string) => api.post(`/contacts/request/${userId}`),
  accept: (contactId: string) => api.post(`/contacts/accept/${contactId}`),
  reject: (contactId: string) => api.post(`/contacts/reject/${contactId}`),
  setNickname: (contactId: string, nickname: string | null) =>
    api.put(`/contacts/${contactId}/nickname`, { nickname }),
  setMyNickname: (contactId: string, myNickname: string | null) =>
    api.put(`/contacts/${contactId}/myNickname`, { myNickname }),
  setRelationshipType: (contactId: string, relationshipType: 'friend' | 'lover') =>
    api.put(`/contacts/${contactId}/relationship`, { relationshipType }),
  removeContact: (contactId: string) => api.delete(`/contacts/${contactId}`),
  blockContact: (userId: string) => api.post(`/contacts/block/${userId}`),
};

// Chat API
export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId: string, limit = 50, offset = 0) =>
    api.get(`/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`),
  sendMessage: (conversationId: string, content: string, type = 'text') =>
    api.post(`/chat/conversations/${conversationId}/messages`, { content, type }),
  deleteConversation: (conversationId: string, scope: 'me' | 'everyone') =>
    api.delete(`/chat/conversations/${conversationId}`, { params: { scope } }),
};
