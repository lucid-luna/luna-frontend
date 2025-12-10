/**
 * L.U.N.A. Debug Panel
 * MCP 통신 로그 및 API 요청 모니터링
 * 실험적 기능에서 활성화
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
    Bug, 
    X, 
    Trash2, 
    ChevronDown, 
    ChevronRight,
    Send,
    ArrowDownLeft,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Minimize2,
    Maximize2,
    Copy
} from 'lucide-react';
import './DebugPanel.css';

export interface DebugLog {
    id: string;
    timestamp: Date;
    type: 'request' | 'response' | 'error' | 'mcp' | 'websocket';
    direction: 'outgoing' | 'incoming';
    method?: string;
    endpoint?: string;
    tool?: string;
    status?: number;
    duration?: number;
    data?: any;
    error?: string;
}

interface DebugPanelProps {
    isOpen: boolean;
    onClose: () => void;
    logs: DebugLog[];
    onClearLogs: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose, logs, onClearLogs }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<string>('all');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (logsEndRef.current && !isMinimized) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isMinimized]);

    if (!isOpen) return null;

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const copyToClipboard = (data: any) => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.type === filter;
    });

    const getLogIcon = (log: DebugLog) => {
        if (log.type === 'error') return <XCircle size={14} />;
        if (log.direction === 'outgoing') return <Send size={14} />;
        return <ArrowDownLeft size={14} />;
    };

    const getStatusIcon = (log: DebugLog) => {
        if (log.error) return <XCircle size={12} className="status-error" />;
        if (log.status && log.status >= 200 && log.status < 300) {
            return <CheckCircle size={12} className="status-success" />;
        }
        if (log.status && log.status >= 400) {
            return <AlertCircle size={12} className="status-error" />;
        }
        return null;
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            fractionalSecondDigits: 3
        });
    };

    return (
        <div className={`debug-panel ${isMinimized ? 'minimized' : ''}`}>
            {/* Header */}
            <div className="debug-header">
                <div className="debug-title">
                    <Bug size={16} />
                    <span>Debug Panel</span>
                    <span className="log-count">{logs.length}</span>
                </div>
                <div className="debug-actions">
                    <select 
                        className="debug-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="request">API Requests</option>
                        <option value="response">Responses</option>
                        <option value="mcp">MCP</option>
                        <option value="websocket">WebSocket</option>
                        <option value="error">Errors</option>
                    </select>
                    <button className="debug-btn" onClick={onClearLogs} title="Clear logs">
                        <Trash2 size={14} />
                    </button>
                    <button 
                        className="debug-btn" 
                        onClick={() => setIsMinimized(!isMinimized)}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                    </button>
                    <button className="debug-btn" onClick={onClose} title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div className="debug-content">
                    {filteredLogs.length === 0 ? (
                        <div className="debug-empty">
                            <Bug size={32} />
                            <p>No logs yet</p>
                            <span>API requests and MCP communications will appear here</span>
                        </div>
                    ) : (
                        <div className="debug-logs">
                            {filteredLogs.map(log => (
                                <div 
                                    key={log.id} 
                                    className={`debug-log ${log.type} ${log.direction} ${log.error ? 'has-error' : ''}`}
                                >
                                    <div 
                                        className="log-header"
                                        onClick={() => log.data && toggleExpand(log.id)}
                                    >
                                        <span className="log-expand">
                                            {log.data ? (
                                                expandedLogs.has(log.id) ? 
                                                    <ChevronDown size={12} /> : 
                                                    <ChevronRight size={12} />
                                            ) : <span className="expand-placeholder" />}
                                        </span>
                                        <span className={`log-icon ${log.direction}`}>
                                            {getLogIcon(log)}
                                        </span>
                                        <span className="log-type">{log.type.toUpperCase()}</span>
                                        <span className="log-info">
                                            {log.method && <span className="log-method">{log.method}</span>}
                                            {log.endpoint && <span className="log-endpoint">{log.endpoint}</span>}
                                            {log.tool && <span className="log-tool">{log.tool}</span>}
                                        </span>
                                        <span className="log-meta">
                                            {getStatusIcon(log)}
                                            {log.status && <span className="log-status">{log.status}</span>}
                                            {log.duration && (
                                                <span className="log-duration">
                                                    <Clock size={10} />
                                                    {log.duration}ms
                                                </span>
                                            )}
                                        </span>
                                        <span className="log-time">{formatTime(log.timestamp)}</span>
                                    </div>
                                    
                                    {expandedLogs.has(log.id) && log.data && (
                                        <div className="log-details">
                                            <button 
                                                className="copy-btn"
                                                onClick={() => copyToClipboard(log.data)}
                                            >
                                                <Copy size={12} />
                                                Copy
                                            </button>
                                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                        </div>
                                    )}
                                    
                                    {log.error && (
                                        <div className="log-error">
                                            {log.error}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DebugPanel;
