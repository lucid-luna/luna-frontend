// ====================================================================
// L.U.N.A. Chat Sessions - Conversation Session Management
// ====================================================================

import React, { useState, useEffect } from 'react';
import {
    Plus,
    MessageSquare,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Clock,
    MoreVertical,
    Edit3,
    Check,
    X,
    Lock as LockIcon
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../components/Common';
import type { ChatMessage } from '../../types';
import './ChatSessions.css';
import PasswordModal from '../../components/Common/PasswordModal';
import Tooltip from '../../components/Common/Tooltip';

// Session type
export interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

interface ChatSessionsProps {
    currentMessages: ChatMessage[];
    onNewSession: () => void;
    onLoadSession: (session: ChatSession) => void;
    onSaveSession: (messages: ChatMessage[]) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const STORAGE_KEY = 'luna_chat_sessions';
const CURRENT_SESSION_KEY = 'luna_current_session';

// Storage helpers
const loadSessions = (): ChatSession[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const sessions = JSON.parse(data);
            return sessions.map((s: any) => ({
                ...s,
                createdAt: new Date(s.createdAt),
                updatedAt: new Date(s.updatedAt),
                messages: s.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }))
            }));
        }
    } catch (e) {
        console.error('Failed to load sessions:', e);
    }
    return [];
};

const saveSessions = (sessions: ChatSession[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error('Failed to save sessions:', e);
    }
};

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateTitle = (messages: ChatMessage[]): string => {
    const firstUserMessage = messages.find(m => m.role === 'user');
    if (firstUserMessage) {
        const content = firstUserMessage.content;
        return content.length > 30 ? content.substring(0, 30) + '...' : content;
    }
    return '새 대화';
};

