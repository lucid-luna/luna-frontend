// ====================================================================
// L.U.N.A. API Client - Base HTTP Client
// ====================================================================

import { config } from '../config';

// Debug log callback type
type DebugLogCallback = (log: {
    type: 'request' | 'response' | 'error' | 'mcp';
    direction: 'outgoing' | 'incoming';
    method?: string;
    endpoint?: string;
    tool?: string;
    status?: number;
    duration?: number;
    data?: unknown;
    error?: string;
}) => void;

let debugLogCallback: DebugLogCallback | null = null;

// Set debug log callback (called from DebugContext)
export const setDebugLogCallback = (callback: DebugLogCallback | null) => {
    debugLogCallback = callback;
};

class ApiClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = config.api.baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const method = options.method || 'GET';
        const startTime = Date.now();
        
        // Log outgoing request
        if (debugLogCallback) {
            const isMCP = endpoint.includes('mcp') || endpoint.includes('tools');
            debugLogCallback({
                type: isMCP ? 'mcp' : 'request',
                direction: 'outgoing',
                method,
                endpoint,
                data: options.body ? JSON.parse(options.body as string) : undefined,
            });
        }
        
        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...defaultHeaders,
                    ...options.headers,
                },
            });

            const duration = Date.now() - startTime;

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail || `HTTP Error: ${response.status}`;
                
                // Log error
                if (debugLogCallback) {
                    debugLogCallback({
                        type: 'error',
                        direction: 'incoming',
                        method,
                        endpoint,
                        status: response.status,
                        duration,
                        error: errorMessage,
                    });
                }
                
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            // Log successful response
            if (debugLogCallback) {
                const isMCP = endpoint.includes('mcp') || endpoint.includes('tools');
                debugLogCallback({
                    type: isMCP ? 'mcp' : 'response',
                    direction: 'incoming',
                    method,
                    endpoint,
                    status: response.status,
                    duration,
                    data,
                });
            }

            return data;
        } catch (error) {
            const duration = Date.now() - startTime;
            
            // Log network error
            if (debugLogCallback && !(error instanceof Error && error.message.startsWith('HTTP Error'))) {
                debugLogCallback({
                    type: 'error',
                    direction: 'incoming',
                    method,
                    endpoint,
                    duration,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
            
            throw error;
        }
    }

    async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                searchParams.append(key, String(value));
            });
            url = `${endpoint}?${searchParams.toString()}`;
        }
        return this.request<T>(url, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
        let url = endpoint;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                searchParams.append(key, String(value));
            });
            url = `${endpoint}?${searchParams.toString()}`;
        }
        return this.request<T>(url, { method: 'DELETE' });
    }

    async uploadFile<T>(endpoint: string, file: File): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
        }

        return response.json();
    }

    // Stream endpoint for SSE
    async *stream(endpoint: string, data?: unknown): AsyncGenerator<unknown> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: data ? JSON.stringify(data) : undefined,
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    try {
                        yield JSON.parse(data);
                    } catch {
                        // Skip non-JSON data
                    }
                }
            }
        }
    }

    getBaseUrl(): string {
        return this.baseUrl;
    }

    getWsUrl(): string {
        return config.api.wsUrl;
    }
}

export const apiClient = new ApiClient();
export default apiClient;
