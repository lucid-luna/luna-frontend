// ====================================================================
// L.U.N.A. Chat Input Component - Deep Sea Glassmorphism Theme
// ====================================================================

import React, { useRef, useEffect } from 'react';
import { 
    Send, 
    Radio, 
    Wrench, 
    Trash2,
    Loader2
} from 'lucide-react';
import { Tooltip } from '../../components/Common';
import './ChatInput.css';

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    onStreamSend?: () => void;
    disabled?: boolean;
    isLoading?: boolean;
    useTools?: boolean;
    onToggleTools?: () => void;
    onClearChat?: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    value,
    onChange,
    onSend,
    onStreamSend,
    disabled,
    isLoading,
    useTools,
    onToggleTools,
    onClearChat,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [value]);

    // Handle key press
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (e.ctrlKey && onStreamSend) {
                onStreamSend();
            } else {
                onSend();
            }
        }
    };

    return (
        <div className="chat-input-container">
            <div className="input-glass" />

            <div className="input-content">
                {/* Toolbar */}
                <div className="input-toolbar">
                    <Tooltip 
                        content={useTools ? 'MCP 도구 비활성화' : 'MCP 도구 활성화'}
                        position="top"
                    >
                        <button
                            className={`toolbar-btn ${useTools ? 'active' : ''}`}
                            onClick={onToggleTools}
                        >
                            <Wrench size={14} />
                            <span>{useTools ? '도구 ON' : '도구 OFF'}</span>
                        </button>
                    </Tooltip>

                    <div className="toolbar-spacer" />

                    <Tooltip content="대화 초기화" position="top">
                        <button
                            className="toolbar-btn danger"
                            onClick={onClearChat}
                        >
                            <Trash2 size={14} />
                            <span>초기화</span>
                        </button>
                    </Tooltip>
                </div>

                {/* Input Area */}
                <div className="input-wrapper">
                    <textarea
                        ref={textareaRef}
                        className="chat-textarea"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={disabled ? '서버에 연결되지 않았습니다...' : '메시지를 입력하세요...'}
                        disabled={disabled}
                        rows={1}
                    />

                    <div className="input-actions">
                        <Tooltip 
                            content={<span className="tooltip-shortcut">스트리밍 전송<span className="shortcut-keys"><kbd>Ctrl</kbd><kbd>↵</kbd></span></span>}
                            position="top"
                        >
                            <button
                                className="send-btn stream"
                                onClick={onStreamSend}
                                disabled={disabled || !value.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <Radio size={18} />
                                )}
                            </button>
                        </Tooltip>

                        <Tooltip 
                            content={<span className="tooltip-shortcut">전송<span className="shortcut-keys"><kbd>↵</kbd></span></span>}
                            position="top"
                        >
                            <button
                                className="send-btn primary"
                                onClick={onSend}
                                disabled={disabled || !value.trim() || isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="spin" />
                                ) : (
                                    <Send size={18} />
                                )}
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatInput;
