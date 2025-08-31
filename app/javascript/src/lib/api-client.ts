// lib/api-client.ts
// Base API client with interceptors and error handling

import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { toast } from "@/components/ui/use-toast";

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.VITE_API_URL || "/api/v1",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true, // For Rails CSRF tokens
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      config => {
        // Add CSRF token for Rails
        const token = document
          .querySelector('meta[name="csrf-token"]')
          ?.getAttribute("content");
        if (token) {
          config.headers["X-CSRF-Token"] = token;
        }

        // Add auth token and email if available
        const authToken = this.getAuthToken();
        const authEmail = this.getAuthEmail();
        if (authToken && authEmail) {
          config.headers["X-Auth-Token"] = authToken;
          config.headers["X-Auth-Email"] = authEmail;
        }

        return config;
      },
      error => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => response,
      error => {
        const apiError = this.handleError(error);

        // Show error toast for non-401 errors
        if (apiError.status !== 401) {
          toast({
            title: "Error",
            description: apiError.message,
            variant: "destructive",
          });
        }

        // Handle 401 - redirect to login
        if (apiError.status === 401) {
          window.location.href = "/login";
        }

        return Promise.reject(apiError);
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      // Server responded with error
      return {
        message:
          error.response.data?.error ||
          error.response.data?.message ||
          "An error occurred",
        status: error.response.status,
        details: error.response.data,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: "No response from server. Please check your connection.",
        code: "NETWORK_ERROR",
      };
    }

    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    };
  }

  private getAuthToken(): string | null {
    // Get token from localStorage
    return localStorage.getItem("authToken");
  }

  private getAuthEmail(): string | null {
    // Get email from stored user data
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.email;
      } catch (e) {
        console.error("Failed to parse user data:", e);
      }
    }
    return null;
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);

    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);

    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);

    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);

    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);

    return response.data;
  }

  // Upload method for file uploads
  async upload<T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }
}

export const apiClient = new ApiClient();
