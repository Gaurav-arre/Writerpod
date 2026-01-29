import axios, { AxiosResponse } from 'axios';
import { 
  User, 
  Story, 
  Chapter, 
  LoginForm, 
  RegisterForm, 
  StoryForm, 
  ChapterForm, 
  StoryFilters, 
  UserFilters,
  Voice,
  BackgroundMusic,
  DashboardAnalytics,
  StoryAnalytics,

  PaginatedResponse,
  Publication,
  Chat,
  Message
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: LoginForm): Promise<AxiosResponse<{ message: string; token: string; user: User }>> => 
    api.post('/auth/login', data),
  
  register: (data: RegisterForm): Promise<AxiosResponse<{ message: string; token: string; user: User }>> => 
    api.post('/auth/register', data),
  
  getMe: (): Promise<AxiosResponse<{ user: User }>> => 
    api.get('/auth/me'),
  
  updateProfile: (data: Partial<User>): Promise<AxiosResponse<{ message: string; user: User }>> => 
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<{ message: string }>> => 
    api.post('/auth/change-password', data),
};

// Stories API
export const storiesAPI = {
  getStories: (filters?: StoryFilters): Promise<AxiosResponse<{ stories: Story[]; pagination: any }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/stories?${params.toString()}`);
  },
  
  getStory: (id: string): Promise<AxiosResponse<{ story: Story }>> => 
    api.get(`/stories/${id}`),
  
  createStory: (data: StoryForm): Promise<AxiosResponse<{ message: string; story: Story }>> => 
    api.post('/stories', data),
  
  updateStory: (id: string, data: Partial<StoryForm>): Promise<AxiosResponse<{ message: string; story: Story }>> => 
    api.put(`/stories/${id}`, data),
  
  deleteStory: (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/stories/${id}`),
  
  likeStory: (id: string): Promise<AxiosResponse<{ message: string; isLiked: boolean; totalLikes: number }>> => 
    api.post(`/stories/${id}/like`),
  
  bookmarkStory: (id: string): Promise<AxiosResponse<{ message: string; isBookmarked: boolean }>> => 
    api.post(`/stories/${id}/bookmark`),
  
  rateStory: (id: string, rating: number): Promise<AxiosResponse<{ message: string; averageRating: number; totalRatings: number }>> => 
    api.post(`/stories/${id}/rate`, { rating }),
};

// Chapters API
export const chaptersAPI = {
  getChaptersByStory: (storyId: string, page?: number): Promise<AxiosResponse<PaginatedResponse<Chapter>>> => 
    api.get(`/chapters/story/${storyId}?page=${page || 1}`),
  
  getNextChapterNumber: (storyId: string): Promise<AxiosResponse<{ nextNumber: number }>> => 
    api.get(`/chapters/story/${storyId}/next-number`),
  
  getChapter: (id: string): Promise<AxiosResponse<{ chapter: Chapter }>> => 
    api.get(`/chapters/${id}`),
  
  createChapter: (data: ChapterForm & { story: string }): Promise<AxiosResponse<{ message: string; chapter: Chapter }>> => 
    api.post('/chapters', data),
  
  updateChapter: (id: string, data: Partial<ChapterForm>): Promise<AxiosResponse<{ message: string; chapter: Chapter }>> => 
    api.put(`/chapters/${id}`, data),
  
  deleteChapter: (id: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/chapters/${id}`),
  
  likeChapter: (id: string): Promise<AxiosResponse<{ message: string; isLiked: boolean; totalLikes: number }>> => 
    api.post(`/chapters/${id}/like`),
  
  addComment: (id: string, content: string): Promise<AxiosResponse<{ message: string; comment: any }>> => 
    api.post(`/chapters/${id}/comment`, { content }),
  
  deleteComment: (chapterId: string, commentId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/chapters/${chapterId}/comment/${commentId}`),
};

