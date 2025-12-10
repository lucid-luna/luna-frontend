// ====================================================================
// L.U.N.A. Marketplace Page - MCP Server Discovery & Installation
// Now powered by the official MCP Registry API! 🎉
// ====================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
    Store,
    Search,
    Download,
    Check,
    ExternalLink,
    Filter,
    Loader2,
    AlertCircle,
    Package,
    Sparkles,
    X,
    Key,
    ChevronDown,
    RefreshCw,
    WifiOff
} from 'lucide-react';
import { mcpService } from '../../services';
import { useTranslation } from '../../hooks/useTranslation';
import { useMCPRegistry, categoryLabels } from '../../hooks/useMCPRegistry';
import { useToast } from '../../components/Common';
import type { MCPServerItem } from '../../services/mcpRegistryService';
import type { MCPServer } from '../../types';
import './MarketplacePage.css';

// Install Modal Component
interface InstallModalProps {
    item: MCPServerItem | null;
    isOpen: boolean;
    onClose: () => void;
    onInstall: (item: MCPServerItem, envValues: Record<string, string>) => Promise<void>;
}

const InstallModal: React.FC<InstallModalProps> = ({ item, isOpen, onClose, onInstall }) => {
    const { language } = useTranslation();
    const [envValues, setEnvValues] = useState<Record<string, string>>({});
    const [installing, setInstalling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (item?.envRequired) {
            const initialEnv: Record<string, string> = {};
            item.envRequired.forEach(key => { initialEnv[key] = ''; });
            setEnvValues(initialEnv);
        } else {
            setEnvValues({});
        }
        setError(null);
    }, [item]);

    const handleInstall = async () => {
        if (!item) return;

        // Check required env vars
        if (item.envRequired) {
            for (const key of item.envRequired) {
                if (!envValues[key]?.trim()) {
                    setError(language === 'ko' ? `${key}는 필수입니다.` : `${key} is required.`);
                    return;
                }
            }
        }

        setInstalling(true);
        setError(null);

        try {
            await onInstall(item, envValues);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Installation failed');
        } finally {
            setInstalling(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content install-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">
                        <span className="modal-icon">{item.icon}</span>
                        <div>
                            <h3>{item.displayName}</h3>
                            <span className="modal-author">by {item.author}</span>
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="install-description">{item.description}</p>

                    <div className="install-info">
                        <div className="info-row">
                            <span className="info-label">{language === 'ko' ? '설치 방식' : 'Install Type'}</span>
                            <span className="info-value badge">{item.installType}</span>
                        </div>
                        {item.command && item.args && (
                            <div className="info-row">
                                <span className="info-label">{language === 'ko' ? '명령어' : 'Command'}</span>
                                <code className="info-code">{item.command} {item.args.join(' ')}</code>
                            </div>
                        )}
                        {item.remoteUrl && (
                            <div className="info-row">
                                <span className="info-label">{language === 'ko' ? '원격 URL' : 'Remote URL'}</span>
                                <code className="info-code">{item.remoteUrl}</code>
                            </div>
                        )}
                        {item.version && (
                            <div className="info-row">
                                <span className="info-label">{language === 'ko' ? '버전' : 'Version'}</span>
                                <span className="info-value">{item.version}</span>
                            </div>
                        )}
                    </div>

                    {item.envRequired && item.envRequired.length > 0 && (
                        <div className="env-section">
                            <h4>
                                <Key size={14} />
                                {language === 'ko' ? '필수 환경 변수' : 'Required Environment Variables'}
                            </h4>
                            <div className="env-fields">
                                {item.envRequired.map(key => (
                                    <div key={key} className="env-field">
                                        <label>{key}</label>
                                        <input
                                            type={key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                                            value={envValues[key] || ''}
                                            onChange={e => setEnvValues({ ...envValues, [key]: e.target.value })}
                                            placeholder={`Enter ${key}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="modal-error">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        {language === 'ko' ? '취소' : 'Cancel'}
                    </button>
                    <button className="btn-install" onClick={handleInstall} disabled={installing}>
                        {installing ? (
                            <Loader2 size={16} className="spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {language === 'ko' ? '설치' : 'Install'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MarketplacePage: React.FC = () => {
    const { language } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [installedServers, setInstalledServers] = useState<MCPServer[]>([]);
    const [installModal, setInstallModal] = useState<MCPServerItem | null>(null);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const toast = useToast();

    // Use the MCP Registry hook - fetches from official API
    const {
        servers,
        featuredServers,
        loading: registryLoading,
        error: registryError,
        hasMore,
        loadMore,
        refresh,
        search,
        isUsingFallback
    } = useMCPRegistry();

    // Load installed servers from local config
    const [installedLoading, setInstalledLoading] = useState(false);
    const loadInstalledServers = async () => {
        setInstalledLoading(true);
        try {
            const data = await mcpService.getServers();
            setInstalledServers(data.servers);
        } catch (error) {
            console.error('Failed to load servers:', error);
        } finally {
            setInstalledLoading(false);
        }
    };

    useEffect(() => {
        loadInstalledServers();
    }, []);

    // Check if server is installed
    const isInstalled = (itemId: string) => {
        return installedServers.some(s => s.id === itemId || s.id === itemId.toLowerCase());
    };

    // Filter items based on search and category
    const filteredItems = useMemo(() => {
        let items = servers;

        // Search filter
        if (searchQuery) {
            items = search(searchQuery);
        }

        // Category filter
        if (selectedCategory) {
            items = items.filter(item => item.category === selectedCategory);
        }

        return items;
    }, [servers, searchQuery, selectedCategory, search]);

    // Handle install
    const handleInstall = async (item: MCPServerItem, envValues: Record<string, string>) => {
        try {
            const serverConfig: Partial<MCPServer> & { id: string } = {
                id: item.id,
                transport: item.remoteUrl ? 'sse' : 'stdio',
                enabled: true,
            };

            if (item.command && item.args) {
                serverConfig.command = item.command;
                serverConfig.args = item.args;
            }

            if (item.remoteUrl) {
                serverConfig.url = item.remoteUrl;
            }

            if (Object.keys(envValues).length > 0) {
                serverConfig.env = envValues;
            }

            await mcpService.addServer(serverConfig as MCPServer);
            await loadInstalledServers();
            
            toast.success(
                language === 'ko' ? '설치 완료' : 'Installation Complete',
                language === 'ko' ? `${item.displayName} 서버가 설치되었습니다` : `${item.displayName} server has been installed`
            );
        } catch (error) {
            toast.error(
                language === 'ko' ? '설치 실패' : 'Installation Failed',
                error instanceof Error ? error.message : 'Unknown error'
            );
            throw error;
        }
    };

    // Get category label
    const getCategoryLabel = (category: string) => {
        const labels = categoryLabels[category];
        if (!labels) return category;
        return language === 'ko' ? labels.ko : language === 'ja' ? labels.ja : labels.en;
    };

    const isLoading = registryLoading || installedLoading;

    return (
        <div className="marketplace-page">
            {/* Ambient Background */}
            <div className="marketplace-ambient">
                <div className="ambient-orb orb-1" />
                <div className="ambient-orb orb-2" />
                <div className="ambient-orb orb-3" />
            </div>

            {/* Header */}
            <header className="marketplace-header">
                <div className="header-left">
                    <div className="header-icon-wrap">
                        <Store size={22} />
                    </div>
                    <div className="header-text">
                        <h1>{language === 'ko' ? 'MCP 마켓플레이스' : language === 'ja' ? 'MCPマーケットプレイス' : 'MCP Marketplace'}</h1>
                        <span>
                            {isUsingFallback 
                                ? (language === 'ko' ? '오프라인 모드 (로컬 데이터)' : 'Offline mode (local data)')
                                : (language === 'ko' ? '공식 MCP 레지스트리' : 'Live data from official MCP Registry')
                            }
                        </span>
                    </div>
                </div>
                <div className="header-actions">
                    {isUsingFallback && (
                        <span className="fallback-badge" title={language === 'ko' ? 'API 연결 실패 - 로컬 데이터 사용중' : 'API connection failed - using local data'}>
                            <WifiOff size={14} />
                        </span>
                    )}
                    <button className="action-btn" onClick={refresh} disabled={isLoading}>
                        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>
            </header>

            {/* API Error Notice */}
            {registryError && (
                <div className="api-error-notice">
                    <AlertCircle size={16} />
                    <span>{language === 'ko' ? `API 오류: ${registryError}` : `API Error: ${registryError}`}</span>
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="marketplace-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={language === 'ko' ? 'MCP 서버 검색...' : 'Search MCP servers...'}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                <div className="category-dropdown">
                    <button 
                        className={`dropdown-trigger ${selectedCategory ? 'active' : ''}`}
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    >
                        <Filter size={16} />
                        <span>
                            {selectedCategory 
                                ? `${categoryLabels[selectedCategory]?.icon} ${getCategoryLabel(selectedCategory)}`
                                : (language === 'ko' ? '카테고리' : 'Category')
                            }
                        </span>
                        <ChevronDown size={14} />
                    </button>
                    {showCategoryDropdown && (
                        <div className="dropdown-menu">
                            <button 
                                className={!selectedCategory ? 'active' : ''}
                                onClick={() => { setSelectedCategory(null); setShowCategoryDropdown(false); }}
                            >
                                {language === 'ko' ? '전체' : 'All'}
                            </button>
                            {Object.entries(categoryLabels).map(([key, labels]) => (
                                <button
                                    key={key}
                                    className={selectedCategory === key ? 'active' : ''}
                                    onClick={() => { setSelectedCategory(key); setShowCategoryDropdown(false); }}
                                >
                                    <span>{labels.icon}</span>
                                    {language === 'ko' ? labels.ko : language === 'ja' ? labels.ja : labels.en}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="filter-stats">
                    <Package size={14} />
                    <span>{filteredItems.length} {language === 'ko' ? '개 서버' : 'servers'}</span>
                </div>
            </div>

            {/* Featured Section */}
            {!searchQuery && !selectedCategory && featuredServers.length > 0 && (
                <section className="featured-section">
                    <h2>
                        <Sparkles size={18} />
                        {language === 'ko' ? '추천 서버' : 'Featured'}
                    </h2>
                    <div className="featured-grid">
                        {featuredServers.map(item => (
                            <div 
                                key={item.id} 
                                className={`featured-card ${isInstalled(item.id) ? 'installed' : ''}`}
                                onClick={() => !isInstalled(item.id) && setInstallModal(item)}
                            >
                                <div className="featured-icon">{item.icon}</div>
                                <div className="featured-info">
                                    <h3>{item.displayName}</h3>
                                    <p>{item.description}</p>
                                    <div className="featured-meta">
                                        <span className="category-tag">
                                            {categoryLabels[item.category]?.icon} {getCategoryLabel(item.category)}
                                        </span>
                                        <span className="version-tag">v{item.version}</span>
                                    </div>
                                </div>
                                <div className="featured-action">
                                    {isInstalled(item.id) ? (
                                        <span className="installed-badge">
                                            <Check size={14} />
                                            {language === 'ko' ? '설치됨' : 'Installed'}
                                        </span>
                                    ) : (
                                        <button className="install-btn">
                                            <Download size={14} />
                                            {language === 'ko' ? '설치' : 'Install'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Loading State */}
            {registryLoading && servers.length === 0 && (
                <div className="loading-state">
                    <Loader2 size={48} className="spin" />
                    <p>{language === 'ko' ? 'MCP 서버 로딩 중...' : 'Loading MCP servers...'}</p>
                </div>
            )}

            {/* All Servers Grid */}
            <section className="servers-section">
                <h2>
                    <Package size={18} />
                    {searchQuery || selectedCategory 
                        ? (language === 'ko' ? '검색 결과' : 'Search Results')
                        : (language === 'ko' ? '모든 서버' : 'All Servers')
                    }
                </h2>
                
                {!registryLoading && filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} />
                        <h3>{language === 'ko' ? '결과 없음' : 'No results'}</h3>
                        <p>{language === 'ko' ? '검색어를 변경해보세요' : 'Try a different search term'}</p>
                    </div>
                ) : (
                    <>
                        <div className="servers-grid">
                            {filteredItems.map(item => (
                                <div 
                                    key={`${item.id}-${item.version}`} 
                                    className={`server-card ${isInstalled(item.id) ? 'installed' : ''}`}
                                    onClick={() => !isInstalled(item.id) && setInstallModal(item)}
                                >
                                    {item.isOfficial && (
                                        <span className="official-badge">✓ Official</span>
                                    )}
                                    <div className="server-header">
                                        <span className="server-icon">{item.icon}</span>
                                        <div className="server-title">
                                            <h3>{item.displayName}</h3>
                                            <span className="server-author">by {item.author}</span>
                                        </div>
                                        {isInstalled(item.id) && (
                                            <span className="installed-indicator">
                                                <Check size={12} />
                                            </span>
                                        )}
                                    </div>
                                    <p className="server-desc">{item.description}</p>
                                    <div className="server-footer">
                                        <div className="server-tags">
                                            <span className="tag category">
                                                {categoryLabels[item.category]?.icon}
                                            </span>
                                            <span className="tag type">{item.installType}</span>
                                            {item.source === 'github' && (
                                                <span className="tag github">🐙</span>
                                            )}
                                            {item.envRequired && item.envRequired.length > 0 && (
                                                <span className="tag env">
                                                    <Key size={10} />
                                                    {item.envRequired.length}
                                                </span>
                                            )}
                                        </div>
                                        <span className="server-version">v{item.version}</span>
                                    </div>
                                    {item.homepage && (
                                        <a 
                                            href={item.homepage} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="server-link"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Load More Button */}
                        {hasMore && !searchQuery && (
                            <div className="load-more-container">
                                <button 
                                    className="load-more-btn" 
                                    onClick={loadMore}
                                    disabled={registryLoading}
                                >
                                    {registryLoading ? (
                                        <Loader2 size={16} className="spin" />
                                    ) : (
                                        <Download size={16} />
                                    )}
                                    {language === 'ko' ? '더 보기' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* Install Modal */}
            <InstallModal
                item={installModal}
                isOpen={!!installModal}
                onClose={() => setInstallModal(null)}
                onInstall={handleInstall}
            />
        </div>
    );
};

export default MarketplacePage;
