// ====================================================================
// L.U.N.A. Memory Service - Conversation History & Summaries
// ====================================================================

import { apiClient } from './apiClient';
import { config } from '../config';
import type {
    Conversation,
    ConversationDetail,
    Summary,
    MemoryStats,
} from '../types';

interface ConversationsResponse {
    conversations: Conversation[];
    count: number;
    limit: number;
    offset: number;
}

interface SummariesResponse {
    summaries: Summary[];
    count: number;
}

interface SearchResponse {
    results: Conversation[];
    total: number;
    count: number;
    limit: number;
    offset: number;
}

// Core Memory (장기 기억) 타입
export interface CoreMemory {
    id: number;
    user_id: string;
    category: string;
    key: string;
    value: string;
    importance: number;
    source?: string;
    created_at: string;
    updated_at: string;
}

export interface CoreMemoryCreate {
    category: string;
    key: string;
    value: string;
    importance?: number;
    source?: string;
}

// Working Memory (단기 기억) 타입
export interface WorkingMemory {
    id: number;
    user_id: string;
    session_id: string;
    topic: string;
    content: string;
    importance: number;
    created_at: string;
    expires_at: string;
}

export interface WorkingMemoryCreate {
    topic: string;
    content: string;
    importance?: number;
    expires_days?: number;
}

class MemoryService {
    // Get recent conversations
    async getRecentConversations(count: number = 10): Promise<Conversation[]> {
        const response = await apiClient.get<{ recent_conversations: Conversation[] }>(
        config.endpoints.memoryRecent,
        { count }
        );
        return response.recent_conversations;
    }

    // Get conversations with pagination
    async getConversations(
        userId: string = 'default',
        sessionId: string = 'default',
        limit: number = 50,
        offset: number = 0
    ): Promise<ConversationsResponse> {
        return apiClient.get<ConversationsResponse>(config.endpoints.memoryConversations, {
            user_id: userId,
            session_id: sessionId,
            limit,
            offset,
        });
    }

    // Get single conversation by ID
    async getConversation(conversationId: number): Promise<ConversationDetail> {
        return apiClient.get<ConversationDetail>(
            `${config.endpoints.memoryConversations}/${conversationId}`
        );
    }

    // Search conversations
    async searchConversations(params: {
        userId?: string;
        sessionId?: string;
        keyword?: string;
        emotion?: string;
        intent?: string;
        limit?: number;
        offset?: number;
    }): Promise<SearchResponse> {
        return apiClient.post<SearchResponse>(
            `${config.endpoints.memoryConversations}/search`,
            params
        );
    }

    // Delete conversation
    async deleteConversation(conversationId: number): Promise<{ status: string; message: string }> {
        return apiClient.delete(`${config.endpoints.memoryConversations}/${conversationId}`);
    }

    // Get summaries
    async getSummaries(
        userId: string = 'default',
        sessionId: string = 'default',
        limit: number = 10
    ): Promise<SummariesResponse> {
        return apiClient.get<SummariesResponse>(config.endpoints.memorySummaries, {
            user_id: userId,
            session_id: sessionId,
            limit,
        });
    }

    // Get current summary
    async getSummary(): Promise<{ summary: string | null; message?: string }> {
        return apiClient.get(config.endpoints.memorySummary);
    }

    // Force summarize
    async forceSummarize(): Promise<{ status: string; message: string; summary?: string }> {
        return apiClient.post(config.endpoints.memorySummarize);
    }

    // Get memory stats
    async getStats(userId?: string, sessionId?: string): Promise<MemoryStats> {
        const params: Record<string, string> = {};
        if (userId) params.user_id = userId;
        if (sessionId) params.session_id = sessionId;
        return apiClient.get<MemoryStats>(config.endpoints.memoryStats, params);
    }

    // Clear memory
    async clearMemory(
        userId: string = 'default',
        sessionId: string = 'default',
        confirm: boolean = true
    ): Promise<{ status: string; deleted_conversations: number; message: string }> {
        return apiClient.delete(config.endpoints.memoryClear, {
            user_id: userId,
            session_id: sessionId,
            confirm,
        });
    }

    // ====================================================================
    // Core Memory (장기 기억) API
    // ====================================================================

    async getCoreMemories(category?: string, minImportance: number = 1): Promise<{
        memories: CoreMemory[];
        count: number;
        categories: string[];
    }> {
        const params: Record<string, string | number> = { min_importance: minImportance };
        if (category) params.category = category;
        return apiClient.get(config.endpoints.memoryCoreList, params);
    }

    async createCoreMemory(data: CoreMemoryCreate): Promise<{ status: string; memory: CoreMemory }> {
        return apiClient.post(config.endpoints.memoryCoreAdd, {
            category: data.category,
            key: data.key,
            value: data.value,
            importance: data.importance || 5,
            source: data.source,
        });
    }

    async updateCoreMemory(id: number, data: { value?: string; importance?: number }): Promise<{ status: string; memory: CoreMemory }> {
        return apiClient.put(`${config.endpoints.memoryCoreUpdate}/${id}`, data);
    }

    async deleteCoreMemory(id: number): Promise<{ status: string; message: string }> {
        return apiClient.delete(`${config.endpoints.memoryCoreDelete}/${id}`);
    }

    // ====================================================================
    // Working Memory (단기 기억) API
    // ====================================================================

    async getWorkingMemories(topic?: string, includeExpired: boolean = false): Promise<{
        memories: WorkingMemory[];
        count: number;
    }> {
        const params: Record<string, string | number> = { include_expired: includeExpired ? 1 : 0 };
        if (topic) params.topic = topic;
        return apiClient.get(config.endpoints.memoryWorkingList, params);
    }

    async createWorkingMemory(data: { topic: string; content: string; importance?: number; ttl_days?: number }): Promise<{ status: string; memory: WorkingMemory }> {
        return apiClient.post(config.endpoints.memoryWorkingAdd, {
            topic: data.topic,
            content: data.content,
            importance: data.importance || 3,
            ttl_days: data.ttl_days || 3,
        });
    }

    async extendWorkingMemory(memoryId: number, days: number = 3): Promise<{ status: string; message: string }> {
        return apiClient.post(`${config.endpoints.memoryWorkingExtend}/${memoryId}/extend`, { days });
    }

    async deleteWorkingMemory(id: number): Promise<{ status: string; message: string }> {
        return apiClient.delete(`${config.endpoints.memoryWorkingDelete}/${id}`);
    }

    async cleanupExpiredMemories(): Promise<{ status: string; deleted_count: number; message: string }> {
        return apiClient.delete(config.endpoints.memoryWorkingCleanup);
    }
}

export const memoryService = new MemoryService();
export default memoryService;
