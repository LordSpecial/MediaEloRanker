import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError, AuthenticationError, ForbiddenError, ResourceNotFoundError, ServerError } from './errors';

export class BaseApiClient {
    protected client: AxiosInstance;

    constructor(baseURL: string, defaultParams: Record<string, string> = {}) {
        this.client = axios.create({
            baseURL,
            params: defaultParams
        });
    }

    protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.get(url, config);
            return response.data;
        } catch (error) {
            console.error(`API Get Error: ${url}`, error);
            throw this.handleError(error);
        }
    }

    protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.post(url, data, config);
            return response.data;
        } catch (error) {
            console.error(`API Post Error: ${url}`, error);
            throw this.handleError(error);
        }
    }

    protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.put(url, data, config);
            return response.data;
        } catch (error) {
            console.error(`API Put Error: ${url}`, error);
            throw this.handleError(error);
        }
    }

    protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.delete(url, config);
            return response.data;
        } catch (error) {
            console.error(`API Delete Error: ${url}`, error);
            throw this.handleError(error);
        }
    }

    protected handleError(error: unknown): Error {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            const status = axiosError.response?.status;
            const message = axiosError.response?.data?.message || axiosError.message;
            
            switch (status) {
                case 401:
                    return new AuthenticationError('Authentication required. Please login.');
                case 403:
                    return new ForbiddenError('You do not have permission to access this resource.');
                case 404:
                    return new ResourceNotFoundError('The requested resource was not found.');
                case 500:
                case 502:
                case 503:
                case 504:
                    return new ServerError(`Server error: ${message}`);
                default:
                    return new ApiError(`API Error: ${message}`, status);
            }
        }
        
        return error instanceof Error ? error : new Error('An unknown error occurred');
    }
} 