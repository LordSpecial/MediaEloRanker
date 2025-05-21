// API error classes for better error handling
export class ApiError extends Error {
    public status?: number;
    
    constructor(message: string, status?: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        
        // This is needed for proper error inheritance in TypeScript
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

export class AuthenticationError extends ApiError {
    constructor(message: string = 'Authentication required') {
        super(message, 401);
        this.name = 'AuthenticationError';
        
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Access forbidden') {
        super(message, 403);
        this.name = 'ForbiddenError';
        
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }
}

export class ResourceNotFoundError extends ApiError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'ResourceNotFoundError';
        
        Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
    }
}

export class ServerError extends ApiError {
    constructor(message: string = 'Server error') {
        super(message, 500);
        this.name = 'ServerError';
        
        Object.setPrototypeOf(this, ServerError.prototype);
    }
}

export class NetworkError extends ApiError {
    constructor(message: string = 'Network error') {
        super(message);
        this.name = 'NetworkError';
        
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
} 