const ChatSessions: React.FC<ChatSessionsProps> = ({
    currentMessages,
    onNewSession,
    onLoadSession,
    onSaveSession,
    isCollapsed,
    onToggleCollapse
}) => {
    const { language } = useTranslation();
    const toast = useToast();
    let CryptoJS: any = undefined;
    try { CryptoJS = require('crypto-js'); } catch {}

    const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
        return localStorage.getItem(CURRENT_SESSION_KEY);
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [pendingExportSession, setPendingExportSession] = useState<ChatSession | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importedFileContent, setImportedFileContent] = useState<string | null>(null);

    // Auto-save current messages
    useEffect(() => {
        if (currentMessages.length > 0) {
            if (currentSessionId) {
                setSessions(prev => {
                    const currentSession = prev.find(s => s.id === currentSessionId);
                    const isSame = currentSession && JSON.stringify(currentSession.messages) === JSON.stringify(currentMessages);
                    if (isSame) return prev;
                    const updated = prev.map(s => 
                        s.id === currentSessionId 
                            ? { 
                                ...s, 
                                messages: currentMessages, 
                                updatedAt: new Date(),
                                title: s.title === '새 대화' || s.title === 'New Chat' 
                                    ? generateTitle(currentMessages) 
                                    : s.title
                            }
                            : s
                    );
                    saveSessions(updated);
                    return updated;
                });
            } else {
                const alreadyExists = sessions.some(s => JSON.stringify(s.messages) === JSON.stringify(currentMessages));
                if (alreadyExists) return;
                const newSession: ChatSession = {
                    id: generateSessionId(),
                    title: generateTitle(currentMessages),
                    messages: currentMessages,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                setCurrentSessionId(newSession.id);
                localStorage.setItem(CURRENT_SESSION_KEY, newSession.id);
                setSessions(prev => {
                    const updated = [newSession, ...prev];
                    saveSessions(updated);
                    return updated;
                });
            }
        }
    }, [currentMessages, currentSessionId]);

    const handleNewSession = () => {
        setCurrentSessionId(null);
        localStorage.removeItem(CURRENT_SESSION_KEY);
        onNewSession();
    };

    const handleLoadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        localStorage.setItem(CURRENT_SESSION_KEY, session.id);
        onLoadSession(session);
        setMenuOpenId(null);
    };

    const handleDeleteSession = (sessionId: string) => {
        setSessions(prev => {
            const updated = prev.filter(s => s.id !== sessionId);
            saveSessions(updated);
            return updated;
        });
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
            localStorage.removeItem(CURRENT_SESSION_KEY);
            onNewSession();
        }
        setMenuOpenId(null);
        toast.success(
            language === 'ko' ? '대화 삭제됨' : language === 'ja' ? '会話が削除されました' : 'Chat deleted'
        );
    };

        // 내보내기 (plain)
        const handleExportSession = (session: ChatSession) => {
            const dataStr = JSON.stringify(session, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const filename = `luna-session-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(language === 'ko' ? '내보내기 완료' : language === 'ja' ? 'エクスポート完了' : 'Exported!');
        };

        // 암호화 내보내기
        const handleExportEncrypted = (session: ChatSession) => {
            setPendingExportSession(session);
            setPasswordModalOpen(true);
        };

    const handlePasswordSubmit = (password: string) => {
        setPasswordModalOpen(false);
        if (!pendingExportSession) return;
        if (!CryptoJS) {
            toast.error('암호화 라이브러리 로드 실패');
            return;
        }
        try {
            const dataStr = JSON.stringify(pendingExportSession);
            const encrypted = CryptoJS.AES.encrypt(dataStr, password).toString();
            const blob = new Blob([encrypted], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const filename = `luna-session-${new Date().toISOString().replace(/[:.]/g,'-')}.enc.txt`;
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(language === 'ko' ? '암호화 내보내기 완료' : language === 'ja' ? '暗号化エクスポート完了' : 'Encrypted export!');
        } catch (e) {
            toast.error('암호화 실패');
        }
        setPendingExportSession(null);
    };

    const handleStartEdit = (session: ChatSession) => {
        setEditingId(session.id);
        setEditTitle(session.title);
        setMenuOpenId(null);
    };

    const handleSaveEdit = (sessionId: string) => {
        if (editTitle.trim()) {
            setSessions(prev => {
                const updated = prev.map(s => 
                    s.id === sessionId ? { ...s, title: editTitle.trim() } : s
                );
                saveSessions(updated);
                return updated;
            });
        }
        setEditingId(null);
        setEditTitle('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return language === 'ko' ? '오늘' : language === 'ja' ? '今日' : 'Today';
        } else if (days === 1) {
            return language === 'ko' ? '어제' : language === 'ja' ? '昨日' : 'Yesterday';
        } else if (days < 7) {
            return language === 'ko' ? `${days}일 전` : language === 'ja' ? `${days}日前` : `${days} days ago`;
        } else {
            return date.toLocaleDateString(
                language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US',
                { month: 'short', day: 'numeric' }
            );
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setImportedFileContent(ev.target?.result as string);
            setImportModalOpen(true);
        };
        reader.readAsText(file);
    };

    const handleImportPasswordSubmit = (password: string) => {
        setImportModalOpen(false);
        if (!importedFileContent || !CryptoJS) {
            toast.error('파일 또는 암호화 라이브러리 오류');
            return;
        }
        try {
            const decrypted = CryptoJS.AES.decrypt(importedFileContent, password).toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error('복호화 실패');
            const rawSession = JSON.parse(decrypted);
            // 날짜 필드 복구
            const session: ChatSession = {
                ...rawSession,
                createdAt: new Date(rawSession.createdAt),
                updatedAt: new Date(rawSession.updatedAt),
                messages: rawSession.messages.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }))
            };
            setSessions(prev => [session, ...prev]);
            saveSessions([session, ...sessions]);
            toast.success(language === 'ko' ? '세션 불러오기 성공' : language === 'ja' ? 'セッションの読み込み成功' : 'Session imported!');
            setImportedFileContent(null);
        } catch (e) {
            toast.error(language === 'ko' ? '복호화 실패' : language === 'ja' ? '復号化失敗' : 'Decryption failed');
        }
    };

    if (isCollapsed) {
        return (
            <div className="chat-sessions collapsed">
                <button className="sessions-toggle" onClick={onToggleCollapse}>
                    <ChevronRight size={18} />
                </button>
                <button className="sessions-new-mini" onClick={handleNewSession}>
                    <Plus size={18} />
                </button>
                <div className="sessions-list-mini">
                    {sessions.slice(0, 5).map(session => (
                        <button
                            key={session.id}
                            className={`session-mini ${session.id === currentSessionId ? 'active' : ''}`}
                            onClick={() => handleLoadSession(session)}
                            title={session.title}
                        >
                            <MessageSquare size={16} />
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="chat-sessions">
            <div className="sessions-glass"></div>
            
            <div className="sessions-header">
                <h3>
                    <MessageSquare size={16} />
                    {language === 'ko' ? '대화 목록' : language === 'ja' ? '会話リスト' : 'Conversations'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Tooltip content={language === 'ko' ? '암호화 세션 불러오기' : language === 'ja' ? '暗号化セッション読込' : 'Import Encrypted'} position="bottom">
                        <button className="glass-action-btn import-btn" onClick={handleImportClick}>
                            <LockIcon size={18} />
                        </button>
                    </Tooltip>
                    <button className="sessions-toggle" onClick={onToggleCollapse}>
                        <ChevronLeft size={18} />
                    </button>
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".enc.txt"
                    onChange={handleFileChange}
                />
            </div>

            <button className="sessions-new" onClick={handleNewSession}>
                <Plus size={18} />
                <span>{language === 'ko' ? '새 대화' : language === 'ja' ? '新しい会話' : 'New Chat'}</span>
            </button>

            <div className="sessions-list">
                {sessions.length === 0 ? (
                    <div className="sessions-empty">
                        <MessageSquare size={24} />
                        <p>{language === 'ko' ? '대화 기록이 없습니다' : language === 'ja' ? '会話履歴がありません' : 'No conversations yet'}</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
                        >
                            {editingId === session.id ? (
                                <div className="session-edit">
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(session.id);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                        autoFocus
                                    />
                                    <button onClick={() => handleSaveEdit(session.id)}>
                                        <Check size={14} />
                                    </button>
                                    <button onClick={handleCancelEdit}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button
                                        className="session-content"
                                        onClick={() => handleLoadSession(session)}
                                    >
                                        <span className="session-title">{session.title}</span>
                                        <span className="session-meta">
                                            <Clock size={12} />
                                            {formatDate(session.updatedAt)}
                                            <span className="session-count">
                                                {session.messages.length}
                                                {language === 'ko' ? '개' : ''}
                                            </span>
                                        </span>
                                    </button>
                                    <div className="session-actions">
                                        <button
                                            className="session-menu-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                            }}
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                        {menuOpenId === session.id && (
                                            <div className="session-menu">
                                                <button onClick={() => handleStartEdit(session)}>
                                                    <Edit3 size={14} />
                                                    {language === 'ko' ? '이름 변경' : language === 'ja' ? '名前を変更' : 'Rename'}
                                                </button>
                                                <button onClick={() => handleExportSession(session)}>
                                                    <MessageSquare size={14} />
                                                    {language === 'ko' ? '내보내기' : language === 'ja' ? 'エクスポート' : 'Export'}
                                                </button>
                                                <button onClick={() => handleExportEncrypted(session)}>
                                                    <LockIcon size={14} />
                                                    {language === 'ko' ? '암호화 내보내기' : language === 'ja' ? '暗号化エクスポート' : 'Export Encrypted'}
                                                </button>
                                                <button 
                                                    className="danger"
                                                    onClick={() => handleDeleteSession(session.id)}
                                                >
                                                    <Trash2 size={14} />
                                                    {language === 'ko' ? '삭제' : language === 'ja' ? '削除' : 'Delete'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <PasswordModal
                open={passwordModalOpen}
                onClose={() => { setPasswordModalOpen(false); setPendingExportSession(null); }}
                onSubmit={handlePasswordSubmit}
                title={language === 'ko' ? '암호화 내보내기' : language === 'ja' ? '暗号化エクスポート' : 'Export Encrypted'}
                description={language === 'ko' ? '세션을 암호화하여 내보냅니다.' : language === 'ja' ? 'セッションを暗号化してエクスポートします。' : 'Export session with encryption.'}
            />
            <PasswordModal
                open={importModalOpen}
                onClose={() => { setImportModalOpen(false); setImportedFileContent(null); }}
                onSubmit={handleImportPasswordSubmit}
                title={language === 'ko' ? '암호 입력' : language === 'ja' ? 'パスワード入力' : 'Enter password'}
                description={language === 'ko' ? '암호화된 세션 파일의 암호를 입력하세요.' : language === 'ja' ? '暗号化セッションファイルのパスワードを入力してください。' : 'Enter password for encrypted session file.'}
            />
        </div>
    );
};

export default ChatSessions;
export { loadSessions, saveSessions, STORAGE_KEY, CURRENT_SESSION_KEY };
