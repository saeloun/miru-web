import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import { toast } from "sonner";
import {
  clearCredentialsFromLocalStorage,
  getValueFromLocalStorage,
  setValueInLocalStorage,
} from "utils/storage";

interface ApiResponse extends AxiosResponse {
  success?: boolean;
}

interface ApiError extends AxiosError {
  response?: {
    status: number;
    data?: {
      error?: string;
      errors?: string | string[];
      notice?: string;
      reset_session?: boolean;
      jwt?: string;
    };
  };
}

class ApiHandler {
  private axios: AxiosInstance;
  private readonly BASE_URL = "/internal_api/v1";
  private readonly UNAUTHORIZED = 401;
  private readonly LOCKED = 423;

  constructor() {
    this.axios = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.BASE_URL,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": this.getCsrfToken(),
      },
    });
  }

  private getCsrfToken(): string {
    const token = document.querySelector<HTMLMetaElement>('[name="csrf-token"]');
    return token?.getAttribute("content") || "";
  }

  private setupInterceptors(): void {
    this.axios.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    this.axios.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleError(error)
    );
  }

  private handleRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const token = getValueFromLocalStorage("authToken");
    const email = getValueFromLocalStorage("authEmail");

    // Add JWT token if available
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
        "X-Auth-Email": email || "",
        "X-Auth-Token": token, // Keep for backward compatibility
      };
    }

    return config;
  }

  private handleResponse(response: ApiResponse): ApiResponse {
    if (!response) return response;

    const { data, status } = response;
    response.success = status === 200;

    // Store JWT token if provided in response
    if (data?.jwt) {
      setValueInLocalStorage("authToken", data.jwt);
    }

    // Show success message if provided
    if (data && !data.reset_session && data.notice) {
      toast.success(data.notice);
    }

    return response;
  }

  private handleError(error: ApiError): Promise<never> {
    const { response } = error;

    if (response?.status === this.UNAUTHORIZED) {
      this.handleUnauthorized(response.data?.error);
    } else if (response?.status === this.LOCKED) {
      this.handleLocked();
    } else {
      this.showErrorMessage(error);
    }

    return Promise.reject(error);
  }

  private handleUnauthorized(errorMessage?: string): void {
    clearCredentialsFromLocalStorage();
    if (errorMessage) {
      toast.error(errorMessage);
    }
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }

  private handleLocked(): void {
    setTimeout(() => {
      window.location.href = "/";
    }, 500);
  }

  private showErrorMessage(error: ApiError): void {
    const errorMessage = this.extractErrorMessage(error);
    toast.error(errorMessage);
  }

  private extractErrorMessage(error: ApiError): string {
    const { response } = error;
    const data = response?.data;

    if (data?.errors) {
      return Array.isArray(data.errors) ? data.errors.join(", ") : data.errors;
    }

    return (
      data?.error ||
      data?.notice ||
      error.message ||
      "Something went wrong!"
    );
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axios;
  }
}

const apiHandler = new ApiHandler();
export default apiHandler.getAxiosInstance();

// Export the handler class for testing or advanced usage
export { ApiHandler };