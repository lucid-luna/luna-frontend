// ====================================================================
// L.U.N.A. Frontend Type Definitions
// ====================================================================

// API Response Types
export interface InteractResponse {
    text: string;
    emotion: string;
    intent: string;
    style: string;
    audio_url: string;
    input?: string;
    cached: boolean;
    processing_time: number;
}

export interface HealthResponse {
    server: string;
    version: string;
    status: string;
}

export interface UnityStatus {
    connected: boolean;
    client_count: number;
    last_connected: string | null;
    last_disconnected: string | null;
}

// Chat Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    emotion?: string;
    intent?: string;
    audioUrl?: string;
    cached?: boolean;
    processingTime?: number;
}

// Memory Types
export interface Conversation {
    id: number;
    timestamp: string;
    user_message: string;
    assistant_message: string;
    emotion?: string;
    intent?: string;
    processing_time?: number;
    cached?: boolean;
}

export interface ConversationDetail extends Conversation {
    user_id: string;
    session_id: string;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export interface Summary {
    id: number;
    timestamp: string;
    content: string;
    summarized_turns: number;
    created_at: string;
}

export interface MemoryStats {
    total_conversations: number;
    total_summaries: number;
    unique_users: number;
    unique_sessions: number;
    first_conversation: string | null;
    last_conversation: string | null;
    emotions_distribution: Record<string, number>;
    intents_distribution: Record<string, number>;
    avg_processing_time: number;
    cache_hit_rate: number;
    conversations_by_date: Record<string, number>;
}

// MCP Types
export interface MCPTool {
    id: string;
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

export interface MCPServer {
    id: string;
    transport: string;
    command?: string;
    args?: string[];
    cwd?: string;
    url?: string;  // For SSE/HTTP remote servers
    enabled: boolean;
    namespace?: string;
    timeoutMs?: number;
    env?: Record<string, string>;
}

export interface MCPToolCallResult {
    success: boolean;
    result: unknown;
    error?: string;
}

// System Metrics
export interface SystemMetrics {
    cpu_percent: number;
    memory_percent: number;
    gpu_percent: number;
    temperature: number;
    uptime: number;
    active_connections: number;
    timestamp?: string;
}

export interface APIStats {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time: number;
    requests_per_second: number;
}

// Cache Types
export interface CacheStats {
    cache_size: number;
    max_cache_size: number;
    hits: number;
    misses: number;
    total_requests: number;
    hit_rate: number;
}

// Settings Types
export interface Settings {
    notifications: boolean;
    language: string;
    ttsSpeed: number;
    volume: number;
    experimentalFeatures: boolean;

    blendSpeed: number;
    maxIntensity: number;
    showSubtitles: boolean;
    subtitleFontSize: number;
}

export interface UnityCommandPacket {
    type: 'config' | 'command' | 'chat';
    blendSpeed?: number;
    maxIntensity?: number;
    showSubtitles?: boolean;
    subtitleFontSize?: number;
    volume?: number;
    action?: string;
}

// TTS Types
export interface TTSRequest {
    text: string;
    style?: string;
    style_weight?: number;
}

export interface TTSResponse {
    audio_url: string;
    style?: string;
    style_weight?: number;
    cached?: boolean;
}

// Translation Types
export interface TranslateRequest {
    text: string;
    from_lang: string;
    to_lang: string;
}

export interface TranslateResponse {
    translated_text: string;
}

// WebSocket Types
export interface WSMessage {
    type: 'emotion' | 'translation' | 'llm_chunk' | 'complete' | 'error';
    data: unknown;
}

// Log Types
export interface LogEntry {
    id: string;
    timestamp: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    source?: string;
}

// Navigation Types
export type NavigationItem = {
    id: string;
    label: string;
    icon: string;
    path: string;
};
