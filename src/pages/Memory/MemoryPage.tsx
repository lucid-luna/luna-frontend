// ====================================================================
// L.U.N.A. Memory Page - Conversation History & Memory Management
// Premium Timeline Design with i18n Support
// ====================================================================

import React, { useEffect, useState, useCallback } from 'react';
import {
    Brain,
    FileText,
    Trash2,
    Search,
    X,
    Clock,
    MessageSquare,
    User,
    Moon,
    Target,
    Timer,
    Database,
    TrendingUp,
    Sparkles,
    ChevronRight,
    RefreshCw,
    Calendar,
    Zap,
    Heart,
    Briefcase,
    Users,
    Star,
    BookOpen,
    Plus,
    Edit3,
    Save,
    XCircle,
    AlertCircle,
    Hourglass
} from 'lucide-react';
import { memoryService, CoreMemory, WorkingMemory } from '../../services';
import { config } from '../../config';
import { useTranslation } from '../../hooks/useTranslation';
import type { Conversation, Summary, MemoryStats } from '../../types';
import './MemoryPage.css';

// Core Memory 카테고리 아이콘 매핑
const categoryIcons: Record<string, React.ReactNode> = {
    user_info: <User size={14} />,
    preferences: <Heart size={14} />,
    projects: <Briefcase size={14} />,
    relationships: <Users size={14} />,
    facts: <BookOpen size={14} />
};

const categoryLabels: Record<string, Record<string, string>> = {
    user_info: { ko: '사용자 정보', en: 'User Info', ja: 'ユーザー情報' },
    preferences: { ko: '선호도', en: 'Preferences', ja: '設定' },
    projects: { ko: '프로젝트', en: 'Projects', ja: 'プロジェクト' },
    relationships: { ko: '관계', en: 'Relationships', ja: '関係' },
    facts: { ko: '사실', en: 'Facts', ja: '事実' }
};

