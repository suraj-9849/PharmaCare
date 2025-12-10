import { API_BASE_URL, STORAGE_KEYS } from './constants';
import type { ApiResponse, PaginatedResponse } from './types';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    params?: Record<string, unknown>
  ): Promise<T> {
    const token = this.getToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint, params);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  }

  // GET request with optional query params
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, params);
  }

  // GET paginated request
  async getPaginated<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<PaginatedResponse<T>> {
    return this.request<PaginatedResponse<T>>(endpoint, { method: 'GET' }, params);
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<ApiResponse<T>>(endpoint, { method: 'DELETE' });
  }

  // Auth endpoints
  auth = {
    login: (email: string, password: string) =>
      this.post<{ token: string; user: unknown }>('/auth/login', { email, password }),
    me: () => this.get<unknown>('/auth/me'),
    validate: () => this.post<{ valid: boolean; user: unknown }>('/auth/validate'),
  };

  // Dashboard endpoints
  dashboard = {
    getStats: () => this.get<unknown>('/dashboard'),
    getChart: (days = 7) => this.get<unknown>(`/dashboard/chart?days=${days}`),
    getTopSelling: (limit = 5) => this.get<unknown>(`/dashboard/top-selling?limit=${limit}`),
  };

  // Drugs endpoints
  drugs = {
    getAll: (page = 1, limit = 10, search = '') =>
      this.getPaginated<unknown>(`/drugs?page=${page}&limit=${limit}&search=${search}`),
    getById: (id: string) => this.get<unknown>(`/drugs/${id}`),
    getCategories: () => this.get<unknown>('/drugs/categories'),
    getLowStock: () => this.get<unknown>('/drugs/low-stock'),
    create: (data: unknown) => this.post<unknown>('/drugs', data),
    update: (id: string, data: unknown) => this.put<unknown>(`/drugs/${id}`, data),
    delete: (id: string) => this.delete<unknown>(`/drugs/${id}`),
  };

  // Inventory endpoints
  inventory = {
    getAll: (page = 1, limit = 10, drugId = '') =>
      this.getPaginated<unknown>(`/inventory?page=${page}&limit=${limit}&drugId=${drugId}`),
    getById: (id: string) => this.get<unknown>(`/inventory/${id}`),
    getSummary: () => this.get<unknown>('/inventory/summary'),
    getExpiring: (days = 30) => this.get<unknown>(`/inventory/expiring?days=${days}`),
    getExpired: () => this.get<unknown>('/inventory/expired'),
    getAvailable: (drugId: string) => this.get<unknown>(`/inventory/drug/${drugId}/available`),
    create: (data: unknown) => this.post<unknown>('/inventory', data),
    update: (id: string, data: unknown) => this.put<unknown>(`/inventory/${id}`, data),
    delete: (id: string) => this.delete<unknown>(`/inventory/${id}`),
  };

  // Sales endpoints
  sales = {
    getAll: (page = 1, limit = 10, startDate = '', endDate = '') =>
      this.getPaginated<unknown>(
        `/sales?page=${page}&limit=${limit}&startDate=${startDate}&endDate=${endDate}`
      ),
    getById: (id: string) => this.get<unknown>(`/sales/${id}`),
    getToday: () => this.get<unknown>('/sales/today'),
    getStats: (period = 'day') => this.get<unknown>(`/sales/stats?period=${period}`),
    create: (data: unknown) => this.post<unknown>('/sales', data),
    cancel: (id: string) => this.post<unknown>(`/sales/${id}/cancel`),
  };

  // Suppliers endpoints
  suppliers = {
    getAll: (page = 1, limit = 10, search = '') =>
      this.getPaginated<unknown>(`/suppliers?page=${page}&limit=${limit}&search=${search}`),
    getById: (id: string) => this.get<unknown>(`/suppliers/${id}`),
    getSimple: () => this.get<unknown>('/suppliers/simple'),
    create: (data: unknown) => this.post<unknown>('/suppliers', data),
    update: (id: string, data: unknown) => this.put<unknown>(`/suppliers/${id}`, data),
    delete: (id: string) => this.delete<unknown>(`/suppliers/${id}`),
  };

  // Customers endpoints
  customers = {
    getAll: (page = 1, limit = 10, search = '') =>
      this.getPaginated<unknown>(`/customers?page=${page}&limit=${limit}&search=${search}`),
    getById: (id: string) => this.get<unknown>(`/customers/${id}`),
    search: (q: string) => this.get<unknown>(`/customers/search?q=${q}`),
    create: (data: unknown) => this.post<unknown>('/customers', data),
    update: (id: string, data: unknown) => this.put<unknown>(`/customers/${id}`, data),
    delete: (id: string) => this.delete<unknown>(`/customers/${id}`),
  };

  // Chatbot endpoints
  chatbot = {
    chat: (message: string, history: { role: string; content: string }[] = []) =>
      this.post<{
        response: string;
        sql?: string;
        data?: Record<string, unknown>[];
        columns?: string[];
        error?: string;
      }>('/chatbot/chat', { message, history }),
    health: () => this.get<{ status: string; database: string; model: string }>('/chatbot/health'),
    clear: () => this.post<{ cleared: boolean }>('/chatbot/clear'),
  };

  // Agent endpoints
  agent = {
    chat: (message: string, history: { role: string; content: string }[] = []) =>
      this.post<{
        response: string;
        tools_used?: string[];
      }>('/agent/chat', { message, history }),
    health: () => this.get<{ status: string }>('/agent/health'),
    inventory: () => this.get<unknown[]>('/agent/inventory'),
    clear: () => this.post<{ cleared: boolean }>('/agent/clear'),
  };

  // File upload for agent (FormData)
  async uploadInventory(
    file: File
  ): Promise<ApiResponse<{ message: string; added_count: number; errors: string[] }>> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/agent/upload-inventory`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  }
  // Invoice endpoints (Image Recognition with Gemini AI)
  invoices = {
    extract: async (file: File): Promise<ApiResponse<unknown>> => {
      const token = this.getToken();
      const formData = new FormData();
      formData.append('invoice', file);

      const response = await fetch(`${this.baseUrl}/invoices/extract`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to extract invoice data');
      }
      return data;
    },
    process: (extractedData: unknown) => this.post<unknown>('/invoices/process', { extractedData }),
    test: () => this.get<unknown>('/invoices/test'),
  };

  // Prescription endpoints (Image Recognition with Gemini AI)
  prescriptions = {
    scan: async (file: File): Promise<ApiResponse<unknown>> => {
      const token = this.getToken();
      const formData = new FormData();
      formData.append('prescription', file);

      const response = await fetch(`${this.baseUrl}/prescriptions/scan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to scan prescription');
      }
      return data;
    },
    checkAvailability: (medications: unknown) =>
      this.post<unknown>('/prescriptions/check-availability', { medications }),
    purchase: (
      prescriptionData: unknown,
      availabilityResults: unknown,
      paymentMethod: string,
      customerId?: string,
      customerName?: string,
      customerPhone?: string,
      customerEmail?: string,
      customerAddress?: string
    ) =>
      this.post<unknown>('/prescriptions/purchase', {
        prescriptionData,
        availabilityResults,
        paymentMethod,
        customerId,
        customerName,
        customerPhone,
        customerEmail,
        customerAddress,
      }),
    test: () => this.get<unknown>('/prescriptions/test'),
  };
}

export const apiClient = new ApiClient(API_BASE_URL);
