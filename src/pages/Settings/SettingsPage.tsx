// ====================================================================
// L.U.N.A. Settings Page - System Configuration
// Premium Timeline Design with i18n Support
// ====================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Settings,
    Globe,
    Bell,
    Volume2,
    Gauge,
    Cog,
    FlaskConical,
    Database,
    Trash2,
    Eraser,
    AlertTriangle,
    Plug,
    CheckCircle,
    XCircle,
    Server,
    Link,
    RotateCcw,
    Save,
    Loader2,
    Brain,
    MessageSquare,
    Sparkles,
    Zap,
    RefreshCw,
    Info,
    ChevronRight,
    Monitor,
    Bug,
    Wrench,
    Smile,
    Gamepad2,
    FileType2,
    SubtitlesIcon
} from 'lucide-react';
import { useApp, useDebug } from '../../context';
import { systemService, memoryService, ttsService } from '../../services';
import { useTranslation } from '../../hooks/useTranslation';
import { languages, SupportedLanguage } from '../../i18n';
import { AdvancedMCPSettings } from '../../components/MCP';
import { useToast } from '../../components/Common';
import './SettingsPage.css';

// Section type for navigation
type SectionId = 'general' | 'audio' | 'advanced' | 'cache' | 'connection' | 'unity';

interface SectionInfo {
    id: SectionId;
    icon: React.ReactNode;
    labelKey: string;
    descKey: string;
}

const sectionConfig: SectionInfo[] = [
    { id: 'general', icon: <Globe size={18} />, labelKey: 'settings.general', descKey: 'settings.generalDesc' },
    { id: 'audio', icon: <Volume2 size={18} />, labelKey: 'settings.audio', descKey: 'settings.audioDesc' },
    { id: 'unity', icon: <Gamepad2 size={18} />, labelKey: 'settings.unity', descKey: 'settings.unityDesc' },
    { id: 'advanced', icon: <Cog size={18} />, labelKey: 'settings.advanced', descKey: 'settings.advancedDesc' },
    { id: 'cache', icon: <Database size={18} />, labelKey: 'settings.cache', descKey: 'settings.cacheDesc' },
    { id: 'connection', icon: <Plug size={18} />, labelKey: 'settings.connection', descKey: 'settings.connectionDesc' },
];

