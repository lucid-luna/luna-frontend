// ====================================================================
// L.U.N.A. Layout Component
// ====================================================================

import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useApp, useDebug } from '../../context';
import Sidebar from './Sidebar';
import Header from './Header';
import PageTransition from './PageTransition';
import { DebugPanel } from '../Debug';
import './Layout.css';

const Layout = () => {
    const { state } = useApp();
    const { logs, isDebugPanelOpen, clearLogs, setDebugPanelOpen } = useDebug();
    const location = useLocation();
    
    // Only show debug panel if experimental features are enabled
    const showDebugPanel = state.settings.experimentalFeatures && isDebugPanelOpen;

    return (
        <div className={`layout ${state.sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
            <Sidebar />
            <div className="layout-main">
                <Header />
                <main className={`layout-content ${showDebugPanel ? 'debug-open' : ''}`}>
                    <AnimatePresence mode="wait">
                        <PageTransition key={location.pathname}>
                            <Outlet />
                        </PageTransition>
                    </AnimatePresence>
                </main>
            </div>
            
            {/* Global Debug Panel - Only when experimental features enabled */}
            {state.settings.experimentalFeatures && (
                <DebugPanel
                    isOpen={isDebugPanelOpen}
                    onClose={() => setDebugPanelOpen(false)}
                    logs={logs}
                    onClearLogs={clearLogs}
                />
            )}
        </div>
    );
};

export default Layout;
