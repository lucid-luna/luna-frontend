// ====================================================================
// L.U.N.A. Frontend Configuration
// ====================================================================

export const config = {
    // API Endpoints
    api: {
        baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8000',
        wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:8000',
    },
    
    // Unity Client
    unity: {
        baseUrl: process.env.REACT_APP_UNITY_URL || 'http://localhost:7777',
    },
    
    // API Paths
    endpoints: {
        // Health
        health: '/health',
        
        // Interaction
        interact: '/interact',
        interactStream: '/interact/stream',
        interactSSE: '/interact/sse',
        
        // LLM
        generate: '/generate',
        llmCacheStats: '/llm/cache/stats',
        
        // TTS
        synthesize: '/synthesize',
        synthesizeParallel: '/synthesize/parallel',
        ttsCacheStats: '/tts/cache/stats',
        ttsCacheCleanup: '/tts/cache/cleanup',
        ttsCacheClear: '/tts/cache/clear',
        
        // Translation
        translate: '/translate',
        
        // Vision
        analyzeVision: '/analyze/vision',
        
        // Memory
        memoryRecent: '/memory/recent',
        memoryClear: '/memory/clear',
        memorySummarize: '/memory/summarize',
        memorySummary: '/memory/summary',
        memoryConversations: '/memory/conversations',
        memoryStats: '/memory/stats',
        memorySummaries: '/memory/summaries',
        
        // Core Memory (장기 기억)
        memoryCoreList: '/memory/core',
        memoryCoreAdd: '/memory/core',
        memoryCoreUpdate: '/memory/core',
        memoryCoreDelete: '/memory/core',
        
        // Working Memory (단기 기억)
        memoryWorkingList: '/memory/working',
        memoryWorkingAdd: '/memory/working',
        memoryWorkingExtend: '/memory/working',
        memoryWorkingDelete: '/memory/working',
        memoryWorkingCleanup: '/memory/working/cleanup',
        
        // Cache
        cacheStats: '/cache/stats',
        cacheCleanup: '/cache/cleanup',
        cacheClear: '/cache/clear',
        
        // MCP
        mcpTools: '/mcp/tools',
        mcpCall: '/mcp/call',
        mcpExternalServers: '/mcp/external/servers',
        mcpExternalReload: '/mcp/external/reload',
        mcpConfigAdd: '/mcp/external/config/add',
        mcpConfigRemove: '/mcp/external/config/remove',
        mcpConfigUpdate: '/mcp/external/config/update',
        
        // Unity
        unityStatus: '/unity/status',
        
        // Settings
        settings: '/settings',
        
        // Metrics
        metricsSystem: '/metrics/system',
        metricsApi: '/metrics/api',
        
        // Logs
        logs: '/logs',
        
        // WebSocket
        wsAsr: '/ws/asr',
    },
    
    // Default Settings
    defaults: {
        language: 'ko',
        ttsSpeed: 1.0,
        volume: 70,
        maxHistoryItems: 50,
        refreshInterval: 5000, // 5 seconds
    },
    
    // Emotion Mappings
    emotions: {
        smile1: { color: '#FFD700', label: '기쁨', icon: '😊' },
        sad1: { color: '#4169E1', label: '슬픔', icon: '😢' },
        anger1: { color: '#DC143C', label: '분노', icon: '😠' },
        yandere1: { color: '#FF1493', label: '사랑', icon: '💕' },
        shy1: { color: '#FF69B4', label: '수줍', icon: '😳' },
        smile2: { color: '#FFD700', label: '신남', icon: '😆' },
        Neutral: { color: '#808080', label: '중립', icon: '😐' },
    },
    
    // Intent Mappings
    intents: {
        question: { label: '질문', icon: '❓' },
        command: { label: '명령', icon: '⚡' },
        greeting: { label: '인사', icon: '👋' },
        farewell: { label: '작별', icon: '👋' },
        chat: { label: '대화', icon: '💬' },
    },
} as const;

export const getEmotionStyle = (emotionKey?: string) => {
    if (!emotionKey) return config.emotions.Neutral;
    const key = emotionKey.toLowerCase() as keyof typeof config.emotions;
    if (Object.prototype.hasOwnProperty.call(config.emotions, key)) {
        return config.emotions[key];
    }
    return config.emotions.Neutral;
};

export default config;
