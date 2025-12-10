// ====================================================================
// L.U.N.A. Tools Page - MCP Tool Management
// Premium Timeline Design with i18n Support
// ====================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    Wrench,
    RefreshCw,
    Plug,
    Cog,
    FileCode,
    Play,
    Loader2,
    Server,
    Tag,
    Info,
    ChevronRight,
    Sparkles,
    Zap,
    Terminal,
    Settings2,
    Box,
    Code2,
    Copy,
    Check,
    Plus,
    Trash2,
    Edit3,
    X,
    AlertCircle
} from 'lucide-react';
import { mcpService } from '../../services';
import { useTranslation } from '../../hooks/useTranslation';
import type { MCPTool, MCPServer } from '../../types';
import './ToolsPage.css';

// Server Edit Modal Props
interface ServerModalProps {
    isOpen: boolean;
    server?: MCPServer | null;
    onClose: () => void;
    onSave: (config: Partial<MCPServer>) => Promise<void>;
    onDelete?: (serverId: string) => Promise<void>;
}

// Server Modal Component
const ServerModal: React.FC<ServerModalProps> = ({ isOpen, server, onClose, onSave, onDelete }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        id: '',
        command: '',
        args: '',
        cwd: '',
        env: '',
        enabled: true,
        timeoutMs: 8000,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (server) {
            setFormData({
                id: server.id || '',
                command: server.command || '',
                args: server.args?.join(' ') || '',
                cwd: server.cwd || '',
                env: server.env ? JSON.stringify(server.env, null, 2) : '',
                enabled: server.enabled ?? true,
                timeoutMs: server.timeoutMs || 8000,
            });
        } else {
            setFormData({
                id: '',
                command: '',
                args: '',
                cwd: '',
                env: '',
                enabled: true,
                timeoutMs: 8000,
            });
        }
        setError(null);
    }, [server, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);

        try {
            let parsedEnv = {};
            if (formData.env.trim()) {
                try {
                    parsedEnv = JSON.parse(formData.env);
                } catch {
                    setError(t('tools.envJsonError'));
                    setSaving(false);
                    return;
                }
            }

            const config: Partial<MCPServer> = {
                id: formData.id,
                transport: 'stdio',
                command: formData.command,
                args: formData.args.split(',').map(a => a.trim()).filter(Boolean),
                cwd: formData.cwd || undefined,
                env: parsedEnv,
                enabled: formData.enabled,
                timeoutMs: formData.timeoutMs,
            };

            await onSave(config);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tools.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!server?.id || !onDelete) return;
        if (!window.confirm(t('tools.deleteServerConfirm'))) return;

        setSaving(true);
        try {
            await onDelete(server.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : t('tools.deleteError'));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>
                        {server ? <Edit3 size={18} /> : <Plus size={18} />}
                        {server ? t('tools.editServer') : t('tools.newServer')}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && (
                            <div className="modal-error">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label>{t('tools.serverId')} *</label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                placeholder={t('tools.serverIdPlaceholder')}
                                disabled={!!server}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('tools.command')} *</label>
                            <input
                                type="text"
                                value={formData.command}
                                onChange={e => setFormData({ ...formData, command: e.target.value })}
                                placeholder={t('tools.commandPlaceholder')}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('tools.arguments')}</label>
                            <input
                                type="text"
                                value={formData.args}
                                onChange={e => setFormData({ ...formData, args: e.target.value })}
                                placeholder={t('tools.argumentsPlaceholder')}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t('tools.workingDirectory')}</label>
                                <input
                                    type="text"
                                    value={formData.cwd}
                                    onChange={e => setFormData({ ...formData, cwd: e.target.value })}
                                    placeholder={t('tools.workingDirectoryPlaceholder')}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('tools.timeout')}</label>
                                <input
                                    type="number"
                                    value={formData.timeoutMs}
                                    onChange={e => setFormData({ ...formData, timeoutMs: parseInt(e.target.value) || 8000 })}
                                    min={1000}
                                    max={60000}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t('tools.envVariables')}</label>
                            <textarea
                                value={formData.env}
                                onChange={e => setFormData({ ...formData, env: e.target.value })}
                                placeholder={t('tools.envVariablesPlaceholder')}
                                rows={4}
                            />
                        </div>

                        <div className="form-group checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.enabled}
                                    onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                                />
                                <span>{t('tools.enabled')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="modal-footer">
                        {server && onDelete && (
                            <button 
                                type="button" 
                                className="btn-delete" 
                                onClick={handleDelete}
                                disabled={saving}
                            >
                                <Trash2 size={16} />
                                {t('common.delete')}
                            </button>
                        )}
                        <div className="modal-footer-right">
                            <button type="button" className="btn-cancel" onClick={onClose}>
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="btn-save" disabled={saving}>
                                {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                                {server ? t('common.save') : t('common.add')}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Test Result Display
interface TestResult {
    success: boolean;
    data?: unknown;
    error?: string;
    timestamp: number;
}

const ToolsPage: React.FC = () => {
    const { t } = useTranslation();
    const [tools, setTools] = useState<MCPTool[]>([]);
    const [servers, setServers] = useState<MCPServer[]>([]);
    const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
    const [toolArgs, setToolArgs] = useState<Record<string, string>>({});
    const [callResult, setCallResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCallLoading, setIsCallLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<MCPServer | null>(null);
    
    // Selected server for filtering tools
    const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
    
    // Test results history
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    
    // Filtered tools based on selected server
    const filteredTools = selectedServerId
        ? tools.filter(tool => tool.id.startsWith(`${selectedServerId}/`))
        : tools;

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [toolsData, serversData] = await Promise.all([
                mcpService.getTools(),
                mcpService.getServers(),
            ]);
            setTools(toolsData.tools);
            setServers(serversData.servers);
        } catch (error) {
            console.error('Failed to load MCP data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleReload = async () => {
        try {
            await mcpService.reloadServers();
            await loadData();
        } catch (error) {
            console.error('Reload failed:', error);
        }
    };

    const handleToggleServer = async (serverId: string, enabled: boolean) => {
        try {
            await mcpService.toggleServer(serverId, enabled);
            setServers(servers.map(s => 
                s.id === serverId ? { ...s, enabled } : s
            ));
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    // Server Modal Handlers
    const handleAddServer = () => {
        setEditingServer(null);
        setModalOpen(true);
    };

    const handleEditServer = (server: MCPServer) => {
        setEditingServer(server);
        setModalOpen(true);
    };

    const handleSaveServer = async (config: Partial<MCPServer>) => {
        if (editingServer) {
            await mcpService.updateServer(config);
        } else {
            await mcpService.addServer(config);
        }
        await loadData();
    };

    const handleDeleteServer = async (serverId: string) => {
        await mcpService.removeServer(serverId);
        await loadData();
    };

    const handleSelectTool = (tool: MCPTool) => {
        setSelectedTool(tool);
        setToolArgs({});
        setCallResult(null);
    };

    const handleCallTool = async () => {
        if (!selectedTool) return;

        setIsCallLoading(true);
        setCallResult(null);

        try {
            // Parse tool ID (format: "server_id/tool_name")
            const parts = selectedTool.id.split('/');
            const serverId = parts[0];
            const toolName = parts.slice(1).join('/');

            // Parse arguments based on schema
            const parsedArgs: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(toolArgs)) {
                if (value) {
                    try {
                        parsedArgs[key] = JSON.parse(value);
                    } catch {
                        parsedArgs[key] = value;
                    }
                }
            }

            const result = await mcpService.callTool(serverId, toolName, parsedArgs);
            const resultStr = JSON.stringify(result, null, 2);
            setCallResult(resultStr);
            addTestResult(true, result);
        } catch (error) {
            const errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
            setCallResult(errorMsg);
            addTestResult(false, undefined, errorMsg);
        } finally {
            setIsCallLoading(false);
        }
    };

    const getInputFields = (tool: MCPTool) => {
        const schema = tool.inputSchema as { properties?: Record<string, { type: string; description?: string }> };
        if (!schema?.properties) return [];
        
        return Object.entries(schema.properties).map(([key, prop]) => ({
            name: key,
            type: prop.type || 'string',
            description: prop.description || '',
        }));
    };

    const handleCopyResult = async () => {
        if (!callResult) return;
        await navigator.clipboard.writeText(callResult);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Add test result to history
    const addTestResult = (success: boolean, data?: unknown, error?: string) => {
        const result: TestResult = {
            success,
            data,
            error,
            timestamp: Date.now(),
        };
        setTestResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10
    };

    return (
        <div className="tools-page">
            {/* Ambient Background */}
            <div className="tools-ambient">
                <div className="ambient-orb orb-1" />
                <div className="ambient-orb orb-2" />
                <div className="ambient-orb orb-3" />
            </div>

            {/* Header */}
            <header className="tools-header">
                <div className="header-left">
                    <div className="header-icon-wrap">
                        <Wrench size={22} />
                    </div>
                    <div className="header-text">
                        <h1>{t('tools.title')}</h1>
                        <span>{t('tools.subtitle')}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="action-btn" onClick={handleAddServer}>
                        <Plus size={16} />
                        {t('tools.addServer')}
                    </button>
                    <button className="action-btn primary" onClick={handleReload} disabled={isLoading}>
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                        {t('common.refresh')}
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon cyan">
                        <Server size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{servers.length}</span>
                        <span className="stat-label">{t('tools.servers')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Cog size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{tools.length}</span>
                        <span className="stat-label">{t('tools.toolsList')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Zap size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{servers.filter(s => s.enabled).length}</span>
                        <span className="stat-label">{t('tools.activeServers')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Box size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{testResults.length}</span>
                        <span className="stat-label">{t('tools.tests')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="tools-main">
                {/* Servers Panel */}
                <div className="servers-panel">
                    <div className="panel-header">
                        <h3>
                            <Plug size={18} />
                            MCP {t('tools.servers')}
                        </h3>
                        <span className="badge">{servers.length}</span>
                    </div>
                    <div className="panel-scroll">
                        {servers.length === 0 ? (
                            <div className="state-empty">
                                <Server size={36} />
                                <p>{t('tools.noServers')}</p>
                                <span>{t('tools.noServersHint')}</span>
                                <button className="empty-action" onClick={handleAddServer}>
                                    <Plus size={14} />
                                    {t('tools.addServer')}
                                </button>
                            </div>
                        ) : (
                            <div className="server-list">
                                {servers.map((server) => (
                                    <div 
                                        key={server.id} 
                                        className={`server-card ${server.enabled ? 'enabled' : ''} ${selectedServerId === server.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedServerId(selectedServerId === server.id ? null : server.id)}
                                    >
                                        <div className="server-status">
                                            <div className={`status-dot ${server.enabled ? 'active' : ''}`} />
                                        </div>
                                        <div className="server-body">
                                            <div className="server-name">
                                                <Terminal size={14} />
                                                {server.id}
                                            </div>
                                            <div className="server-tags">
                                                <span className="tag">
                                                    <Settings2 size={10} />
                                                    {server.transport}
                                                </span>
                                                {server.namespace && (
                                                    <span className="tag namespace">{server.namespace}</span>
                                                )}
                                            </div>
                                        </div>
                                        <button 
                                            className="server-edit"
                                            onClick={(e) => { e.stopPropagation(); handleEditServer(server); }}
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <label className="toggle" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={server.enabled}
                                                onChange={(e) => handleToggleServer(server.id, e.target.checked)}
                                            />
                                            <span className="toggle-track" />
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tools Panel */}
                <div className="tools-panel">
                    <div className="panel-header">
                        <h3>
                            <Code2 size={18} />
                            {t('tools.toolsList')}
                            {selectedServerId && (
                                <span className="header-filter-tag">{selectedServerId}</span>
                            )}
                        </h3>
                        <span className="badge">{filteredTools.length}</span>
                    </div>
                    <div className="panel-scroll">
                        {isLoading ? (
                            <div className="state-empty">
                                <div className="loader" />
                                <p>{t('common.loading')}</p>
                            </div>
                        ) : filteredTools.length === 0 ? (
                            <div className="state-empty">
                                <Sparkles size={36} />
                                <p>{selectedServerId ? t('tools.noToolsForServer') : t('tools.noTools')}</p>
                                <span>{selectedServerId ? t('tools.noToolsForServerHint') : t('tools.noToolsHint')}</span>
                            </div>
                        ) : (
                            <div className="tool-list">
                                {filteredTools.map((tool) => (
                                    <div
                                        key={tool.id}
                                        className={`tool-card ${selectedTool?.id === tool.id ? 'selected' : ''}`}
                                        onClick={() => handleSelectTool(tool)}
                                    >
                                        <div className="tool-timeline">
                                            <div className="timeline-dot" />
                                            <div className="timeline-line" />
                                        </div>
                                        <div className="tool-body">
                                            <div className="tool-name">
                                                <Cog size={14} />
                                                {tool.name}
                                            </div>
                                            <p className="tool-desc">{tool.description}</p>
                                        </div>
                                        <ChevronRight size={16} className="tool-arrow" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Panel */}
                <div className="detail-panel">
                    {selectedTool ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>
                                    <FileCode size={18} />
                                    {selectedTool.name}
                                </h3>
                                <span className="detail-id">{selectedTool.id}</span>
                            </div>

                            <div className="detail-meta">
                                <div className="meta-item">
                                    <Info size={14} />
                                    <span>{selectedTool.description}</span>
                                </div>
                            </div>

                            <div className="detail-params">
                                <label className="section-label">
                                    <Tag size={12} />
                                    {t('tools.parameters')}
                                </label>
                                <div className="params-form">
                                    {getInputFields(selectedTool).length === 0 ? (
                                        <p className="no-params">{t('tools.noParams')}</p>
                                    ) : (
                                        getInputFields(selectedTool).map((field) => (
                                            <div key={field.name} className="param-field">
                                                <div className="param-label">
                                                    <span>{field.name}</span>
                                                    <span className="param-type">{field.type}</span>
                                                </div>
                                                {field.description && (
                                                    <span className="param-desc">{field.description}</span>
                                                )}
                                                <input
                                                    type="text"
                                                    value={toolArgs[field.name] || ''}
                                                    onChange={(e) => setToolArgs({ ...toolArgs, [field.name]: e.target.value })}
                                                    placeholder={`${field.type} 값 입력...`}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                className="execute-btn"
                                onClick={handleCallTool}
                                disabled={isCallLoading}
                            >
                                {isCallLoading ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <Play size={18} />
                                )}
                                {t('tools.execute')}
                            </button>

                            {callResult && (
                                <div className="result-section">
                                    <div className="result-header">
                                        <label className="section-label">
                                            <Terminal size={12} />
                                            {t('tools.executionResult')}
                                        </label>
                                        <button className="copy-btn" onClick={handleCopyResult}>
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <pre className="result-code">{callResult}</pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="detail-empty">
                            <div className="empty-icon">
                                <Sparkles size={32} />
                            </div>
                            <h4>{t('tools.selectTool')}</h4>
                            <p>{t('tools.selectToolHint')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Server Modal */}
            <ServerModal
                isOpen={modalOpen}
                server={editingServer}
                onClose={() => {
                    setModalOpen(false);
                    setEditingServer(null);
                }}
                onSave={handleSaveServer}
                onDelete={handleDeleteServer}
            />
        </div>
    );
};

export default ToolsPage;
