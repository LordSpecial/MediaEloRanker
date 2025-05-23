/**
 * Common API response types
 */

export interface ApiResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

export interface PaginatedResponse<T> {
    results: T[];
    page: number;
    total_pages: number;
    total_results: number;
}

export interface ErrorResponse {
    status_code?: number;
    status_message?: string;
    success?: boolean;
    errors?: string[];
    message?: string;
} 