// Users API
export const usersAPI = {
  getUsers: (filters?: UserFilters): Promise<AxiosResponse<PaginatedResponse<User>>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/users?${params.toString()}`);
  },
  
  getUser: (username: string): Promise<AxiosResponse<{ user: User & { stories: Story[] } }>> => 
    api.get(`/users/${username}`),
  
  followUser: (id: string): Promise<AxiosResponse<{ message: string; isFollowing: boolean }>> => 
    api.post(`/users/${id}/follow`),
  
  getUserStories: (id: string, page?: number): Promise<AxiosResponse<PaginatedResponse<Story>>> => 
    api.get(`/users/${id}/stories?page=${page || 1}`),
  
  getFollowers: (id: string, page?: number): Promise<AxiosResponse<PaginatedResponse<User>>> => 
    api.get(`/users/${id}/followers?page=${page || 1}`),
  
  getFollowing: (id: string, page?: number): Promise<AxiosResponse<PaginatedResponse<User>>> => 
    api.get(`/users/${id}/following?page=${page || 1}`),
  
  getBookmarks: (page?: number): Promise<AxiosResponse<PaginatedResponse<Story>>> => 
    api.get(`/users/me/bookmarks?page=${page || 1}`),
  
  getMyStories: (page?: number): Promise<AxiosResponse<PaginatedResponse<Story>>> => 
    api.get(`/users/me/stories?page=${page || 1}`),
  
  getFeed: (page?: number): Promise<AxiosResponse<PaginatedResponse<Story>>> => 
    api.get(`/users/me/feed?page=${page || 1}`),
};

// Text-to-Speech API
export const ttsAPI = {
  generateAudio: (text: string, options?: { voice?: string; speed?: number; pitch?: number; stability?: number; clarity?: number }): Promise<AxiosResponse<{ message: string; audioFile: string; audioUrl: string; settings: any }>> => 
    api.post('/tts/generate', { text, ...options }),
  
  generateChapterAudio: (chapterId: string, options?: { voice?: string; speed?: number; pitch?: number; stability?: number; clarity?: number; saveVersion?: boolean }): Promise<AxiosResponse<{ message: string; chapter: any }>> => 
    api.post(`/tts/chapter/${chapterId}`, options),
  
  updateChapterSettings: (chapterId: string, settings: { audioSettings?: any; backgroundMusic?: any; characterVoices?: any[]; soundEffects?: any[] }): Promise<AxiosResponse<any>> =>
    api.put(`/tts/chapter/${chapterId}/settings`, settings),
  
  getChapterVersions: (chapterId: string): Promise<AxiosResponse<{ currentAudio: any; versionHistory: any[] }>> =>
    api.get(`/tts/chapter/${chapterId}/versions`),
  
  restoreChapterVersion: (chapterId: string, version: number): Promise<AxiosResponse<any>> =>
    api.post(`/tts/chapter/${chapterId}/restore/${version}`),
  
  getVoices: (): Promise<AxiosResponse<{ voices: Voice[]; groupedVoices: any; defaultVoice: string }>> => 
    api.get('/tts/voices'),
  
  getBackgroundMusic: (): Promise<AxiosResponse<{ backgroundMusic: BackgroundMusic[]; groupedMusic: any; defaultMusic: string }>> => 
    api.get('/tts/background-music'),
  
  getSoundEffects: (): Promise<AxiosResponse<{ soundEffects: any[]; groupedEffects: any }>> =>
    api.get('/tts/sound-effects'),
  
  deleteChapterAudio: (chapterId: string): Promise<AxiosResponse<{ message: string }>> => 
    api.delete(`/tts/chapter/${chapterId}/audio`),
};

// Analytics API
export const analyticsAPI = {
  getDashboardAnalytics: (): Promise<AxiosResponse<DashboardAnalytics>> => 
    api.get('/analytics/dashboard'),
  
  getDashboard: (): Promise<AxiosResponse<DashboardAnalytics>> => 
    api.get('/analytics/dashboard'),
  
  getStoryAnalytics: (storyId: string): Promise<AxiosResponse<StoryAnalytics>> => 
    api.get(`/analytics/story/${storyId}`),
  
  getChapterAnalytics: (chapterId: string): Promise<AxiosResponse<any>> => 
    api.get(`/analytics/chapter/${chapterId}`),
  
  getAudienceAnalytics: (): Promise<AxiosResponse<any>> => 
    api.get('/analytics/audience'),
};

// Publications API
export const publicationsAPI = {
  getPublications: (filters?: { search?: string; sort?: string; page?: number; limit?: number }): Promise<AxiosResponse<any>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/publications?${params.toString()}`);
  },
  
  getPublication: (id: string): Promise<AxiosResponse<any>> => 
    api.get(`/publications/${id}`),
  
  createPublication: (data: Partial<Publication>): Promise<AxiosResponse<any>> => 
    api.post('/publications', data),
  
  updatePublication: (id: string, data: Partial<Publication>): Promise<AxiosResponse<any>> => 
    api.put(`/publications/${id}`, data),
  
  deletePublication: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/publications/${id}`),
  
  subscribe: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/publications/${id}/subscribe`),
  
  unsubscribe: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/publications/${id}/unsubscribe`),
};

// Chats API
export const chatsAPI = {
  getChats: (publicationId: string, filters?: { tag?: string; page?: number; limit?: number }): Promise<AxiosResponse<any>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/chats/publication/${publicationId}?${params.toString()}`);
  },
  
  getChat: (id: string): Promise<AxiosResponse<any>> => 
    api.get(`/chats/${id}`),
  
  createChat: (data: Partial<Chat>): Promise<AxiosResponse<any>> => 
    api.post('/chats', data),
  
  updateChat: (id: string, data: Partial<Chat>): Promise<AxiosResponse<any>> => 
    api.put(`/chats/${id}`, data),
  
  deleteChat: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/chats/${id}`),
  
  likeChat: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/chats/${id}/like`),
};

