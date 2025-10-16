/**
 * API Service
 * 
 * Centralized API client for communicating with the backend
 */

const API_BASE_URL = (import.meta.env?.VITE_API_URL as string) || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
        ...data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }

  // Ideas API
  async createIdea(name: string, description: string) {
    return this.request('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async listIdeas() {
    return this.request('/api/ideas', {
      method: 'GET',
    });
  }

  async getIdea(id: string) {
    return this.request(`/api/ideas/${id}`, {
      method: 'GET',
    });
  }

  async executeWorkflow(ideaId: string, stage: string) {
    return this.request(`/api/ideas/${ideaId}/execute-workflow`, {
      method: 'POST',
      body: JSON.stringify({ stage }),
    });
  }

  async getIdeaStatus(ideaId: string) {
    return this.request(`/api/ideas/${ideaId}/status`, {
      method: 'GET',
    });
  }
}

export const api = new ApiService();
export default api;
