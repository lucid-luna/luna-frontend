/**
 * L.U.N.A. Debug Context
 * 디버그 로그 관리 및 실험적 기능 상태 관리
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DebugLog } from '../components/Debug';
import { setDebugLogCallback } from '../services';

interface DebugContextType {
    // Debug Panel
    logs: DebugLog[];
    isDebugPanelOpen: boolean;
    addLog: (log: Omit<DebugLog, 'id' | 'timestamp'>) => void;
    clearLogs: () => void;
    toggleDebugPanel: () => void;
    setDebugPanelOpen: (open: boolean) => void;
}

const DebugContext = createContext<DebugContextType | null>(null);

const generateId = () => `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [logs, setLogs] = useState<DebugLog[]>([]);
    const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);

    const addLog = useCallback((log: Omit<DebugLog, 'id' | 'timestamp'>) => {
        const newLog: DebugLog = {
            ...log,
            id: generateId(),
            timestamp: new Date(),
        };
        setLogs(prev => [...prev.slice(-499), newLog]); // Keep last 500 logs
    }, []);

    // Connect apiClient to debug logging
    useEffect(() => {
        setDebugLogCallback((log) => {
            addLog(log);
        });
        
        return () => {
            setDebugLogCallback(null);
        };
    }, [addLog]);

    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    const toggleDebugPanel = useCallback(() => {
        setIsDebugPanelOpen(prev => !prev);
    }, []);

    const setDebugPanelOpen = useCallback((open: boolean) => {
        setIsDebugPanelOpen(open);
    }, []);

    return (
        <DebugContext.Provider value={{
            logs,
            isDebugPanelOpen,
            addLog,
            clearLogs,
            toggleDebugPanel,
            setDebugPanelOpen,
        }}>
            {children}
        </DebugContext.Provider>
    );
};

export const useDebug = (): DebugContextType => {
    const context = useContext(DebugContext);
    if (!context) {
        throw new Error('useDebug must be used within a DebugProvider');
    }
    return context;
};

export default DebugProvider;
