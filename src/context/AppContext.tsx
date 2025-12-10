// ====================================================================
// L.U.N.A. App Context - Global State Management
// ====================================================================

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ChatMessage, Settings, HealthResponse, SystemMetrics } from '../types';
import { systemService } from '../services';
import { config } from '../config';

// State Types
interface UnityStatus {
    connected: boolean;
    clientCount: number;
    lastConnected: string | null;
    lastDisconnected: string | null;
}

interface AppState {
    // Connection
    isConnected: boolean;
    serverHealth: HealthResponse | null;
    unityStatus: UnityStatus;
    
    // Chat
    messages: ChatMessage[];
    isLoading: boolean;
    isStreaming: boolean;
    currentStreamContent: string;
    
    // Audio
    isRecording: boolean;
    isPlaying: boolean;
    volume: number;
    
    // System
    systemMetrics: SystemMetrics | null;
    
    // Settings
    settings: Settings;
    
    // UI
    sidebarOpen: boolean;
    currentView: string;
    
    // Error
    error: string | null;
}

// Action Types
type AppAction =
    | { type: 'SET_CONNECTED'; payload: boolean }
    | { type: 'SET_SERVER_HEALTH'; payload: HealthResponse | null }
    | { type: 'SET_UNITY_STATUS'; payload: UnityStatus }
    | { type: 'ADD_MESSAGE'; payload: ChatMessage }
    | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
    | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_STREAMING'; payload: boolean }
    | { type: 'UPDATE_STREAM_CONTENT'; payload: string }
    | { type: 'CLEAR_STREAM_CONTENT' }
    | { type: 'SET_RECORDING'; payload: boolean }
    | { type: 'SET_PLAYING'; payload: boolean }
    | { type: 'SET_VOLUME'; payload: number }
    | { type: 'SET_SYSTEM_METRICS'; payload: SystemMetrics | null }
    | { type: 'SET_SETTINGS'; payload: Settings }
    | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
    | { type: 'TOGGLE_SIDEBAR' }
    | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
    | { type: 'SET_CURRENT_VIEW'; payload: string }
    | { type: 'SET_ERROR'; payload: string | null };

// Initial State
const initialState: AppState = {
    isConnected: false,
    serverHealth: null,
    unityStatus: {
        connected: false,
        clientCount: 0,
        lastConnected: null,
        lastDisconnected: null,
    },
    messages: [],
    isLoading: false,
    isStreaming: false,
    currentStreamContent: '',
    isRecording: false,
    isPlaying: false,
    volume: config.defaults.volume / 100,
    systemMetrics: null,
    settings: {
        notifications: true,
        language: config.defaults.language,
        ttsSpeed: config.defaults.ttsSpeed,
        volume: config.defaults.volume,
        experimentalFeatures: false,

        blendSpeed: 2.0,
        maxIntensity: 100,
        showSubtitles: true,
        subtitleFontSize: 36,
    },
    sidebarOpen: true,
    currentView: 'chat',
    error: null,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        case 'SET_CONNECTED':
            return { ...state, isConnected: action.payload };
        case 'SET_SERVER_HEALTH':
            return { ...state, serverHealth: action.payload };
        case 'SET_UNITY_STATUS':
            return { ...state, unityStatus: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'UPDATE_MESSAGE':
            return {
                ...state,
                messages: state.messages.map((msg) =>
                msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg
                ),
            };
        case 'SET_MESSAGES':
            return { ...state, messages: action.payload };
        case 'CLEAR_MESSAGES':
            return { ...state, messages: [] };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_STREAMING':
            return { ...state, isStreaming: action.payload };
        case 'UPDATE_STREAM_CONTENT':
            return { ...state, currentStreamContent: state.currentStreamContent + action.payload };
        case 'CLEAR_STREAM_CONTENT':
            return { ...state, currentStreamContent: '' };
        case 'SET_RECORDING':
            return { ...state, isRecording: action.payload };
        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };
        case 'SET_VOLUME':
            return { ...state, volume: action.payload };
        case 'SET_SYSTEM_METRICS':
            return { ...state, systemMetrics: action.payload };
        case 'SET_SETTINGS':
            return { ...state, settings: action.payload };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };
        case 'TOGGLE_SIDEBAR':
            return { ...state, sidebarOpen: !state.sidebarOpen };
        case 'SET_SIDEBAR_OPEN':
            return { ...state, sidebarOpen: action.payload };
        case 'SET_CURRENT_VIEW':
            return { ...state, currentView: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        default:
            return state;
    }
}

