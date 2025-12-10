/**
 * L.U.N.A. Advanced MCP Settings
 * 커스텀 서버 추가, 환경변수 관리, 타임아웃 설정 등
 * 실험적 기능에서 활성화
 */

import React, { useState } from 'react';
import { 
    Plus, 
    Trash2, 
    Save, 
    Server, 
    Clock, 
    Key, 
    Terminal,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Check,
    X
} from 'lucide-react';
import './AdvancedMCPSettings.css';

interface CustomMCPServer {
    id: string;
    name: string;
    command: string;
    args: string[];
    env: Record<string, string>;
    enabled: boolean;
}

interface AdvancedMCPSettingsProps {
    settings: {
        timeout: number;
        maxConnections: number;
        autoStart: string[];
        customServers: CustomMCPServer[];
        envVariables: Record<string, string>;
    };
    onSettingsChange: (settings: any) => void;
    installedServers: string[];
}

const AdvancedMCPSettings: React.FC<AdvancedMCPSettingsProps> = ({
    settings,
    onSettingsChange,
    installedServers
}) => {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['timeout', 'autostart'])
    );
    const [newServer, setNewServer] = useState<Partial<CustomMCPServer>>({
        name: '',
        command: 'npx',
        args: [],
        env: {},
        enabled: true
    });
    const [newEnvKey, setNewEnvKey] = useState('');
    const [newEnvValue, setNewEnvValue] = useState('');
    const [showAddServer, setShowAddServer] = useState(false);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            } else {
                newSet.add(section);
            }
            return newSet;
        });
    };

    const handleTimeoutChange = (value: number) => {
        onSettingsChange({ ...settings, timeout: value });
    };

    const handleMaxConnectionsChange = (value: number) => {
        onSettingsChange({ ...settings, maxConnections: value });
    };

    const toggleAutoStart = (serverId: string) => {
        const newAutoStart = settings.autoStart.includes(serverId)
            ? settings.autoStart.filter(id => id !== serverId)
            : [...settings.autoStart, serverId];
        onSettingsChange({ ...settings, autoStart: newAutoStart });
    };

    const addCustomServer = () => {
        if (!newServer.name || !newServer.command) return;
        
        const server: CustomMCPServer = {
            id: `custom-${Date.now()}`,
            name: newServer.name || '',
            command: newServer.command || 'npx',
            args: newServer.args || [],
            env: newServer.env || {},
            enabled: true
        };
        
        onSettingsChange({
            ...settings,
            customServers: [...settings.customServers, server]
        });
        
        setNewServer({ name: '', command: 'npx', args: [], env: {}, enabled: true });
        setShowAddServer(false);
    };

    const removeCustomServer = (id: string) => {
        onSettingsChange({
            ...settings,
            customServers: settings.customServers.filter(s => s.id !== id)
        });
    };

    const toggleCustomServer = (id: string) => {
        onSettingsChange({
            ...settings,
            customServers: settings.customServers.map(s => 
                s.id === id ? { ...s, enabled: !s.enabled } : s
            )
        });
    };

    const addEnvVariable = () => {
        if (!newEnvKey) return;
        onSettingsChange({
            ...settings,
            envVariables: {
                ...settings.envVariables,
                [newEnvKey]: newEnvValue
            }
        });
        setNewEnvKey('');
        setNewEnvValue('');
    };

    const removeEnvVariable = (key: string) => {
        const { [key]: _, ...rest } = settings.envVariables;
        onSettingsChange({ ...settings, envVariables: rest });
    };

    return (
        <div className="advanced-mcp-settings">
            {/* Warning Banner */}
            <div className="experimental-warning">
                <AlertTriangle size={16} />
                <div>
                    <strong>실험적 기능</strong>
                    <p>이 설정들은 불안정할 수 있으며 예상치 못한 동작을 유발할 수 있습니다.</p>
                </div>
            </div>

            {/* Timeout Settings */}
            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('timeout')}
                >
                    {expandedSections.has('timeout') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Clock size={16} />
                    <span>타임아웃 설정</span>
                </div>
                {expandedSections.has('timeout') && (
                    <div className="section-content">
                        <div className="setting-row">
                            <label>서버 응답 타임아웃</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={settings.timeout}
                                    onChange={(e) => handleTimeoutChange(Number(e.target.value))}
                                    min={5}
                                    max={300}
                                />
                                <span>초</span>
                            </div>
                        </div>
                        <div className="setting-row">
                            <label>최대 동시 연결</label>
                            <div className="input-with-unit">
                                <input
                                    type="number"
                                    value={settings.maxConnections}
                                    onChange={(e) => handleMaxConnectionsChange(Number(e.target.value))}
                                    min={1}
                                    max={20}
                                />
                                <span>개</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Auto Start */}
            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('autostart')}
                >
                    {expandedSections.has('autostart') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Server size={16} />
                    <span>자동 시작 서버</span>
                </div>
                {expandedSections.has('autostart') && (
                    <div className="section-content">
                        <p className="section-desc">L.U.N.A 시작 시 자동으로 연결할 MCP 서버를 선택하세요.</p>
                        <div className="server-list">
                            {installedServers.length === 0 ? (
                                <div className="empty-state">설치된 서버가 없습니다</div>
                            ) : (
                                installedServers.map(server => (
                                    <label key={server} className="server-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoStart.includes(server)}
                                            onChange={() => toggleAutoStart(server)}
                                        />
                                        <span className="checkbox-custom" />
                                        <span className="server-name">{server}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Servers */}
            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('custom')}
                >
                    {expandedSections.has('custom') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Terminal size={16} />
                    <span>커스텀 서버</span>
                </div>
                {expandedSections.has('custom') && (
                    <div className="section-content">
                        <p className="section-desc">마켓플레이스에 없는 MCP 서버를 직접 추가하세요.</p>
                        
                        {/* Custom Server List */}
                        <div className="custom-server-list">
                            {settings.customServers.map(server => (
                                <div key={server.id} className={`custom-server-item ${server.enabled ? '' : 'disabled'}`}>
                                    <div className="server-info">
                                        <span className="server-name">{server.name}</span>
                                        <code className="server-command">{server.command} {server.args.join(' ')}</code>
                                    </div>
                                    <div className="server-actions">
                                        <button 
                                            className={`toggle-btn ${server.enabled ? 'active' : ''}`}
                                            onClick={() => toggleCustomServer(server.id)}
                                        >
                                            {server.enabled ? <Check size={14} /> : <X size={14} />}
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={() => removeCustomServer(server.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Server Form */}
                        {showAddServer ? (
                            <div className="add-server-form">
                                <div className="form-row">
                                    <label>서버 이름</label>
                                    <input
                                        type="text"
                                        placeholder="my-custom-server"
                                        value={newServer.name}
                                        onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <label>명령어</label>
                                    <select
                                        value={newServer.command}
                                        onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                                    >
                                        <option value="npx">npx</option>
                                        <option value="node">node</option>
                                        <option value="python">python</option>
                                        <option value="pip">pip (uvx)</option>
                                    </select>
                                </div>
                                <div className="form-row">
                                    <label>인자 (Arguments)</label>
                                    <input
                                        type="text"
                                        placeholder="run, --rm, -i, -e, TOKEN, image/name"
                                        value={newServer.args?.join(', ')}
                                        onChange={(e) => setNewServer({ 
                                            ...newServer, 
                                            args: e.target.value.split(',').map(a => a.trim()).filter(Boolean) 
                                        })}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button className="cancel-btn" onClick={() => setShowAddServer(false)}>
                                        취소
                                    </button>
                                    <button className="save-btn" onClick={addCustomServer}>
                                        <Save size={14} />
                                        저장
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="add-server-btn" onClick={() => setShowAddServer(true)}>
                                <Plus size={14} />
                                커스텀 서버 추가
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Environment Variables */}
            <div className="settings-section">
                <div 
                    className="section-header"
                    onClick={() => toggleSection('env')}
                >
                    {expandedSections.has('env') ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Key size={16} />
                    <span>환경 변수</span>
                </div>
                {expandedSections.has('env') && (
                    <div className="section-content">
                        <p className="section-desc">MCP 서버에 전달할 API 키 및 환경 변수를 설정하세요.</p>
                        
                        {/* Env List */}
                        <div className="env-list">
                            {Object.entries(settings.envVariables).map(([key, value]) => (
                                <div key={key} className="env-item">
                                    <span className="env-key">{key}</span>
                                    <span className="env-value">
                                        {'•'.repeat(Math.min(value.length, 20))}
                                    </span>
                                    <button 
                                        className="delete-btn"
                                        onClick={() => removeEnvVariable(key)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add Env Form */}
                        <div className="add-env-form">
                            <input
                                type="text"
                                placeholder="KEY"
                                value={newEnvKey}
                                onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                            />
                            <input
                                type="password"
                                placeholder="value"
                                value={newEnvValue}
                                onChange={(e) => setNewEnvValue(e.target.value)}
                            />
                            <button 
                                className="add-btn"
                                onClick={addEnvVariable}
                                disabled={!newEnvKey}
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        
                        <div className="env-hint">
                            예: GITHUB_TOKEN, OPENAI_API_KEY, SLACK_API_KEY
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdvancedMCPSettings;
