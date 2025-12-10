// ====================================================================
// L.U.N.A. Chat Message Item Component - Deep Sea Glassmorphism Theme
// i18n Support
// ====================================================================

import React, { useState } from 'react';
import { 
    User, 
    Settings, 
    Volume2, 
    Pause,
    Zap,
    Clock,
    Copy,
    Check,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import type { ChatMessage } from '../../types';
import { config } from '../../config';
import { useTranslation } from '../../hooks/useTranslation';
import { Tooltip, useToast } from '../../components/Common';
import Avatar from '../../components/Avatar/Avatar';
import './ChatMessageItem.css';

interface ChatMessageItemProps {
    message: ChatMessage;
    onPlayAudio?: (url: string, messageId: string) => void;
    onStopAudio?: () => void;
    isPlaying?: boolean;
    playingMessageId?: string | null;
    onRegenerate?: (messageId: string) => void;
    isLastAssistant?: boolean;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
    message,
    onPlayAudio,
    onStopAudio,
    isPlaying,
    playingMessageId,
    onRegenerate,
    isLastAssistant,
}) => {
    const { t, language } = useTranslation();
    const toast = useToast();
    const [copied, setCopied] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const emotionConfig = message.emotion
        ? config.emotions[message.emotion as keyof typeof config.emotions]
        : null;

    // Check if THIS message's audio is playing
    const isThisMessagePlaying = isPlaying && playingMessageId === message.id;

    const formatTime = (date: Date) => {
        const localeMap: Record<string, string> = {
            ko: 'ko-KR',
            en: 'en-US',
            ja: 'ja-JP',
        };
        return new Date(date).toLocaleTimeString(localeMap[language] || 'ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleAudioClick = () => {
        if (isThisMessagePlaying) {
            // Currently playing this message - stop it
            onStopAudio?.();
        } else {
            // Not playing - start playing
            if (message.audioUrl && onPlayAudio) {
                onPlayAudio(message.audioUrl, message.id);
            }
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            toast.success(
                language === 'ko' ? '복사 완료' : language === 'ja' ? 'コピー完了' : 'Copied',
                language === 'ko' ? '클립보드에 복사되었습니다' : language === 'ja' ? 'クリップボードにコピーしました' : 'Copied to clipboard'
            );
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
            toast.error(
                language === 'ko' ? '복사 실패' : language === 'ja' ? 'コピー失敗' : 'Copy failed'
            );
        }
    };

    const handleRegenerate = () => {
        if (onRegenerate) {
            onRegenerate(message.id);
        }
        setShowActions(false);
    };

    const getAvatarContent = () => {
        switch (message.role) {
            case 'user':
                return <Avatar size={40} className="circle" type="user" />;
            case 'assistant':
                return <Avatar size={40} className="circle" type="luna" />;
            default:
                return <Settings size={18} />;
        }
    };

    return (
        <div className={`message ${message.role}`}>
            <div className={`message-avatar ${message.role !== 'system' ? 'profile-avatar' : ''}`}>
                {getAvatarContent()}
            </div>

            <div className="message-content-wrapper">
                <div className="message-header">
                    <span className="message-author">
                        {message.role === 'user' 
                            ? t('chat.you') 
                            : message.role === 'assistant' 
                                ? 'L.U.N.A.' 
                                : t('chat.system')}
                    </span>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>

                <div className="message-bubble">
                    <div className="message-text">{message.content}</div>

                    {message.role === 'assistant' && (
                        <div className="message-meta">
                            {emotionConfig && (
                                <span
                                    className="meta-badge emotion"
                                    style={{ 
                                        borderColor: emotionConfig.color,
                                        color: emotionConfig.color
                                    }}
                                    title={`감정: ${emotionConfig.label}`}
                                >
                                    <span className="meta-label">{emotionConfig.label}</span>
                                </span>
                            )}

                            {message.intent && (
                                <span className="meta-badge intent" title={`의도: ${message.intent}`}>
                                    <span className="meta-label">{message.intent}</span>
                                </span>
                            )}

                            {message.cached && (
                                <span className="meta-badge cached" title={t('chat.cachedResponse')}>
                                    <Zap size={12} />
                                    <span>{t('chat.cached')}</span>
                                </span>
                            )}

                            {message.processingTime !== undefined && (
                                <span className="meta-badge time" title={t('chat.processingTime')}>
                                    <Clock size={12} />
                                    <span>{message.processingTime.toFixed(2)}s</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {message.audioUrl && (
                    <button
                        className={`audio-button ${isThisMessagePlaying ? 'playing' : ''}`}
                        onClick={handleAudioClick}
                        title={isThisMessagePlaying ? t('chat.stopAudio') : t('chat.playAudio')}
                    >
                        {isThisMessagePlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                        <span>{isThisMessagePlaying ? t('chat.stop') : t('chat.play')}</span>
                    </button>
                )}

                {/* Message Actions - Deep Sea Glass Buttons */}
                {message.role !== 'system' && (
                    <div className="message-actions">
                        <Tooltip 
                            content={copied 
                                ? (language === 'ko' ? '복사됨!' : language === 'ja' ? 'コピーしました!' : 'Copied!') 
                                : (language === 'ko' ? '복사' : language === 'ja' ? 'コピー' : 'Copy')
                            }
                            position="top"
                        >
                            <button
                                className={`glass-action-btn ${copied ? 'success' : ''}`}
                                onClick={handleCopy}
                            >
                                <span className="btn-glow"></span>
                                <span className="btn-inner">
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </span>
                            </button>
                        </Tooltip>

                        {message.role === 'assistant' && isLastAssistant && onRegenerate && (
                            <Tooltip 
                                content={language === 'ko' ? '다시 생성' : language === 'ja' ? '再生成' : 'Regenerate'}
                                position="top"
                            >
                                <button
                                    className="glass-action-btn regenerate"
                                    onClick={handleRegenerate}
                                >
                                    <span className="btn-glow"></span>
                                    <span className="btn-inner">
                                        <RefreshCw size={14} />
                                        <Sparkles size={9} className="sparkle-icon" />
                                    </span>
                                </button>
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessageItem;
