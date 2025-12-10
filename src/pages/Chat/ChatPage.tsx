// ====================================================================
// L.U.N.A. Chat Page - Main Chat Interface
// Deep Sea Glassmorphism Theme with i18n Support
// ====================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Moon, 
    Waves, 
    Wifi, 
    WifiOff, 
    MessageCircle, 
    Volume2,
    Keyboard,
    CornerDownLeft,
    Command
} from 'lucide-react';
import { useApp } from '../../context';
import { chatService, ttsService } from '../../services';
import { config } from '../../config';
import { useTranslation } from '../../hooks/useTranslation';
import { useToast } from '../../components/Common';
import type { ChatMessage, InteractResponse } from '../../types';
import ChatMessageItem from './ChatMessageItem';
import ChatInput from './ChatInput';
import ChatSessions, { ChatSession } from './ChatSessions';
import './ChatPage.css';

const ChatPage: React.FC = () => {
    const { state, dispatch } = useApp();
    const { t } = useTranslation();
    const toast = useToast();
    const [inputValue, setInputValue] = useState('');
    const [useTools, setUseTools] = useState(true);  // MCP 도구 기본 활성화
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [sessionsCollapsed, setSessionsCollapsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Auto scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [state.messages, scrollToBottom]);

    // Generate unique ID
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Handle send message
    const handleSend = async () => {
        if (!inputValue.trim() || state.isLoading) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_LOADING', payload: true });
        setInputValue('');
        setStatusMessage(null);

        let textReceived = false;

        // assistant 메시지 audioUrl을 업데이트하는 id를 미리 생성
        const assistantMessageId = generateId();
        let assistantMessage: ChatMessage | null = null;

        try {
            // SSE interaction with real-time status updates
            const response: InteractResponse = await chatService.interactSSE(
                inputValue.trim(), 
                useTools,
                // onStatus - 상태 메시지
                (status) => {
                    if (status) {
                        setStatusMessage(status);
                    } else {
                        setStatusMessage(null);
                    }
                },
                // onText - 텍스트 먼저 받으면 바로 표시
                (textResponse) => {
                    textReceived = true;
                    setStatusMessage(null);
                    dispatch({ type: 'SET_LOADING', payload: false });
                    assistantMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: textResponse.text,
                        timestamp: new Date(),
                        emotion: textResponse.emotion,
                        intent: textResponse.intent,
                        audioUrl: '',
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
                },
                // onAudio - 오디오 URL만 저장
                (audioUrl) => {
                    if (audioUrl && assistantMessage) {
                        assistantMessage.audioUrl = audioUrl;
                        dispatch({
                            type: 'UPDATE_MESSAGE',
                            payload: {
                                id: assistantMessageId,
                                updates: { audioUrl },
                            },
                        });
                    }
                }
            );

            setStatusMessage(null);

            // onText에서 이미 처리 안 된 경우 (fallback)
            if (!textReceived && response.text) {
                assistantMessage = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: response.text,
                    timestamp: new Date(),
                    emotion: response.emotion,
                    intent: response.intent,
                    audioUrl: response.audio_url,
                    cached: response.cached,
                    processingTime: response.processing_time,
                };
                dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
            }
        } catch (error) {
            console.error('Chat error:', error);
            setStatusMessage(null);
            toast.error(t('chat.error'), t('chat.errorMessage'));
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : '채팅 중 오류가 발생했습니다.',
            });

            const errorMessage: ChatMessage = {
                id: generateId(),
                role: 'system',
                content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
                timestamp: new Date(),
            };
            dispatch({ type: 'ADD_MESSAGE', payload: errorMessage });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            setStatusMessage(null);
        }
    };

    // Handle streaming send
    const handleStreamSend = async () => {
        if (!inputValue.trim() || state.isLoading) return;

        const userMessage: ChatMessage = {
            id: generateId(),
            role: 'user',
            content: inputValue.trim(),
            timestamp: new Date(),
        };

        dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_STREAMING', payload: true });
        dispatch({ type: 'CLEAR_STREAM_CONTENT' });
        setInputValue('');

        const assistantMessageId = generateId();
        const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });

        try {
            for await (const chunk of chatService.interactStream(inputValue.trim())) {
                switch (chunk.type) {
                    case 'emotion':
                        dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: { id: assistantMessageId, updates: { emotion: chunk.data as string } },
                        });
                        break;
                    case 'llm_chunk':
                        dispatch({ type: 'UPDATE_STREAM_CONTENT', payload: chunk.data as string });
                        dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: {
                            id: assistantMessageId,
                            updates: { content: state.currentStreamContent + (chunk.data as string) },
                        },
                        });
                        break;
                    case 'complete':
                        dispatch({
                        type: 'UPDATE_MESSAGE',
                        payload: { id: assistantMessageId, updates: { content: chunk.data as string } },
                        });
                        break;
                    case 'error':
                        throw new Error(chunk.data as string);
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            dispatch({
                type: 'UPDATE_MESSAGE',
                payload: {
                id: assistantMessageId,
                updates: { content: '스트리밍 중 오류가 발생했습니다.' },
                },
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            dispatch({ type: 'SET_STREAMING', payload: false });
            dispatch({ type: 'CLEAR_STREAM_CONTENT' });
        }
    };

    // Play audio
    const playAudio = async (audioUrl: string, messageId?: string) => {
        try {
            // Stop any currently playing audio first
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            
            dispatch({ type: 'SET_PLAYING', payload: true });
            setPlayingMessageId(messageId || null);
            const audio = await ttsService.playAudio(audioUrl, state.volume);
            audioRef.current = audio;
            
            audio.onended = () => {
                dispatch({ type: 'SET_PLAYING', payload: false });
                setPlayingMessageId(null);
                audioRef.current = null;
            };
        } catch (error) {
            console.error('Audio playback error:', error);
            dispatch({ type: 'SET_PLAYING', payload: false });
            setPlayingMessageId(null);
        }
    };

    // Stop audio
    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        dispatch({ type: 'SET_PLAYING', payload: false });
        setPlayingMessageId(null);
    };

    // Clear chat (new session)
    const handleClearChat = () => {
        dispatch({ type: 'CLEAR_MESSAGES' });
        stopAudio();
    };

    // Handle new session
    const handleNewSession = () => {
        dispatch({ type: 'CLEAR_MESSAGES' });
        stopAudio();
    };

    // Handle load session
    const handleLoadSession = (session: ChatSession) => {
        dispatch({ type: 'SET_MESSAGES', payload: session.messages });
        stopAudio();
    };

    // Handle save session (auto-save handled by ChatSessions)
    const handleSaveSession = (messages: ChatMessage[]) => {
        // Auto-save is handled by ChatSessions component
    };

    // Handle regenerate - 마지막 assistant 응답 재생성
    const handleRegenerate = async (messageId: string) => {
        // 마지막 user 메시지 찾기
        const messages = state.messages;
        const lastUserMessageIndex = messages.map((m, i) => ({ m, i }))
            .reverse()
            .find(({ m }) => m.role === 'user')?.i;
        
        if (lastUserMessageIndex === undefined) return;
        
        const lastUserMessage = messages[lastUserMessageIndex];
        
        // assistant 응답 제거 (마지막 user 메시지 이후의 모든 메시지)
        const newMessages = messages.slice(0, lastUserMessageIndex + 1);
        dispatch({ type: 'SET_MESSAGES', payload: newMessages });
        dispatch({ type: 'SET_LOADING', payload: true });
        stopAudio();

        let textReceived = false;

        // assistant 메시지 audioUrl을 업데이트하는 id를 미리 생성
        const assistantMessageId = generateId();
        let assistantMessage: ChatMessage | null = null;

        try {
            const response: InteractResponse = await chatService.interactSSE(
                lastUserMessage.content, 
                useTools,
                (status) => {
                    if (status) {
                        setStatusMessage(status);
                    } else {
                        setStatusMessage(null);
                    }
                },
                (textResponse) => {
                    textReceived = true;
                    setStatusMessage(null);
                    dispatch({ type: 'SET_LOADING', payload: false });
                    assistantMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: textResponse.text,
                        timestamp: new Date(),
                        emotion: textResponse.emotion,
                        intent: textResponse.intent,
                        audioUrl: '',
                    };
                    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
                },
                (audioUrl) => {
                    if (audioUrl && assistantMessage) {
                        assistantMessage.audioUrl = audioUrl;
                        dispatch({
                            type: 'UPDATE_MESSAGE',
                            payload: {
                                id: assistantMessageId,
                                updates: { audioUrl },
                            },
                        });
                    }
                }
            );

            setStatusMessage(null);

            if (!textReceived && response.text) {
                assistantMessage = {
                    id: assistantMessageId,
                    role: 'assistant',
                    content: response.text,
                    timestamp: new Date(),
                    emotion: response.emotion,
                    intent: response.intent,
                    audioUrl: response.audio_url,
                    cached: response.cached,
                    processingTime: response.processing_time,
                };
                dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
            }
        } catch (error) {
            console.error('Regenerate error:', error);
            setStatusMessage(null);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : '재생성 중 오류가 발생했습니다.',
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            setStatusMessage(null);
        }
    };

    // 마지막 assistant 메시지 ID 찾기
    const lastAssistantMessageId = state.messages
        .filter(m => m.role === 'assistant')
        .pop()?.id;

    return (
        <div className="chat-page">
            {/* Deep Sea Ambient Background */}
            <div className="chat-ambient">
                {/* Floating Bubbles */}
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                <div className="chat-bubble"></div>
                {/* Glow Orbs */}
                <div className="ambient-orb orb-1"></div>
                <div className="ambient-orb orb-2"></div>
                <div className="ambient-orb orb-3"></div>
            </div>

            {/* Sessions Sidebar */}
            <ChatSessions
                currentMessages={state.messages}
                onNewSession={handleNewSession}
                onLoadSession={handleLoadSession}
                onSaveSession={handleSaveSession}
                isCollapsed={sessionsCollapsed}
                onToggleCollapse={() => setSessionsCollapsed(!sessionsCollapsed)}
            />

            <div className="chat-container">
                {/* Glass Layer */}
                <div className="chat-glass"></div>
                
                {/* Messages Area */}
                <div className="chat-messages">
                    {state.messages.length === 0 ? (
                        <div className="chat-empty">
                            <div className="empty-icon-wrapper">
                                <Moon size={48} className="empty-icon" />
                                <Waves size={32} className="empty-wave" />
                            </div>
                            <h2>{t('chat.emptyTitle')}</h2>
                            <p>{t('chat.emptySubtitle')}</p>
                            <div className="empty-particles">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {state.messages.map((message) => (
                                <ChatMessageItem
                                    key={message.id}
                                    message={message}
                                    onPlayAudio={playAudio}
                                    onStopAudio={stopAudio}
                                    isPlaying={state.isPlaying}
                                    playingMessageId={playingMessageId}
                                    onRegenerate={handleRegenerate}
                                    isLastAssistant={message.id === lastAssistantMessageId}
                                />
                            ))}
                            {state.isLoading && !state.isStreaming && (
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    {statusMessage && (
                                        <div className="status-message">{statusMessage}</div>
                                    )}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSend}
                    onStreamSend={handleStreamSend}
                    disabled={state.isLoading || !state.isConnected}
                    isLoading={state.isLoading}
                    useTools={useTools}
                    onToggleTools={() => setUseTools(!useTools)}
                    onClearChat={handleClearChat}
                />
            </div>

            {/* Sidebar Info */}
            <div className="chat-info-panel">
                <div className="info-panel-glass"></div>
                
                <div className="info-section">
                    <h3>{t('chat.currentStatus')}</h3>
                    <div className="info-item">
                        <span className="info-label">
                            {state.isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
                            {t('chat.connection')}
                        </span>
                        <span className={`info-value ${state.isConnected ? 'connected' : 'disconnected'}`}>
                            {state.isConnected ? t('chat.connected') : t('chat.disconnected')}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">
                            <MessageCircle size={14} />
                            {t('chat.messages')}
                        </span>
                        <span className="info-value">{state.messages.length}{t('chat.count')}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">
                            <Volume2 size={14} />
                            {t('chat.volume')}
                        </span>
                        <span className="info-value">{Math.round(state.volume * 100)}%</span>
                    </div>
                </div>

                {state.messages.length > 0 && (
                    <div className="info-section">
                        <h3>{t('chat.recentEmotion')}</h3>
                        <div className="emotion-list">
                            {state.messages
                                .filter((m) => m.role === 'assistant' && m.emotion)
                                .slice(-3)
                                .reverse()
                                .map((m) => {
                                    const emotionConfig = config.emotions[m.emotion as keyof typeof config.emotions];
                                    return (
                                        <div key={m.id} className="emotion-badge" style={{ borderColor: emotionConfig?.color }}>
                                            <span className="emotion-icon">{emotionConfig?.icon || '○'}</span>
                                            <span>{emotionConfig?.label || m.emotion}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <div className="info-section">
                    <h3>
                        <Keyboard size={14} />
                        {t('chat.shortcuts')}
                    </h3>
                    <div className="shortcut-item">
                        <kbd><CornerDownLeft size={12} /></kbd>
                        <span>{t('chat.send')}</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd>Shift</kbd>
                        <span>+</span>
                        <kbd><CornerDownLeft size={12} /></kbd>
                        <span>{t('chat.newline')}</span>
                    </div>
                    <div className="shortcut-item">
                        <kbd><Command size={12} /></kbd>
                        <span>+</span>
                        <kbd><CornerDownLeft size={12} /></kbd>
                        <span>{t('chat.streaming')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
