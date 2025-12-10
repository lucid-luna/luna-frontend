// ====================================================================
// L.U.N.A. System Service - Health, Metrics, Settings, Logs
// ====================================================================

import { apiClient } from './apiClient';
import { config } from '../config';
import type {
    HealthResponse,
    SystemMetrics,
    APIStats,
    Settings,
    CacheStats,
    LogEntry,
} from '../types';

class SystemService {
    // Health check
    async getHealth(): Promise<HealthResponse> {
        return apiClient.get<HealthResponse>(config.endpoints.health);
    }

    // System metrics
    async getSystemMetrics(): Promise<SystemMetrics> {
        return apiClient.get<SystemMetrics>(config.endpoints.metricsSystem);
    }

    // API stats
    async getAPIStats(): Promise<APIStats> {
        return apiClient.get<APIStats>(config.endpoints.metricsApi);
    }

    // Settings
    async getSettings(): Promise<Settings> {
        return apiClient.get<Settings>(config.endpoints.settings);
    }

    async updateSettings(settings: Partial<Settings>): Promise<Settings> {
        return apiClient.put<Settings>(config.endpoints.settings, settings);
    }

    // LLM Cache
    async getLLMCacheStats(): Promise<CacheStats> {
        return apiClient.get<CacheStats>(config.endpoints.llmCacheStats);
    }

    // Cache management
    async getCacheStats(): Promise<CacheStats> {
        return apiClient.get<CacheStats>(config.endpoints.cacheStats);
    }

    async cleanupCache(): Promise<{ status: string; removed: number; message: string }> {
        return apiClient.post(config.endpoints.cacheCleanup);
    }

    async clearCache(): Promise<{ status: string; message: string }> {
        return apiClient.delete(config.endpoints.cacheClear);
    }

    // Logs
    async getLogs(limit: number = 500): Promise<LogEntry[]> {
        return apiClient.get<LogEntry[]>(config.endpoints.logs, { limit });
    }

    // Translation
    async translate(
        text: string,
        fromLang: string,
        toLang: string
    ): Promise<{ translated_text: string }> {
        return apiClient.post(config.endpoints.translate, {
            text,
            from_lang: fromLang,
            to_lang: toLang,
        });
    }

    // Vision analysis
    async analyzeVision(file: File): Promise<{ answer: string }> {
        return apiClient.uploadFile(config.endpoints.analyzeVision, file);
    }

    // Unity status
    async getUnityStatus(): Promise<{
        connected: boolean;
        client_count: number;
        last_connected: string | null;
        last_disconnected: string | null;
    }> {
        return apiClient.get(config.endpoints.unityStatus);
    }

    async sendUnityPacket(type: 'config' | 'command' | 'chat', data: any): Promise<void> {
        const endpoint = '/unity/message';

        return apiClient.post(endpoint, {
            type,
            ...data,
        });
    }
}

export const systemService = new SystemService();
export default systemService;