// Context Types
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
    actions: {
        checkHealth: () => Promise<void>;
        checkUnityStatus: () => Promise<void>;
        fetchSystemMetrics: () => Promise<void>;
        fetchSettings: () => Promise<void>;
        updateSettings: (settings: Partial<Settings>) => Promise<void>;

        sendToUnity: (type: 'config' | 'command', data: any) => Promise<void>;
    };
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
export function AppProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // Check server health
    const checkHealth = useCallback(async () => {
        try {
        const health = await systemService.getHealth();
            dispatch({ type: 'SET_SERVER_HEALTH', payload: health });
            dispatch({ type: 'SET_CONNECTED', payload: health.status === 'healthy' });
            dispatch({ type: 'SET_ERROR', payload: null });
        } catch (error) {
            dispatch({ type: 'SET_CONNECTED', payload: false });
            dispatch({ type: 'SET_SERVER_HEALTH', payload: null });
            dispatch({
                type: 'SET_ERROR',
                payload: '서버에 연결할 수 없습니다. luna-core가 실행 중인지 확인하세요.',
            });
        }
    }, []);

    // Check Unity status
    const checkUnityStatus = useCallback(async () => {
        try {
            const status = await systemService.getUnityStatus();
            dispatch({
                type: 'SET_UNITY_STATUS',
                payload: {
                    connected: status.connected,
                    clientCount: status.client_count,
                    lastConnected: status.last_connected,
                    lastDisconnected: status.last_disconnected,
                },
            });
        } catch (error) {
            // Unity 상태 조회 실패 시 연결 안 됨으로 처리
            dispatch({
                type: 'SET_UNITY_STATUS',
                payload: {
                    connected: false,
                    clientCount: 0,
                    lastConnected: null,
                    lastDisconnected: null,
                },
            });
        }
    }, []);

    // Fetch system metrics
    const fetchSystemMetrics = useCallback(async () => {
        try {
            const metrics = await systemService.getSystemMetrics();
            dispatch({ type: 'SET_SYSTEM_METRICS', payload: metrics });
        } catch (error) {
            console.error('Failed to fetch system metrics:', error);
        }
    }, []);

    // Fetch settings
    const fetchSettings = useCallback(async () => {
        try {
            const settings = await systemService.getSettings();
            dispatch({ type: 'SET_SETTINGS', payload: settings });
            dispatch({ type: 'SET_VOLUME', payload: settings.volume / 100 });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    }, []);

    const sendToUnity = useCallback(async (type: 'config' | 'command', data: any) => {
        try {
            await systemService.sendUnityPacket(type, data);
        } catch (error) {
            console.error('Failed to send to Unity:', error);
        }
    }, []);

    const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
        try {
            const updated = await systemService.updateSettings(newSettings);
            dispatch({ type: 'SET_SETTINGS', payload: updated });
            
            if (newSettings.volume !== undefined) {
                dispatch({ type: 'SET_VOLUME', payload: newSettings.volume / 100 });
            }

            const unityKeys = ['blendSpeed', 'maxIntensity', 'showSubtitles', 'subtitleFontSize', 'volume'];
            const hasUnityChanges = Object.keys(newSettings).some(key => unityKeys.includes(key));

            if (hasUnityChanges) {
                const unityPacket = {
                    ...state.settings,
                    ...newSettings,
                    volume: (newSettings.volume !== undefined ? newSettings.volume : state.settings.volume) / 100
                };
                
                await sendToUnity('config', unityPacket);
            }

        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    }, [state.settings, sendToUnity]);

    useEffect(() => {
        checkHealth();
        checkUnityStatus();
        fetchSettings();

        const healthInterval = setInterval(checkHealth, 30000);
        const unityInterval = setInterval(checkUnityStatus, 5000);
        
        return () => {
            clearInterval(healthInterval);
            clearInterval(unityInterval);
        };
    }, [checkHealth, checkUnityStatus, fetchSettings]);

    const actions = {
        checkHealth,
        checkUnityStatus,
        fetchSystemMetrics,
        fetchSettings,
        updateSettings,
        sendToUnity,
    };

    return (
        <AppContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </AppContext.Provider>
    );
}

// Custom Hook
export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