// Messages API
export const messagesAPI = {
  getMessages: (chatId: string, filters?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/messages/chat/${chatId}?${params.toString()}`);
  },
  
  createMessage: (data: Partial<Message>): Promise<AxiosResponse<any>> => 
    api.post('/messages', data),
  
  updateMessage: (id: string, data: Partial<Message>): Promise<AxiosResponse<any>> => 
    api.put(`/messages/${id}`, data),
  
  deleteMessage: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/messages/${id}`),
  
  likeMessage: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/messages/${id}/like`),
};

// Notes API
export const notesAPI = {
  getNotes: (filters?: { author?: string; hashtag?: string; page?: number; limit?: number }): Promise<AxiosResponse<any>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/notes?${params.toString()}`);
  },
  
  getNoteFeed: (filters?: { page?: number; limit?: number }): Promise<AxiosResponse<any>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return api.get(`/notes/feed?${params.toString()}`);
  },
  
  getNote: (id: string): Promise<AxiosResponse<any>> => 
    api.get(`/notes/${id}`),
  
  createNote: (data: Partial<any>): Promise<AxiosResponse<any>> => 
    api.post('/notes', data),
  
  updateNote: (id: string, data: Partial<any>): Promise<AxiosResponse<any>> => 
    api.put(`/notes/${id}`, data),
  
  deleteNote: (id: string): Promise<AxiosResponse<any>> => 
    api.delete(`/notes/${id}`),
  
  likeNote: (id: string): Promise<AxiosResponse<any>> => 
    api.post(`/notes/${id}/like`),
  
  repostNote: (id: string, data: { content?: string }): Promise<AxiosResponse<any>> => 
    api.post(`/notes/${id}/repost`, data),
};

// AI API
export const aiAPI = {
  generateStory: (data: {
    topic: string;
    characters?: Array<{ name: string; role: string; description: string }>;
    mood?: string;
    genre?: string;
    length?: 'short' | 'medium' | 'long';
    additionalPrompt?: string;
  }): Promise<AxiosResponse<{ success: boolean; story: string; metadata: any }>> =>
    api.post('/ai/generate-story', data),

  enhanceText: (data: { text: string; action: 'improve' | 'expand' | 'simplify' | 'dialogue' | 'emotional' }): Promise<AxiosResponse<{ success: boolean; original: string; enhanced: string }>> =>
    api.post('/ai/enhance-text', data),

  suggestTitles: (data: { content: string; genre?: string }): Promise<AxiosResponse<{ success: boolean; titles: string[] }>> =>
    api.post('/ai/suggest-title', data),

  searchImages: (query: string, page?: number, per_page?: number): Promise<AxiosResponse<{ success: boolean; images: Array<{ id: string; url: string; thumb: string; alt: string; photographer: string; source: string }>; total: number }>> =>
    api.get(`/ai/search-images?query=${encodeURIComponent(query)}&page=${page || 1}&per_page=${per_page || 20}`),

  getGravatar: (email: string, size?: number): Promise<AxiosResponse<{ success: boolean; url: string; hash: string }>> =>
    api.get(`/ai/gravatar/${encodeURIComponent(email)}?size=${size || 200}`),
};

// Export the axios instance for direct use if needed
export default api;