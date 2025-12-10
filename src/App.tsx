/**
 * L.U.N.A. Frontend - Main Application
 * Routes configuration and app wrapper
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AppProvider, DebugProvider } from './context';
import { MusicProvider } from './context/MusicContext';
import { ToastProvider } from './components/Common';
import {
    HomePage,
    ChatPage,
    DashboardPage,
    MemoryPage,
    ToolsPage,
    MarketplacePage,
    SettingsPage
} from './pages';
import './styles/global.css';

const App: React.FC = () => {
    return (
        <MusicProvider>
            <AppProvider>
                <DebugProvider>
                    <ToastProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Home Page - No Layout */}
                                <Route path="/" element={<HomePage />} />

                                {/* App Pages - With Layout */}
                                <Route element={<Layout />}>
                                    <Route path="dashboard" element={<DashboardPage />} />
                                    <Route path="chat" element={<ChatPage />} />
                                    <Route path="memory" element={<MemoryPage />} />
                                    <Route path="tools" element={<ToolsPage />} />
                                    <Route path="marketplace" element={<MarketplacePage />} />
                                    <Route path="settings" element={<SettingsPage />} />
                                </Route>

                                {/* 404 fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </BrowserRouter>
                    </ToastProvider>
                </DebugProvider>
            </AppProvider>
        </MusicProvider>
    );
};

export default App;
