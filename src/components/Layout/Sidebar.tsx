// ====================================================================
// L.U.N.A. Sidebar Component - Deep Sea Glassmorphism Theme
// i18n Support
// ====================================================================

import React, { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fadeInVariants } from '../../utils/motion';
import { 
    MessageCircle, 
    LayoutDashboard, 
    Brain, 
    Wrench, 
    Store,
    Settings,
    ChevronLeft,
    ChevronRight,
    Moon,
    Wifi,
    WifiOff,
    Monitor,
    MonitorOff
} from 'lucide-react';
import { useApp } from '../../context';
import { useTranslation } from '../../hooks/useTranslation';
import { Tooltip } from '../Common';
import './Sidebar.css';

interface NavItem {
    id: string;
    labelKey: string;
    icon: React.ReactNode;
    path: string;
}

const navConfig: NavItem[] = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { id: 'chat', labelKey: 'nav.chat', icon: <MessageCircle size={20} />, path: '/chat' },
    { id: 'memory', labelKey: 'nav.memory', icon: <Brain size={20} />, path: '/memory' },
    { id: 'tools', labelKey: 'nav.tools', icon: <Wrench size={20} />, path: '/tools' },
    { id: 'marketplace', labelKey: 'nav.marketplace', icon: <Store size={20} />, path: '/marketplace' },
    { id: 'settings', labelKey: 'nav.settings', icon: <Settings size={20} />, path: '/settings' },
];

const Sidebar: React.FC = () => {
    const { state, dispatch } = useApp();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const navItems = useMemo(() => 
        navConfig.map(item => ({
            ...item,
            label: t(item.labelKey),
        })),
        [t]
    );

    const toggleSidebar = () => {
        dispatch({ type: 'TOGGLE_SIDEBAR' });
    };

    return (
        <aside className={`sidebar ${state.sidebarOpen ? 'expanded' : 'collapsed'}`}>
            {/* Glass Effect Background */}
            <div className="sidebar-glass" />

            <div className="sidebar-content">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="logo-icon-wrapper">
                            {/* 달 아이콘 클릭 시 홈으로 이동, motion 적용 */}
                            <motion.button
                                className="moon-home-link"
                                aria-label="홈으로 이동"
                                initial="hidden"
                                animate="visible"
                                variants={fadeInVariants}
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                onClick={e => {
                                    e.preventDefault();
                                    // 애니메이션 후 자연스럽게 이동
                                    setTimeout(() => navigate('/'), 200);
                                }}
                            >
                                <Moon size={24} className="logo-icon" />
                            </motion.button>
                        </div>
                        {state.sidebarOpen && (
                            <span className="logo-text">L.U.N.A.</span>
                        )}
                    </div>
                    <Tooltip content={t('nav.toggleSidebar')} position="right">
                        <button 
                            className="sidebar-toggle" 
                            onClick={toggleSidebar}
                        >
                            {state.sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </Tooltip>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Tooltip 
                            key={item.id}
                            content={item.label} 
                            position="right"
                            disabled={state.sidebarOpen}
                        >
                            <NavLink
                                to={item.path}
                                className={({ isActive }: { isActive: boolean }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {state.sidebarOpen && (
                                    <span className="nav-label">{item.label}</span>
                                )}
                                <span className="nav-highlight" />
                            </NavLink>
                        </Tooltip>
                    ))}
                </nav>

                {/* Footer */}
                <div className="sidebar-footer">
                    {/* Server Connection Status */}
                    <Tooltip 
                        content={state.isConnected ? 'Backend 연결됨' : 'Backend 연결 안 됨'} 
                        position="right"
                    >
                        <div className="connection-status">
                            <span className={`status-indicator ${state.isConnected ? 'connected' : 'disconnected'}`}>
                                {state.isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                            </span>
                            {state.sidebarOpen && (
                                <span className="status-text">
                                    {state.isConnected ? t('settings.connected') : t('settings.disconnected')}
                                </span>
                            )}
                        </div>
                    </Tooltip>
                    
                    {/* Unity Connection Status */}
                    <Tooltip 
                        content={state.unityStatus.connected ? `Unity 연결됨 (${state.unityStatus.clientCount}개 클라이언트)` : 'Unity 연결 안 됨'} 
                        position="right"
                    >
                        <div className="connection-status unity-status">
                            <span className={`status-indicator ${state.unityStatus.connected ? 'connected' : 'disconnected'}`}>
                                {state.unityStatus.connected ? <Monitor size={14} /> : <MonitorOff size={14} />}
                            </span>
                            {state.sidebarOpen && (
                                <span className="status-text">
                                    Unity {state.unityStatus.connected ? `(${state.unityStatus.clientCount})` : 'Off'}
                                </span>
                            )}
                        </div>
                    </Tooltip>
                    
                    {state.sidebarOpen && state.serverHealth && (
                        <div className="version-info">
                            v{state.serverHealth.version}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
