// ====================================================================
// L.U.N.A. Header Component - Deep Sea Glassmorphism Theme
// ====================================================================

import React from 'react';
import { useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    MessageCircle, 
    Brain, 
    Wrench, 
    Settings,
    AlertTriangle,
    Loader2,
    Mic,
    Cpu,
    HardDrive
} from 'lucide-react';
import { useApp } from '../../context';
import { useMusic } from '../../context/MusicContext';
import { Volume2, VolumeX } from 'lucide-react';
import { Tooltip } from '../Common';
import './Header.css';

const pageConfig: Record<string, { title: string; icon: React.ReactNode }> = {
    '/dashboard': { title: '대시보드', icon: <LayoutDashboard size={20} /> },
    '/chat': { title: '채팅', icon: <MessageCircle size={20} /> },
    '/memory': { title: '메모리', icon: <Brain size={20} /> },
    '/tools': { title: 'MCP 도구', icon: <Wrench size={20} /> },
    '/settings': { title: '설정', icon: <Settings size={20} /> },
};

const Header: React.FC = () => {
    const { state } = useApp();
    const location = useLocation();
    const { isMuted, fadeIn, fadeOut } = useMusic();

    const currentPage = pageConfig[location.pathname] || { title: 'L.U.N.A.', icon: null };

    const handleToggleMute = () => {
        if (isMuted) fadeIn();
        else fadeOut();
    };

    return (
        <header className="header">
            <div className="header-glass" />

            <div className="header-content">
                <div className="header-left">
                    <div className="page-indicator">
                        {currentPage.icon && (
                            <span className="page-icon">{currentPage.icon}</span>
                        )}
                        <h1 className="header-title">{currentPage.title}</h1>
                    </div>
                </div>

                <div className="header-center">
                    {!state.isConnected && (
                        <div className="connection-warning">
                            <AlertTriangle size={14} />
                            <span>서버 연결 끊김</span>
                        </div>
                    )}
                </div>

                <div className="header-right">
                    {state.isLoading && (
                        <div className="header-status loading">
                            <Loader2 size={14} className="spin" />
                            <span>처리 중...</span>
                        </div>
                    )}

                    {state.isRecording && (
                        <div className="header-status recording">
                            <Mic size={14} />
                            <span>녹음 중</span>
                        </div>
                    )}

                    {state.systemMetrics && (
                        <div className="header-metrics">
                            <div className="metric-item" title="CPU 사용량">
                                <Cpu size={14} />
                                <span className="metric-value">
                                    {state.systemMetrics.cpu_percent.toFixed(0)}%
                                </span>
                            </div>
                            <div className="metric-item" title="메모리 사용량">
                                <HardDrive size={14} />
                                <span className="metric-value">
                                    {state.systemMetrics.memory_percent.toFixed(0)}%
                                </span>
                            </div>
                        </div>
                    )}

                    {/* 사운드 토글 버튼 + Tooltip */}
                    <Tooltip content={isMuted ? '소리 켜기' : '소리 끄기'} position="bottom">
                        <button className="sound-toggle" onClick={handleToggleMute}>
                            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                        </button>
                    </Tooltip>
                </div>
            </div>
        </header>
    );
};

export default Header;
