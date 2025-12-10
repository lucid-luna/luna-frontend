// ====================================================================
// L.U.N.A. Dashboard Page - System Monitoring
// Deep Sea Glassmorphism Theme with i18n Support
// ====================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    Monitor,
    Activity,
    Globe,
    Database,
    Volume2,
    Brain,
    Heart,
    RefreshCw,
    Cpu,
    HardDrive,
    Zap,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    BarChart3,
    Target
} from 'lucide-react';
import { useApp } from '../../context';
import { systemService, memoryService, ttsService } from '../../services';
import { useTranslation } from '../../hooks/useTranslation';
import type { APIStats, CacheStats, MemoryStats } from '../../types';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
    const { state, actions } = useApp();
    const { t } = useTranslation();
    const [apiStats, setApiStats] = useState<APIStats | null>(null);
    const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
    const [ttsCacheStats, setTtsCacheStats] = useState<CacheStats | null>(null);
    const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAllStats = useCallback(async () => {
        setIsRefreshing(true);
        try {
            const [api, cache, tts, memory] = await Promise.all([
                systemService.getAPIStats().catch(() => null),
                systemService.getCacheStats().catch(() => null),
                ttsService.getCacheStats().catch(() => null),
                memoryService.getStats().catch(() => null),
            ]);
            
            if (api) setApiStats(api);
            if (cache) setCacheStats(cache);
            if (tts) setTtsCacheStats(tts);
            if (memory) setMemoryStats(memory);
            
            await actions.fetchSystemMetrics();
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setIsRefreshing(false);
        }
    }, [actions]);

    useEffect(() => {
        fetchAllStats();
        const interval = setInterval(fetchAllStats, 10000);
        return () => clearInterval(interval);
    }, [fetchAllStats]);

    const formatNumber = (num: number | undefined | null) => {
        if (num === undefined || num === null || typeof num !== 'number' || isNaN(num)) return '-';
        return num.toLocaleString();
    };

    const formatPercentage = (num: number | undefined | null) => {
        if (num === undefined || num === null || typeof num !== 'number' || isNaN(num)) return '-';
        return `${num.toFixed(1)}%`;
    };

    return (
        <div className="dashboard-page">
            {/* Ambient Effects */}
            <div className="dashboard-ambient">
                <div className="ambient-glow glow-1"></div>
                <div className="ambient-glow glow-2"></div>
            </div>

            <div className="dashboard-header">
                <div className="header-title">
                    <div className="header-icon">
                        <Activity size={20} />
                    </div>
                    <h2>{t('dashboard.title')}</h2>
                </div>
                <button
                    className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                    onClick={fetchAllStats}
                    disabled={isRefreshing}
                >
                    <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} />
                    <span>{t('common.refresh')}</span>
                </button>
            </div>

            <div className="dashboard-grid">
                {/* System Health - Expandable Card */}
                <div className="expandable-card-wrapper">
                    <div className="expandable-card-main">
                        <div className="card-icon-area">
                            <Monitor size={32} />
                        </div>
                        <div className="card-main-content">
                            <div className="card-main-value">
                                {state.isConnected ? t('dashboard.healthy') : t('common.offline')}
                            </div>
                            <div className="card-main-label">{t('dashboard.systemStatus')}</div>
                        </div>
                        <span className={`status-indicator ${state.isConnected ? 'online' : 'offline'}`}>
                            {state.isConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        </span>
                    </div>
                    <div className="expandable-card-detail">
                        <div className="detail-section">
                            <div className="detail-row">
                                <span className="detail-label">{t('dashboard.serverInfo')}</span>
                                <span className="detail-value">{state.serverHealth?.server || '-'}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">{t('dashboard.version')}</span>
                                <span className="detail-value">{state.serverHealth?.version || '-'}</span>
                            </div>
                        </div>
                        <div className="detail-status-bar online">
                            <span>{state.serverHealth?.status || 'Unknown'}</span>
                        </div>
                    </div>
                </div>

                {/* System Metrics - Expandable Card */}
                <div className="expandable-card-wrapper metrics">
                    <div className="expandable-card-main">
                        <div className="card-icon-area">
                            <TrendingUp size={32} />
                        </div>
                        <div className="card-main-content">
                            <div className="card-main-value">
                                {formatPercentage(state.systemMetrics?.cpu_percent)}
                            </div>
                            <div className="card-main-label">{t('dashboard.cpuUsage')}</div>
                        </div>
                    </div>
                    <div className="expandable-card-detail">
                        <div className="detail-section gauges">
                            <div className="mini-gauge">
                                <Cpu size={14} />
                                <span>CPU</span>
                                <div className="mini-gauge-bar">
                                    <div className="mini-gauge-fill cpu" style={{ width: `${state.systemMetrics?.cpu_percent || 0}%` }} />
                                </div>
                                <span className="mini-gauge-value">{formatPercentage(state.systemMetrics?.cpu_percent)}</span>
                            </div>
                            <div className="mini-gauge">
                                <HardDrive size={14} />
                                <span>RAM</span>
                                <div className="mini-gauge-bar">
                                    <div className="mini-gauge-fill memory" style={{ width: `${state.systemMetrics?.memory_percent || 0}%` }} />
                                </div>
                                <span className="mini-gauge-value">{formatPercentage(state.systemMetrics?.memory_percent)}</span>
                            </div>
                            <div className="mini-gauge">
                                <Zap size={14} />
                                <span>GPU</span>
                                <div className="mini-gauge-bar">
                                    <div className="mini-gauge-fill gpu" style={{ width: `${state.systemMetrics?.gpu_percent || 0}%` }} />
                                </div>
                                <span className="mini-gauge-value">{formatPercentage(state.systemMetrics?.gpu_percent)}</span>
                            </div>
                        </div>
                        <div className="detail-status-bar healthy">
                            <span>Healthy</span>
                        </div>
                    </div>
                </div>

                {/* API Stats - Expandable Card */}
                <div className="expandable-card-wrapper api">
                    <div className="expandable-card-main">
                        <div className="card-icon-area">
                            <Globe size={32} />
                        </div>
                        <div className="card-main-content">
                            <div className="card-main-value">
                                {formatNumber(apiStats?.total_requests)}
                            </div>
                            <div className="card-main-label">{t('dashboard.totalRequests')}</div>
                        </div>
                    </div>
                    <div className="expandable-card-detail">
                        <div className="detail-section stats-row">
                            <div className="mini-stat success">
                                <span className="mini-stat-value">{formatNumber(apiStats?.successful_requests)}</span>
                                <span className="mini-stat-label">{t('dashboard.successfulRequests')}</span>
                            </div>
                            <div className="mini-stat error">
                                <span className="mini-stat-value">{formatNumber(apiStats?.failed_requests)}</span>
                                <span className="mini-stat-label">{t('dashboard.failedRequests')}</span>
                            </div>
                            <div className="mini-stat">
                                <Clock size={12} />
                                <span className="mini-stat-value">{apiStats?.average_response_time?.toFixed(0) || '-'}ms</span>
                                <span className="mini-stat-label">{t('dashboard.avgResponseTime')}</span>
                            </div>
                        </div>
                        <div className="detail-status-bar healthy">
                            <span>Active</span>
                        </div>
                    </div>
                </div>

                {/* LLM Cache - Expandable Card */}
                <div className="expandable-card-wrapper cache">
                    <div className="expandable-card-main">
                        <div className="card-icon-area">
                            <Database size={32} />
                        </div>
                        <div className="card-main-content">
                            <div className="card-main-value">
                                {formatPercentage(cacheStats?.hit_rate)}
                            </div>
                            <div className="card-main-label">LLM {t('dashboard.hitRate')}</div>
                        </div>
                        <button
                            className="card-action-btn"
                            onClick={(e) => { e.stopPropagation(); systemService.cleanupCache(); }}
                            title={t('settings.clearCache')}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="expandable-card-detail">
                        <div className="detail-section stats-row">
                            <div className="mini-stat">
                                <span className="mini-stat-value">{formatNumber(cacheStats?.cache_size)}</span>
                                <span className="mini-stat-label">{t('dashboard.cacheSize')}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-stat-value">{formatNumber(cacheStats?.hits)}</span>
                                <span className="mini-stat-label">{t('dashboard.hits')}</span>
                            </div>
                            <div className="mini-stat error">
                                <span className="mini-stat-value">{formatNumber(cacheStats?.misses)}</span>
                                <span className="mini-stat-label">{t('dashboard.misses')}</span>
                            </div>
                        </div>
                        <div className={`detail-status-bar ${(cacheStats?.hit_rate || 0) > 50 ? 'healthy' : 'warning'}`}>
                            <span>{(cacheStats?.hit_rate || 0) > 50 ? 'Optimal' : 'Low Hit Rate'}</span>
                        </div>
                    </div>
                </div>

                {/* TTS Cache - Expandable Card */}
                <div className="expandable-card-wrapper tts">
                    <div className="expandable-card-main">
                        <div className="card-icon-area">
                            <Volume2 size={32} />
                        </div>
                        <div className="card-main-content">
                            <div className="card-main-value">
                                {formatPercentage(ttsCacheStats?.hit_rate)}
                            </div>
                            <div className="card-main-label">TTS {t('dashboard.hitRate')}</div>
                        </div>
                        <button
                            className="card-action-btn"
                            onClick={(e) => { e.stopPropagation(); ttsService.cleanupCache(); }}
                            title={t('settings.clearCache')}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="expandable-card-detail">
                        <div className="detail-section stats-row">
                            <div className="mini-stat">
                                <span className="mini-stat-value">{formatNumber(ttsCacheStats?.cache_size)}</span>
                                <span className="mini-stat-label">{t('dashboard.cacheSize')}</span>
                            </div>
                            <div className="mini-stat success">
                                <span className="mini-stat-value">{formatNumber(ttsCacheStats?.hits)}</span>
                                <span className="mini-stat-label">{t('dashboard.hits')}</span>
                            </div>
                            <div className="mini-stat error">
                                <span className="mini-stat-value">{formatNumber(ttsCacheStats?.misses)}</span>
                                <span className="mini-stat-label">{t('dashboard.misses')}</span>
                            </div>
                        </div>
                        <div className={`detail-status-bar ${(ttsCacheStats?.hit_rate || 0) > 50 ? 'healthy' : 'warning'}`}>
                            <span>{(ttsCacheStats?.hit_rate || 0) > 50 ? 'Optimal' : 'Low Hit Rate'}</span>
                        </div>
                    </div>
                </div>

                {/* Memory Stats - Expandable Card */}
                {memoryStats && (
                    <div className="expandable-card-wrapper memory">
                        <div className="expandable-card-main">
                            <div className="card-icon-area">
                                <Brain size={32} />
                            </div>
                            <div className="card-main-content">
                                <div className="card-main-value">
                                    {formatNumber(memoryStats?.total_conversations)}
                                </div>
                                <div className="card-main-label">{t('memory.totalConversations')}</div>
                            </div>
                        </div>
                        <div className="expandable-card-detail">
                            <div className="detail-section stats-row">
                                <div className="mini-stat">
                                    <span className="mini-stat-value">{formatNumber(memoryStats?.total_summaries)}</span>
                                    <span className="mini-stat-label">{t('memory.totalSummaries')}</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-value">{formatNumber(memoryStats?.unique_users)}</span>
                                    <span className="mini-stat-label">{t('dashboard.users')}</span>
                                </div>
                                <div className="mini-stat">
                                    <span className="mini-stat-value">{memoryStats?.avg_processing_time?.toFixed(1) || '-'}s</span>
                                <span className="mini-stat-label">{t('dashboard.processingTime')}</span>
                            </div>
                        </div>
                        <div className="detail-status-bar healthy">
                            <span>Active</span>
                        </div>
                    </div>
                </div>
                )}

                {/* Emotion Distribution - Full Width Card */}
                {memoryStats?.emotions_distribution && (
                    <div className="dashboard-card emotion-stats full-width">
                        <div className="card-glass"></div>
                        <div className="card-header">
                            <h3>
                                <Heart size={18} />
                                {t('dashboard.emotionDistribution')}
                            </h3>
                        </div>
                        <div className="card-content">
                            <div className="distribution-list">
                                {Object.entries(memoryStats.emotions_distribution).map(([emotion, count]) => (
                                    <div key={emotion} className="distribution-item">
                                        <span className="distribution-label">{emotion}</span>
                                        <div className="distribution-bar">
                                            <div
                                                className="distribution-fill"
                                                style={{
                                                    width: `${(count / Math.max(...Object.values(memoryStats.emotions_distribution))) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="distribution-value">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
                )}

                {/* Daily Conversations Chart - Full Width */}
                {memoryStats?.conversations_by_date && Object.keys(memoryStats.conversations_by_date).length > 0 && (
                    <div className="dashboard-card chart-card full-width">
                        <div className="card-glass"></div>
                        <div className="card-header">
                            <h3>
                                <BarChart3 size={18} />
                                {t('dashboard.dailyConversations')}
                            </h3>
                        </div>
                        <div className="card-content">
                            <div className="bar-chart">
                                {(() => {
                                    const entries = Object.entries(memoryStats.conversations_by_date)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .slice(-14); // 최근 14일
                                    const maxValue = Math.max(...entries.map(([, v]) => v), 1);
                                    
                                    return entries.map(([date, count]) => {
                                        const dateObj = new Date(date);
                                        const dayLabel = dateObj.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
                                        const heightPercent = (count / maxValue) * 100;
                                        
                                        return (
                                            <div key={date} className="bar-item" title={`${date}: ${count}개`}>
                                                <div className="bar-value">{count}</div>
                                                <div className="bar-track">
                                                    <div 
                                                        className="bar-fill" 
                                                        style={{ height: `${heightPercent}%` }}
                                                    />
                                                </div>
                                                <div className="bar-label">{dayLabel}</div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Intent Distribution - Full Width Card */}
                {memoryStats?.intents_distribution && Object.keys(memoryStats.intents_distribution).length > 0 && (
                    <div className="dashboard-card intent-stats full-width">
                        <div className="card-glass"></div>
                        <div className="card-header">
                            <h3>
                                <Target size={18} />
                                {t('dashboard.intentDistribution')}
                            </h3>
                        </div>
                        <div className="card-content">
                            <div className="distribution-list horizontal">
                                {Object.entries(memoryStats.intents_distribution)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 8)
                                    .map(([intent, count]) => (
                                    <div key={intent} className="intent-badge">
                                        <span className="intent-name">{intent}</span>
                                        <span className="intent-count">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;