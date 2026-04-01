import Constants from 'expo-constants';
import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../stores/auth';

const DEFAULT_PORT = '5000';

function normalizeBaseUrl(value: string): string {
    return value.replace(/\/$/, '').replace(/\/api$/, '');
}

function getExpoHostUrl(): string | null {
    const hostUri = Constants.expoConfig?.hostUri;
    if (!hostUri) {
        return null;
    }

    const [hostname] = hostUri.split(':');
    if (!hostname) {
        return null;
    }

    return `http://${hostname}:${DEFAULT_PORT}`;
}

function getLocalhostUrl(): string {
    return Platform.OS === 'android'
        ? `http://10.0.2.2:${DEFAULT_PORT}`
        : `http://127.0.0.1:${DEFAULT_PORT}`;
}

function resolveBaseUrl(): string {
    const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
    if (envUrl) {
        return normalizeBaseUrl(envUrl);
    }

    const expoHostUrl = getExpoHostUrl();
    if (expoHostUrl) {
        return expoHostUrl;
    }

    return getLocalhostUrl();
}

const BASE_URL = resolveBaseUrl();

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
    toggleMute: (contactId: string) => api.put(`/contacts/${contactId}/mute`),
    getBlockedUsers: () => api.get('/contacts/blocked'),
    unblockUser: (userId: string) => api.delete(`/contacts/block/${userId}`),
    getBlockStatus: (userId: string) =>
        api.get<{ iBlockedThem: boolean; amBlockedByThem: boolean }>(
            `/contacts/block-status/${userId}`,
        ),
};

// Chat API
export const chatApi = {
    getConversations: () => api.get('/chat/conversations'),
    getOrCreateConversation: (userId: string) => api.post(`/chat/conversations/${userId}`),
    getMessages: (conversationId: string, limit = 50, offset = 0) =>
        api.get(`/chat/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`),
    sendMessage: (conversationId: string, content: string, type = 'text') =>
        api.post(`/chat/conversations/${conversationId}/messages`, { content, type }),
    deleteConversation: (conversationId: string, scope: 'me' | 'everyone') =>
        api.delete(`/chat/conversations/${conversationId}`, { params: { scope } }),
};