const MemoryPage: React.FC = () => {
    const { t, language } = useTranslation();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [stats, setStats] = useState<MemoryStats | null>(null);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedEmotion, setSelectedEmotion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [activeTab, setActiveTab] = useState<'conversations' | 'summaries' | 'coreMemory' | 'workingMemory'>('conversations');
    
    // Core Memory State
    const [coreMemories, setCoreMemories] = useState<CoreMemory[]>([]);
    const [selectedCoreMemory, setSelectedCoreMemory] = useState<CoreMemory | null>(null);
    const [isEditingCore, setIsEditingCore] = useState(false);
    const [coreEditForm, setCoreEditForm] = useState({ category: 'facts', key: '', value: '', importance: 5 });
    const [isAddingCore, setIsAddingCore] = useState(false);
    
    // Working Memory State
    const [workingMemories, setWorkingMemories] = useState<WorkingMemory[]>([]);
    const [selectedWorkingMemory, setSelectedWorkingMemory] = useState<WorkingMemory | null>(null);
    const [isAddingWorking, setIsAddingWorking] = useState(false);
    const [workingAddForm, setWorkingAddForm] = useState({ topic: '', content: '', importance: 5, ttl_days: 3 });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [convData, summaryData, statsData, coreData, workingData] = await Promise.all([
                memoryService.getConversations(),
                memoryService.getSummaries(),
                memoryService.getStats(),
                memoryService.getCoreMemories(),
                memoryService.getWorkingMemories(),
            ]);
            setConversations(convData.conversations);
            setSummaries(summaryData.summaries);
            setStats(statsData);
            setCoreMemories(coreData.memories || []);
            setWorkingMemories(workingData.memories || []);
        } catch (error) {
            console.error('Failed to load memory data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Core Memory Functions
    const handleAddCoreMemory = async () => {
        try {
            await memoryService.createCoreMemory({
                category: coreEditForm.category,
                key: coreEditForm.key,
                value: coreEditForm.value,
                importance: coreEditForm.importance
            });
            setIsAddingCore(false);
            setCoreEditForm({ category: 'facts', key: '', value: '', importance: 5 });
            loadData();
        } catch (error) {
            console.error('Failed to add core memory:', error);
        }
    };

    const handleUpdateCoreMemory = async () => {
        if (!selectedCoreMemory) return;
        try {
            await memoryService.updateCoreMemory(selectedCoreMemory.id, {
                value: coreEditForm.value,
                importance: coreEditForm.importance
            });
            setIsEditingCore(false);
            loadData();
        } catch (error) {
            console.error('Failed to update core memory:', error);
        }
    };

    const handleDeleteCoreMemory = async (id: number) => {
        if (!window.confirm(language === 'ko' ? '이 핵심 기억을 삭제하시겠습니까?' : 
            language === 'ja' ? 'このコアメモリを削除しますか？' : 'Delete this core memory?')) return;
        try {
            await memoryService.deleteCoreMemory(id);
            if (selectedCoreMemory?.id === id) {
                setSelectedCoreMemory(null);
            }
            loadData();
        } catch (error) {
            console.error('Failed to delete core memory:', error);
        }
    };

    // Working Memory Functions
    const handleAddWorkingMemory = async () => {
        try {
            await memoryService.createWorkingMemory({
                topic: workingAddForm.topic,
                content: workingAddForm.content,
                importance: workingAddForm.importance,
                ttl_days: workingAddForm.ttl_days
            });
            setIsAddingWorking(false);
            setWorkingAddForm({ topic: '', content: '', importance: 5, ttl_days: 3 });
            loadData();
        } catch (error) {
            console.error('Failed to add working memory:', error);
        }
    };

    const handleExtendWorkingMemory = async (id: number) => {
        try {
            await memoryService.extendWorkingMemory(id, 3);
            loadData();
        } catch (error) {
            console.error('Failed to extend working memory:', error);
        }
    };

    const handleDeleteWorkingMemory = async (id: number) => {
        if (!window.confirm(language === 'ko' ? '이 작업 기억을 삭제하시겠습니까?' : 
            language === 'ja' ? 'この作業メモリを削除しますか？' : 'Delete this working memory?')) return;
        try {
            await memoryService.deleteWorkingMemory(id);
            if (selectedWorkingMemory?.id === id) {
                setSelectedWorkingMemory(null);
            }
            loadData();
        } catch (error) {
            console.error('Failed to delete working memory:', error);
        }
    };

    const handleCleanupExpiredMemories = async () => {
        try {
            const result = await memoryService.cleanupExpiredMemories();
            alert(language === 'ko' ? `${result.deleted_count}개의 만료된 기억이 정리되었습니다.` :
                language === 'ja' ? `${result.deleted_count}件の期限切れメモリを削除しました。` :
                `Cleaned up ${result.deleted_count} expired memories.`);
            loadData();
        } catch (error) {
            console.error('Failed to cleanup memories:', error);
        }
    };

    // 만료까지 남은 시간 계산
    const getTimeRemaining = (expiresAt: string): string => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires.getTime() - now.getTime();
        
        if (diff <= 0) return language === 'ko' ? '만료됨' : language === 'ja' ? '期限切れ' : 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return language === 'ko' ? `${days}일 ${hours}시간 남음` :
                language === 'ja' ? `残り${days}日${hours}時間` :
                `${days}d ${hours}h remaining`;
        }
        return language === 'ko' ? `${hours}시간 남음` :
            language === 'ja' ? `残り${hours}時間` :
            `${hours}h remaining`;
    };

    // Core Memory를 카테고리별로 그룹화
    const groupedCoreMemories: Record<string, CoreMemory[]> = coreMemories.reduce((acc, mem) => {
        if (!acc[mem.category]) acc[mem.category] = [];
        acc[mem.category].push(mem);
        return acc;
    }, {} as Record<string, CoreMemory[]>);

    const handleSearch = async () => {
        setIsLoading(true);
        try {
            const result = await memoryService.searchConversations({
                keyword: searchKeyword || undefined,
                emotion: selectedEmotion || undefined,
            });
            setConversations(result.results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearchKeyword('');
        setSelectedEmotion('');
        loadData();
    };

    const handleForceSummarize = async () => {
        try {
            const result = await memoryService.forceSummarize();
            alert(result.message);
            loadData();
        } catch (error) {
            console.error('Summarize failed:', error);
        }
    };

    const handleClearMemory = async () => {
        if (!window.confirm(t('memory.clearMemoryConfirm'))) return;
        try {
            await memoryService.clearMemory();
            loadData();
        } catch (error) {
            console.error('Clear failed:', error);
        }
    };

    const handleDeleteConversation = async (id: number) => {
        if (!window.confirm(t('memory.deleteConversationConfirm'))) return;
        try {
            await memoryService.deleteConversation(id);
            setConversations(conversations.filter((c) => c.id !== id));
            if (selectedConversation?.id === id) {
                setSelectedConversation(null);
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        const localeMap: Record<string, string> = {
            ko: 'ko-KR',
            en: 'en-US',
            ja: 'ja-JP',
        };
        return new Date(dateStr).toLocaleString(localeMap[language] || 'ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatFullDate = (dateStr: string) => {
        const localeMap: Record<string, string> = {
            ko: 'ko-KR',
            en: 'en-US',
            ja: 'ja-JP',
        };
        return new Date(dateStr).toLocaleString(localeMap[language] || 'ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const safeNumber = (val: unknown, fallback = 0): number => {
        if (typeof val === 'number' && !isNaN(val)) return val;
        return fallback;
    };

    return (
        <div className="memory-page">
            {/* Ambient Background */}
            <div className="memory-ambient">
                <div className="ambient-orb orb-1"></div>
                <div className="ambient-orb orb-2"></div>
                <div className="ambient-orb orb-3"></div>
            </div>

            {/* Header */}
            <header className="memory-header">
                <div className="header-left">
                    <div className="header-icon-wrap">
                        <Brain size={22} />
                    </div>
                    <div className="header-text">
                        <h1>{t('memory.title')}</h1>
                        <span>{t('memory.subtitle')}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="icon-btn" onClick={loadData} disabled={isLoading} title={t('common.refresh')}>
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                    </button>
                    <button className="action-btn primary" onClick={handleForceSummarize}>
                        <FileText size={16} />
                        <span>{t('memory.generateSummary')}</span>
                    </button>
                    <button className="icon-btn danger" onClick={handleClearMemory} title={t('memory.clearMemory')}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon cyan">
                            <MessageSquare size={18} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.total_conversations}</span>
                            <span className="stat-label">{t('memory.totalConversations')}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon purple">
                            <Database size={18} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{stats.total_summaries}</span>
                            <span className="stat-label">{t('memory.totalSummaries')}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <TrendingUp size={18} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{(safeNumber(stats.cache_hit_rate) * 100).toFixed(0)}%</span>
                            <span className="stat-label">{t('memory.cacheHitRate')}</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <Zap size={18} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-value">{safeNumber(stats.avg_processing_time).toFixed(1)}s</span>
                            <span className="stat-label">{t('memory.avgProcessingTime')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="memory-main">
                {/* Left: Conversation List */}
                <div className="list-panel">
                    {/* Search */}
                    <div className="search-section">
                        <div className="search-input-wrap">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder={t('memory.searchPlaceholder')}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            {searchKeyword && (
                                <button className="input-clear" onClick={() => setSearchKeyword('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <select
                            value={selectedEmotion}
                            onChange={(e) => setSelectedEmotion(e.target.value)}
                        >
                            <option value="">{t('memory.emotionFilter')}</option>
                            {Object.entries(config.emotions).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                        <button className="search-btn" onClick={handleSearch}>
                            <Search size={16} />
                        </button>
                        {(searchKeyword || selectedEmotion) && (
                            <button className="clear-btn" onClick={handleClearFilters}>
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="panel-tabs">
                        <button
                            className={`tab ${activeTab === 'conversations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('conversations')}
                        >
                            <MessageSquare size={14} />
                            {t('memory.conversations')}
                            <span className="tab-badge">{conversations.length}</span>
                        </button>
                        <button
                            className={`tab ${activeTab === 'summaries' ? 'active' : ''}`}
                            onClick={() => setActiveTab('summaries')}
                        >
                            <FileText size={14} />
                            {t('memory.summaries')}
                            <span className="tab-badge">{summaries.length}</span>
                        </button>
                        <button
                            className={`tab ${activeTab === 'coreMemory' ? 'active' : ''}`}
                            onClick={() => setActiveTab('coreMemory')}
                        >
                            <Star size={14} />
                            {language === 'ko' ? '핵심 기억' : language === 'ja' ? 'コアメモリ' : 'Core'}
                            <span className="tab-badge">{coreMemories.length}</span>
                        </button>
                        <button
                            className={`tab ${activeTab === 'workingMemory' ? 'active' : ''}`}
                            onClick={() => setActiveTab('workingMemory')}
                        >
                            <Hourglass size={14} />
                            {language === 'ko' ? '작업 기억' : language === 'ja' ? '作業メモリ' : 'Working'}
                            <span className="tab-badge">{workingMemories.length}</span>
                        </button>
                    </div>

                    {/* List */}
                    <div className="list-scroll">
                        {isLoading ? (
                            <div className="state-empty">
                                <div className="loader"></div>
                                <p>{t('common.loading')}</p>
                            </div>
                        ) : activeTab === 'conversations' ? (
                            conversations.length === 0 ? (
                                <div className="state-empty">
                                    <Sparkles size={36} />
                                    <p>{t('memory.noConversations')}</p>
                                    <span>{t('memory.noConversationsHint')}</span>
                                </div>
                            ) : (
                                <div className="conv-list">
                                    {conversations.map((conv) => {
                                        const emotionConfig = conv.emotion
                                            ? config.emotions[conv.emotion as keyof typeof config.emotions]
                                            : null;
                                        return (
                                            <div
                                                key={conv.id}
                                                className={`conv-card ${selectedConversation?.id === conv.id ? 'selected' : ''}`}
                                                onClick={() => setSelectedConversation(conv)}
                                            >
                                                <div className="conv-timeline">
                                                    <div className="timeline-dot"></div>
                                                    <div className="timeline-line"></div>
                                                </div>
                                                <div className="conv-body">
                                                    <div className="conv-meta">
                                                        <span className="conv-time">
                                                            <Clock size={12} />
                                                            {formatDate(conv.timestamp)}
                                                        </span>
                                                        {emotionConfig && (
                                                            <span 
                                                                className="conv-emotion-tag"
                                                                style={{ 
                                                                    color: emotionConfig.color,
                                                                    background: `${emotionConfig.color}18`
                                                                }}
                                                            >
                                                                {emotionConfig.icon}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="conv-msg user-msg">
                                                        <User size={12} />
                                                        <span>{conv.user_message}</span>
                                                    </div>
                                                    <div className="conv-msg assistant-msg">
                                                        <Moon size={12} />
                                                        <span>{conv.assistant_message}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="conv-delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteConversation(conv.id);
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <ChevronRight size={16} className="conv-arrow" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        ) : activeTab === 'summaries' ? (
                            summaries.length === 0 ? (
                                <div className="state-empty">
                                    <FileText size={36} />
                                    <p>{t('memory.noSummaries')}</p>
                                    <span>{t('memory.noSummariesHint')}</span>
                                </div>
                            ) : (
                                <div className="summary-list">
                                    {summaries.map((summary) => (
                                        <div key={summary.id} className="summary-card">
                                            <div className="summary-head">
                                                <span className="summary-time">
                                                    <Calendar size={12} />
                                                    {formatDate(summary.timestamp)}
                                                </span>
                                                <span className="summary-turns">{summary.summarized_turns} {t('memory.turns')}</span>
                                            </div>
                                            <p className="summary-text">{summary.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : activeTab === 'coreMemory' ? (
                            /* Core Memory List */
                            <div className="core-memory-section">
                                <div className="section-header">
                                    <h4>
                                        <Star size={16} />
                                        {language === 'ko' ? '핵심 기억 (영구 저장)' : language === 'ja' ? 'コアメモリ（永続的）' : 'Core Memory (Permanent)'}
                                    </h4>
                                    <button className="add-btn" onClick={() => setIsAddingCore(true)}>
                                        <Plus size={14} />
                                        {language === 'ko' ? '추가' : language === 'ja' ? '追加' : 'Add'}
                                    </button>
                                </div>
                                
                                {isAddingCore && (
                                    <div className="memory-form">
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '카테고리' : language === 'ja' ? 'カテゴリ' : 'Category'}</label>
                                            <select
                                                value={coreEditForm.category}
                                                onChange={(e) => setCoreEditForm({ ...coreEditForm, category: e.target.value })}
                                            >
                                                {Object.keys(categoryLabels).map((cat) => (
                                                    <option key={cat} value={cat}>
                                                        {categoryLabels[cat][language] || categoryLabels[cat]['en']}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '키 (이름)' : language === 'ja' ? 'キー' : 'Key'}</label>
                                            <input
                                                type="text"
                                                placeholder={language === 'ko' ? '예: 이름, 취미, 생일' : language === 'ja' ? '例：名前、趣味' : 'e.g., name, hobby'}
                                                value={coreEditForm.key}
                                                onChange={(e) => setCoreEditForm({ ...coreEditForm, key: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '값 (내용)' : language === 'ja' ? '値' : 'Value'}</label>
                                            <input
                                                type="text"
                                                placeholder={language === 'ko' ? '예: 다엘, 프로그래밍' : language === 'ja' ? '例：ダエル' : 'e.g., Dael'}
                                                value={coreEditForm.value}
                                                onChange={(e) => setCoreEditForm({ ...coreEditForm, value: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '중요도' : language === 'ja' ? '重要度' : 'Importance'}: {coreEditForm.importance}/10</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="10"
                                                value={coreEditForm.importance}
                                                onChange={(e) => setCoreEditForm({ ...coreEditForm, importance: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button className="action-btn primary" onClick={handleAddCoreMemory}>
                                                <Save size={14} />
                                                {language === 'ko' ? '저장' : language === 'ja' ? '保存' : 'Save'}
                                            </button>
                                            <button className="action-btn" onClick={() => setIsAddingCore(false)}>
                                                <XCircle size={14} />
                                                {language === 'ko' ? '취소' : language === 'ja' ? 'キャンセル' : 'Cancel'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {Object.keys(groupedCoreMemories).length === 0 ? (
                                    <div className="state-empty">
                                        <Star size={36} />
                                        <p>{language === 'ko' ? '핵심 기억이 없습니다' : language === 'ja' ? 'コアメモリがありません' : 'No core memories'}</p>
                                        <span>{language === 'ko' ? '루나와의 대화를 통해 영구 기억이 쌓여갑니다' : language === 'ja' ? 'ルナとの会話で永続的な記憶が蓄積されます' : 'Permanent memories will be accumulated through conversations'}</span>
                                    </div>
                                ) : (
                                    Object.entries(groupedCoreMemories).map(([category, memories]) => (
                                        <div key={category} className="core-category">
                                            <div className="category-header">
                                                {categoryIcons[category] || <BookOpen size={14} />}
                                                <span>{categoryLabels[category]?.[language] || category}</span>
                                                <span className="category-count">{memories.length}</span>
                                            </div>
                                            <div className="memory-items">
                                                {memories.map((mem) => (
                                                    <div 
                                                        key={mem.id} 
                                                        className={`memory-item ${selectedCoreMemory?.id === mem.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedCoreMemory(mem)}
                                                    >
                                                        <div className="memory-key">{mem.key}</div>
                                                        <div className="memory-value">{mem.value}</div>
                                                        <div className="memory-meta">
                                                            <span className="importance-badge" style={{ opacity: mem.importance / 10 }}>
                                                                ★ {mem.importance}
                                                            </span>
                                                        </div>
                                                        <button
                                                            className="memory-delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteCoreMemory(mem.id);
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Working Memory List */
                            <div className="working-memory-section">
                                <div className="section-header">
                                    <h4>
                                        <Hourglass size={16} />
                                        {language === 'ko' ? '작업 기억 (임시 저장)' : language === 'ja' ? '作業メモリ（一時的）' : 'Working Memory (Temporary)'}
                                    </h4>
                                    <div className="section-actions">
                                        <button className="icon-btn" onClick={handleCleanupExpiredMemories} title={language === 'ko' ? '만료된 기억 정리' : 'Cleanup expired'}>
                                            <RefreshCw size={14} />
                                        </button>
                                        <button className="add-btn" onClick={() => setIsAddingWorking(true)}>
                                            <Plus size={14} />
                                            {language === 'ko' ? '추가' : language === 'ja' ? '追加' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                                
                                {isAddingWorking && (
                                    <div className="memory-form">
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '주제' : language === 'ja' ? 'トピック' : 'Topic'}</label>
                                            <input
                                                type="text"
                                                placeholder={language === 'ko' ? '예: 현재 진행 중인 작업' : language === 'ja' ? '例：現在の作業' : 'e.g., Current task'}
                                                value={workingAddForm.topic}
                                                onChange={(e) => setWorkingAddForm({ ...workingAddForm, topic: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '내용' : language === 'ja' ? '内容' : 'Content'}</label>
                                            <textarea
                                                placeholder={language === 'ko' ? '기억할 내용을 입력하세요' : language === 'ja' ? '記憶する内容' : 'Content to remember'}
                                                value={workingAddForm.content}
                                                onChange={(e) => setWorkingAddForm({ ...workingAddForm, content: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-row">
                                            <label>{language === 'ko' ? '유효 기간' : language === 'ja' ? '有効期間' : 'TTL'}: {workingAddForm.ttl_days}{language === 'ko' ? '일' : language === 'ja' ? '日' : ' days'}</label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="7"
                                                value={workingAddForm.ttl_days}
                                                onChange={(e) => setWorkingAddForm({ ...workingAddForm, ttl_days: parseInt(e.target.value) })}
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button className="action-btn primary" onClick={handleAddWorkingMemory}>
                                                <Save size={14} />
                                                {language === 'ko' ? '저장' : language === 'ja' ? '保存' : 'Save'}
                                            </button>
                                            <button className="action-btn" onClick={() => setIsAddingWorking(false)}>
                                                <XCircle size={14} />
                                                {language === 'ko' ? '취소' : language === 'ja' ? 'キャンセル' : 'Cancel'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {workingMemories.length === 0 ? (
                                    <div className="state-empty">
                                        <Hourglass size={36} />
                                        <p>{language === 'ko' ? '작업 기억이 없습니다' : language === 'ja' ? '作業メモリがありません' : 'No working memories'}</p>
                                        <span>{language === 'ko' ? '대화 중 생성된 임시 기억이 여기에 표시됩니다' : language === 'ja' ? '会話中に生成された一時的な記憶がここに表示されます' : 'Temporary memories generated during conversations will appear here'}</span>
                                    </div>
                                ) : (
                                    <div className="working-list">
                                        {workingMemories.map((mem) => {
                                            const timeRemaining = getTimeRemaining(mem.expires_at);
                                            const isExpiringSoon = new Date(mem.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000;
                                            return (
                                                <div 
                                                    key={mem.id} 
                                                    className={`working-card ${selectedWorkingMemory?.id === mem.id ? 'selected' : ''} ${isExpiringSoon ? 'expiring' : ''}`}
                                                    onClick={() => setSelectedWorkingMemory(mem)}
                                                >
                                                    <div className="working-header">
                                                        <span className="working-topic">{mem.topic}</span>
                                                        <span className={`working-expires ${isExpiringSoon ? 'warning' : ''}`}>
                                                            <AlertCircle size={12} />
                                                            {timeRemaining}
                                                        </span>
                                                    </div>
                                                    <p className="working-content">{mem.content}</p>
                                                    <div className="working-footer">
                                                        <span className="importance-badge">★ {mem.importance}</span>
                                                        <div className="working-actions">
                                                            <button
                                                                className="extend-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleExtendWorkingMemory(mem.id);
                                                                }}
                                                                title={language === 'ko' ? '3일 연장' : language === 'ja' ? '3日延長' : 'Extend 3 days'}
                                                            >
                                                                <Clock size={12} />
                                                                +3d
                                                            </button>
                                                            <button
                                                                className="delete-btn"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteWorkingMemory(mem.id);
                                                                }}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Detail */}
                <div className="detail-panel">
                    {selectedConversation && activeTab === 'conversations' ? (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>
                                    <MessageSquare size={18} />
                                    {t('memory.conversationDetail')}
                                </h3>
                                <span className="detail-id">#{selectedConversation.id}</span>
                            </div>

                            <div className="detail-meta-grid">
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>{formatFullDate(selectedConversation.timestamp)}</span>
                                </div>
                                {selectedConversation.emotion && (
                                    <div className="meta-item">
                                        <Sparkles size={14} />
                                        <span>
                                            {config.emotions[selectedConversation.emotion as keyof typeof config.emotions]?.icon}{' '}
                                            {config.emotions[selectedConversation.emotion as keyof typeof config.emotions]?.label}
                                        </span>
                                    </div>
                                )}
                                {selectedConversation.intent && (
                                    <div className="meta-item">
                                        <Target size={14} />
                                        <span>{selectedConversation.intent}</span>
                                    </div>
                                )}
                                {selectedConversation.processing_time && (
                                    <div className="meta-item">
                                        <Timer size={14} />
                                        <span>{selectedConversation.processing_time.toFixed(2)}s</span>
                                    </div>
                                )}
                            </div>

                            <div className="detail-messages">
                                <div className="msg-bubble user">
                                    <div className="bubble-label">
                                        <User size={14} />
                                        {language === 'ko' ? '사용자' : language === 'ja' ? 'ユーザー' : 'User'}
                                    </div>
                                    <p>{selectedConversation.user_message}</p>
                                </div>
                                <div className="msg-bubble assistant">
                                    <div className="bubble-label">
                                        <Moon size={14} />
                                        L.U.N.A.
                                    </div>
                                    <p>{selectedConversation.assistant_message}</p>
                                </div>
                            </div>

                            <div className="detail-actions">
                                <button 
                                    className="action-btn danger"
                                    onClick={() => handleDeleteConversation(selectedConversation.id)}
                                >
                                    <Trash2 size={14} />
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    ) : selectedCoreMemory && activeTab === 'coreMemory' ? (
                        /* Core Memory Detail */
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>
                                    <Star size={18} />
                                    {language === 'ko' ? '핵심 기억 상세' : language === 'ja' ? 'コアメモリ詳細' : 'Core Memory Detail'}
                                </h3>
                                <span className="detail-id">#{selectedCoreMemory.id}</span>
                            </div>

                            <div className="detail-meta-grid">
                                <div className="meta-item">
                                    {categoryIcons[selectedCoreMemory.category] || <BookOpen size={14} />}
                                    <span>{categoryLabels[selectedCoreMemory.category]?.[language] || selectedCoreMemory.category}</span>
                                </div>
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>{formatFullDate(selectedCoreMemory.created_at)}</span>
                                </div>
                                <div className="meta-item">
                                    <Star size={14} />
                                    <span>{language === 'ko' ? `중요도: ${selectedCoreMemory.importance}/10` : `Importance: ${selectedCoreMemory.importance}/10`}</span>
                                </div>
                            </div>

                            <div className="core-detail-content">
                                <div className="detail-field">
                                    <label>{language === 'ko' ? '키' : language === 'ja' ? 'キー' : 'Key'}</label>
                                    <p>{selectedCoreMemory.key}</p>
                                </div>
                                <div className="detail-field">
                                    <label>{language === 'ko' ? '값' : language === 'ja' ? '値' : 'Value'}</label>
                                    {isEditingCore ? (
                                        <>
                                            <input
                                                type="text"
                                                value={coreEditForm.value}
                                                onChange={(e) => setCoreEditForm({ ...coreEditForm, value: e.target.value })}
                                            />
                                            <div className="form-row">
                                                <label>{language === 'ko' ? '중요도' : 'Importance'}: {coreEditForm.importance}</label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="10"
                                                    value={coreEditForm.importance}
                                                    onChange={(e) => setCoreEditForm({ ...coreEditForm, importance: parseInt(e.target.value) })}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <p>{selectedCoreMemory.value}</p>
                                    )}
                                </div>
                                {selectedCoreMemory.source && (
                                    <div className="detail-field">
                                        <label>{language === 'ko' ? '출처' : language === 'ja' ? 'ソース' : 'Source'}</label>
                                        <p className="source-text">{selectedCoreMemory.source}</p>
                                    </div>
                                )}
                            </div>

                            <div className="detail-actions">
                                {isEditingCore ? (
                                    <>
                                        <button className="action-btn primary" onClick={handleUpdateCoreMemory}>
                                            <Save size={14} />
                                            {language === 'ko' ? '저장' : 'Save'}
                                        </button>
                                        <button className="action-btn" onClick={() => setIsEditingCore(false)}>
                                            <XCircle size={14} />
                                            {language === 'ko' ? '취소' : 'Cancel'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            className="action-btn"
                                            onClick={() => {
                                                setCoreEditForm({
                                                    category: selectedCoreMemory.category,
                                                    key: selectedCoreMemory.key,
                                                    value: selectedCoreMemory.value,
                                                    importance: selectedCoreMemory.importance
                                                });
                                                setIsEditingCore(true);
                                            }}
                                        >
                                            <Edit3 size={14} />
                                            {language === 'ko' ? '수정' : 'Edit'}
                                        </button>
                                        <button 
                                            className="action-btn danger"
                                            onClick={() => handleDeleteCoreMemory(selectedCoreMemory.id)}
                                        >
                                            <Trash2 size={14} />
                                            {t('common.delete')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : selectedWorkingMemory && activeTab === 'workingMemory' ? (
                        /* Working Memory Detail */
                        <div className="detail-content">
                            <div className="detail-header">
                                <h3>
                                    <Hourglass size={18} />
                                    {language === 'ko' ? '작업 기억 상세' : language === 'ja' ? '作業メモリ詳細' : 'Working Memory Detail'}
                                </h3>
                                <span className="detail-id">#{selectedWorkingMemory.id}</span>
                            </div>

                            <div className="detail-meta-grid">
                                <div className="meta-item">
                                    <Clock size={14} />
                                    <span>{formatFullDate(selectedWorkingMemory.created_at)}</span>
                                </div>
                                <div className="meta-item">
                                    <AlertCircle size={14} />
                                    <span className={new Date(selectedWorkingMemory.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000 ? 'warning-text' : ''}>
                                        {getTimeRemaining(selectedWorkingMemory.expires_at)}
                                    </span>
                                </div>
                                <div className="meta-item">
                                    <Star size={14} />
                                    <span>{language === 'ko' ? `중요도: ${selectedWorkingMemory.importance}/10` : `Importance: ${selectedWorkingMemory.importance}/10`}</span>
                                </div>
                            </div>

                            <div className="working-detail-content">
                                <div className="detail-field">
                                    <label>{language === 'ko' ? '주제' : language === 'ja' ? 'トピック' : 'Topic'}</label>
                                    <p className="topic-text">{selectedWorkingMemory.topic}</p>
                                </div>
                                <div className="detail-field">
                                    <label>{language === 'ko' ? '내용' : language === 'ja' ? '内容' : 'Content'}</label>
                                    <p>{selectedWorkingMemory.content}</p>
                                </div>
                                <div className="detail-field">
                                    <label>{language === 'ko' ? '만료 일시' : language === 'ja' ? '期限' : 'Expires At'}</label>
                                    <p>{formatFullDate(selectedWorkingMemory.expires_at)}</p>
                                </div>
                            </div>

                            <div className="detail-actions">
                                <button 
                                    className="action-btn primary"
                                    onClick={() => handleExtendWorkingMemory(selectedWorkingMemory.id)}
                                >
                                    <Clock size={14} />
                                    {language === 'ko' ? '3일 연장' : language === 'ja' ? '3日延長' : 'Extend 3 days'}
                                </button>
                                <button 
                                    className="action-btn danger"
                                    onClick={() => handleDeleteWorkingMemory(selectedWorkingMemory.id)}
                                >
                                    <Trash2 size={14} />
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="detail-empty">
                            <div className="empty-icon">
                                <Brain size={48} />
                            </div>
                            <h4>{activeTab === 'coreMemory' 
                                ? (language === 'ko' ? '핵심 기억을 선택하세요' : language === 'ja' ? 'コアメモリを選択' : 'Select a core memory')
                                : activeTab === 'workingMemory'
                                ? (language === 'ko' ? '작업 기억을 선택하세요' : language === 'ja' ? '作業メモリを選択' : 'Select a working memory')
                                : t('memory.selectConversation')
                            }</h4>
                            <p>{activeTab === 'coreMemory' 
                                ? (language === 'ko' ? '왼쪽 목록에서 항목을 클릭하면 상세 정보를 볼 수 있습니다' : 'Click an item from the list to view details')
                                : activeTab === 'workingMemory'
                                ? (language === 'ko' ? '왼쪽 목록에서 항목을 클릭하면 상세 정보를 볼 수 있습니다' : 'Click an item from the list to view details')
                                : t('memory.selectConversationHint')
                            }</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemoryPage;