const SettingsPage: React.FC = () => {
    const { state, actions } = useApp();
    const debugContext = useDebug();
    const { t, availableLanguages } = useTranslation();
    const toast = useToast();
    const language = state.settings.language;
    const [localSettings, setLocalSettings] = useState({
        ...state.settings,
        blendSpeed: state.settings.blendSpeed ?? 2.0,
        maxIntensity: state.settings.maxIntensity ?? 100,
        showSubtitles: state.settings.showSubtitles ?? true,
        subtitleFontSize: state.settings.subtitleFontSize ?? 36,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeSection, setActiveSection] = useState<SectionId>('general');
    const [hasChanges, setHasChanges] = useState(false);
    
    // Experimental features state
    const [showAdvancedMCP, setShowAdvancedMCP] = useState(false);
    const [installedMCPServers] = useState<string[]>([]);
    const [advancedMCPSettings, setAdvancedMCPSettings] = useState({
        timeout: 30,
        maxConnections: 5,
        autoStart: [] as string[],
        customServers: [] as any[],
        envVariables: {} as Record<string, string>
    });

    // Build sections with translations
    const sections = useMemo(() => 
        sectionConfig.map(section => ({
            ...section,
            label: t(section.labelKey),
            description: t(section.descKey),
        })),
        [t]
    );

    useEffect(() => {
        setLocalSettings(state.settings);
    }, [state.settings]);

    // Check for changes
    useEffect(() => {
        const changed = JSON.stringify(localSettings) !== JSON.stringify(state.settings);
        setHasChanges(changed);
    }, [localSettings, state.settings]);

    // Auto-dismiss message
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleChange = (key: string, value: unknown) => {
        setLocalSettings((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await actions.updateSettings(localSettings);
            toast.success(t('settings.saveSuccess'));
            setHasChanges(false);
        } catch {
            toast.error(t('settings.saveError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setLocalSettings(state.settings);
        setMessage(null);
        setHasChanges(false);
    };

    const handleRefresh = useCallback(async () => {
        setIsLoading(true);
        try {
            await actions.fetchSystemMetrics();
            await actions.checkHealth();
        } finally {
            setIsLoading(false);
        }
    }, [actions]);

    const handleClearCache = async (type: 'llm' | 'tts' | 'all') => {
        try {
            if (type === 'llm' || type === 'all') {
                await systemService.clearCache();
            }
            if (type === 'tts' || type === 'all') {
                await ttsService.clearCache();
            }
            toast.success(t('settings.cacheCleared'));
        } catch {
            toast.error(t('settings.cacheClearError'));
        }
    };

    const handleClearMemory = async () => {
        if (!window.confirm(t('settings.clearMemoryConfirm'))) {
            return;
        }
        try {
            await memoryService.clearMemory();
            toast.success(t('settings.memoryCleared'));
        } catch {
            toast.error(t('settings.memoryClearError'));
        }
    };

    const handleStopAudio = async () => {
        try {
            await actions.sendToUnity('command', { action: 'stop_audio' });
            toast.success(t('settings.audioStopped'));
        } catch {
            toast.error(t('settings.audioStopError'));
        }
    }

    return (
        <div className="settings-page">
            {/* Ambient Background */}
            <div className="settings-ambient">
                <div className="ambient-orb orb-1" />
                <div className="ambient-orb orb-2" />
                <div className="ambient-orb orb-3" />
            </div>

            {/* Header */}
            <header className="settings-header">
                <div className="header-left">
                    <div className="header-icon-wrap">
                        <Settings size={22} />
                    </div>
                    <div className="header-text">
                        <h1>{t('settings.title')}</h1>
                        <span>{t('settings.subtitle')}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="icon-btn" 
                        onClick={handleRefresh} 
                        disabled={isLoading}
                        title={t('common.refresh')}
                    >
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                    </button>
                    {hasChanges && (
                        <>
                            <button className="action-btn" onClick={handleReset}>
                                <RotateCcw size={16} />
                                {t('common.reset')}
                            </button>
                            <button 
                                className="action-btn primary" 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                                {t('common.save')}
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Toast Message */}
            {message && (
                <div className={`toast-message ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon cyan">
                        <Server size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{state.isConnected ? t('settings.connected') : t('common.offline')}</span>
                        <span className="stat-label">{t('settings.server')}</span>
                    </div>
                    <div className={`stat-indicator ${state.isConnected ? 'online' : 'offline'}`} />
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple">
                        <Zap size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{state.serverHealth?.version || '-'}</span>
                        <span className="stat-label">{t('settings.version')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green">
                        <Globe size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{languages[localSettings.language as SupportedLanguage]?.nativeName || localSettings.language.toUpperCase()}</span>
                        <span className="stat-label">{t('settings.language')}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange">
                        <Volume2 size={20} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{localSettings.volume}%</span>
                        <span className="stat-label">{t('settings.volume')}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="settings-main">
                {/* Navigation Panel */}
                <nav className="nav-panel">
                    <div className="panel-header">
                        <h3>
                            <Cog size={18} />
                            {t('settings.categories')}
                        </h3>
                    </div>
                    <div className="nav-list">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <div className="nav-icon">{section.icon}</div>
                                <div className="nav-text">
                                    <span className="nav-label">{section.label}</span>
                                    <span className="nav-desc">{section.description}</span>
                                </div>
                                <ChevronRight size={16} className="nav-arrow" />
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Settings Panel */}
                <div className="content-panel">
                    {/* General Settings */}
                    {activeSection === 'general' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Globe size={20} />
                                <div>
                                    <h3>{t('settings.generalTitle')}</h3>
                                    <span>{t('settings.generalSubtitle')}</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Globe size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.interfaceLanguage')}</label>
                                            <span>{t('settings.interfaceLanguageDesc')}</span>
                                        </div>
                                    </div>
                                    <select
                                        value={localSettings.language}
                                        onChange={(e) => handleChange('language', e.target.value)}
                                    >
                                        {availableLanguages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.flag} {lang.nativeName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Bell size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.notifications')}</label>
                                            <span>{t('settings.notificationsDesc')}</span>
                                        </div>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.notifications}
                                            onChange={(e) => handleChange('notifications', e.target.checked)}
                                        />
                                        <span className="toggle-track" />
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Audio Settings */}
                    {activeSection === 'audio' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Volume2 size={20} />
                                <div>
                                    <h3>{t('settings.audioTitle')}</h3>
                                    <span>{t('settings.audioSubtitle')}</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Volume2 size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.volumeLabel')}</label>
                                            <span>{t('settings.volumeDesc')}</span>
                                        </div>
                                    </div>
                                    <div className="range-control">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={localSettings.volume}
                                            onChange={(e) => handleChange('volume', parseInt(e.target.value))}
                                        />
                                        <span className="range-value">{localSettings.volume}%</span>
                                    </div>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Gauge size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.speechSpeed')}</label>
                                            <span>{t('settings.speechSpeedDesc')}</span>
                                        </div>
                                    </div>
                                    <div className="range-control">
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.0"
                                            step="0.1"
                                            value={localSettings.ttsSpeed}
                                            onChange={(e) => handleChange('ttsSpeed', parseFloat(e.target.value))}
                                        />
                                        <span className="range-value">{localSettings.ttsSpeed.toFixed(1)}x</span>
                                    </div>
                                </div>
                            </div>

                            {/* Audio Preview */}
                            <div className="preview-box">
                                <div className="preview-icon">
                                    <Sparkles size={24} />
                                </div>
                                <div className="preview-info">
                                    <h4>{t('settings.audioPreview')}</h4>
                                    <p>{t('settings.audioPreviewDesc')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'unity' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Gamepad2 size={20} />
                                <div>
                                    <h3>{t('settings.unity')}</h3>
                                    <span>{t('settings.unityDesc')}</span>
                                </div>
                            </div>

                            {/* 1. 아바타 표현 그룹 */}
                            <div className="setting-group">
                                <h4>
                                    <Smile size={16} />
                                    {t('settings.unityExpression')}
                                </h4>

                                {/* 표정 강도 */}
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}>
                                            <Smile size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.unityIntensity')}</label>
                                            <span>{t('settings.unityIntensityDesc')}</span>
                                        </div>
                                    </div>
                                    <div className="range-control">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={localSettings.maxIntensity ?? 100}
                                            onChange={(e) => handleChange('maxIntensity', parseInt(e.target.value))}
                                        />
                                        <span className="range-value">{localSettings.maxIntensity ?? 100}%</span>
                                    </div>
                                </div>

                                {/* 블렌드 속도 */}
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon" style={{ color: '#fb923c', background: 'rgba(251, 146, 60, 0.1)' }}>
                                            <Zap size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.unityBlendSpeed')}</label>
                                            <span>{t('settings.unityBlendSpeedDesc')}</span>
                                        </div>
                                    </div>
                                    <div className="range-control">
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="10.0"
                                            step="0.1"
                                            value={localSettings.blendSpeed ?? 2.0}
                                            onChange={(e) => handleChange('blendSpeed', parseFloat(e.target.value))}
                                        />
                                        <span className="range-value">{localSettings.blendSpeed?.toFixed(1) ?? '2.0'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="divider" />

                            {/* 2. 인터페이스 그룹 */}
                            <div className="setting-group">
                                <h4>
                                    <Monitor size={16} />
                                    인터페이스 (Interface)
                                </h4>

                                {/* 자막 토글 */}
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon" style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.1)' }}>
                                            <FileType2 size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.unitySubtitles')}</label>
                                            <span>{t('settings.unitySubtitlesDesc')}</span>
                                        </div>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.showSubtitles ?? true}
                                            onChange={(e) => handleChange('showSubtitles', e.target.checked)}
                                        />
                                        <span className="toggle-track" />
                                    </label>
                                </div>

                                {(localSettings.showSubtitles ?? true) && (
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <div className="setting-icon" style={{ color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)' }}>
                                                <SubtitlesIcon size={16} />
                                            </div>
                                            <div className="setting-text">
                                                <label>{t('settings.unitySubtitleSize')}</label>
                                                <span>{t('settings.unitySubtitleSizeDesc')}</span>
                                            </div>
                                        </div>
                                        <div className="range-control">
                                            <input
                                                type="range"
                                                min="20"
                                                max="100"
                                                step="2"
                                                value={localSettings.subtitleFontSize ?? 36}
                                                onChange={(e) => handleChange('subtitleFontSize', parseInt(e.target.value))}
                                            />
                                            <span className="range-value">{localSettings.subtitleFontSize ?? 36}px</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="divider" />

                            <div className="setting-group danger-zone">
                                <h4>
                                    <AlertTriangle size={16} />
                                    {t('settings.unityDangerZone')}
                                </h4>
                                
                                <div className="setting-item danger">
                                    <div className="setting-info">
                                        <div className="setting-icon danger">
                                            <Volume2 size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.unityEmergencyStop')}</label>
                                            <span>{t('settings.unityEmergencyStopDesc')}</span>
                                        </div>
                                    </div>
                                    <button 
                                        className="setting-btn danger" 
                                        onClick={handleStopAudio}
                                    >
                                        <XCircle size={14} />
                                        {t('settings.stopAudio')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Settings */}
                    {activeSection === 'advanced' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Cog size={20} />
                                <div>
                                    <h3>{t('settings.advancedTitle')}</h3>
                                    <span>{t('settings.advancedSubtitle')}</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon experimental">
                                            <FlaskConical size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.experimentalFeatures')}</label>
                                            <span>{t('settings.experimentalFeaturesDesc')}</span>
                                        </div>
                                    </div>
                                    <label className="toggle">
                                        <input
                                            type="checkbox"
                                            checked={localSettings.experimentalFeatures}
                                            onChange={(e) => handleChange('experimentalFeatures', e.target.checked)}
                                        />
                                        <span className="toggle-track" />
                                    </label>
                                </div>
                            </div>

                            {localSettings.experimentalFeatures && (
                                <div className="warning-box">
                                    <AlertTriangle size={18} />
                                    <div>
                                        <strong>{t('common.warning')}</strong>
                                        <p>{t('settings.experimentalWarning')}</p>
                                    </div>
                                </div>
                            )}

                            {/* Experimental Features - Debug Panel */}
                            {localSettings.experimentalFeatures && (
                                <div className="setting-group">
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <div className="setting-icon debug">
                                                <Bug size={16} />
                                            </div>
                                            <div className="setting-text">
                                                <label>{language === 'ko' ? '디버그 패널' : 'Debug Panel'}</label>
                                                <span>{language === 'ko' ? 'MCP 통신 로그 및 API 요청 모니터링' : 'Monitor MCP communications and API requests'}</span>
                                            </div>
                                        </div>
                                        <button 
                                            className="setting-btn primary"
                                            onClick={() => debugContext.toggleDebugPanel()}
                                        >
                                            <Bug size={14} />
                                            {debugContext.isDebugPanelOpen 
                                                ? (language === 'ko' ? '패널 닫기' : 'Close Panel')
                                                : (language === 'ko' ? '패널 열기' : 'Open Panel')
                                            }
                                        </button>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <div className="setting-icon mcp">
                                                <Wrench size={16} />
                                            </div>
                                            <div className="setting-text">
                                                <label>{language === 'ko' ? '고급 MCP 설정' : 'Advanced MCP Settings'}</label>
                                                <span>{language === 'ko' ? '커스텀 서버, 환경변수, 타임아웃 설정' : 'Custom servers, environment variables, timeout settings'}</span>
                                            </div>
                                        </div>
                                        <label className="toggle">
                                            <input
                                                type="checkbox"
                                                checked={showAdvancedMCP}
                                                onChange={(e) => setShowAdvancedMCP(e.target.checked)}
                                            />
                                            <span className="toggle-track" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Advanced MCP Settings Panel */}
                            {localSettings.experimentalFeatures && showAdvancedMCP && (
                                <AdvancedMCPSettings
                                    settings={advancedMCPSettings}
                                    onSettingsChange={setAdvancedMCPSettings}
                                    installedServers={installedMCPServers}
                                />
                            )}
                        </div>
                    )}

                    {/* Cache Settings */}
                    {activeSection === 'cache' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Database size={20} />
                                <div>
                                    <h3>{t('settings.cacheTitle')}</h3>
                                    <span>{t('settings.cacheSubtitle')}</span>
                                </div>
                            </div>

                            <div className="setting-group">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Brain size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.llmCache')}</label>
                                            <span>{t('settings.llmCacheDesc')}</span>
                                        </div>
                                    </div>
                                    <button className="setting-btn" onClick={() => handleClearCache('llm')}>
                                        <Trash2 size={14} />
                                        {t('common.delete')}
                                    </button>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Volume2 size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.ttsCache')}</label>
                                            <span>{t('settings.ttsCacheDesc')}</span>
                                        </div>
                                    </div>
                                    <button className="setting-btn" onClick={() => handleClearCache('tts')}>
                                        <Trash2 size={14} />
                                        {t('common.delete')}
                                    </button>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <div className="setting-icon">
                                            <Eraser size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.allCache')}</label>
                                            <span>{t('settings.allCacheDesc')}</span>
                                        </div>
                                    </div>
                                    <button className="setting-btn" onClick={() => handleClearCache('all')}>
                                        <Eraser size={14} />
                                        {t('settings.clearAll')}
                                    </button>
                                </div>
                            </div>

                            <div className="divider" />

                            <div className="setting-group danger-zone">
                                <h4>
                                    <AlertTriangle size={16} />
                                    {t('settings.dangerZone')}
                                </h4>
                                <div className="setting-item danger">
                                    <div className="setting-info">
                                        <div className="setting-icon danger">
                                            <MessageSquare size={16} />
                                        </div>
                                        <div className="setting-text">
                                            <label>{t('settings.conversationHistory')}</label>
                                            <span>{t('settings.conversationHistoryDesc')}</span>
                                        </div>
                                    </div>
                                    <button className="setting-btn danger" onClick={handleClearMemory}>
                                        <AlertTriangle size={14} />
                                        {t('settings.clearAll')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Connection Settings */}
                    {activeSection === 'connection' && (
                        <div className="section-content">
                            <div className="section-header">
                                <Plug size={20} />
                                <div>
                                    <h3>{t('settings.connectionTitle')}</h3>
                                    <span>{t('settings.connectionSubtitle')}</span>
                                </div>
                            </div>

                            <div className="connection-status">
                                <div className={`status-ring ${state.isConnected ? 'online' : 'offline'}`}>
                                    <Monitor size={32} />
                                </div>
                                <div className="status-info">
                                    <span className="status-label">{t('settings.serverStatus')}</span>
                                    <span className={`status-value ${state.isConnected ? 'online' : 'offline'}`}>
                                        {state.isConnected ? t('settings.connected') : t('settings.disconnected')}
                                    </span>
                                </div>
                            </div>

                            <div className="setting-group info-group">
                                <div className="info-item">
                                    <div className="info-icon">
                                        <Server size={16} />
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">{t('settings.serverName')}</span>
                                        <span className="info-value">{state.serverHealth?.server || 'L.U.N.A.'}</span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <Zap size={16} />
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">{t('settings.version')}</span>
                                        <span className="info-value">{state.serverHealth?.version || '-'}</span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <Link size={16} />
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">{t('settings.apiUrl')}</span>
                                        <span className="info-value code">
                                            {process.env.REACT_APP_API_URL || 'http://localhost:8000'}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-item">
                                    <div className="info-icon">
                                        <Info size={16} />
                                    </div>
                                    <div className="info-content">
                                        <span className="info-label">{t('settings.statusMessage')}</span>
                                        <span className="info-value">{state.serverHealth?.status || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>

                            <button className="reconnect-btn" onClick={handleRefresh} disabled={isLoading}>
                                <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                                {t('settings.reconnect')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
