// ====================================================================
// L.U.N.A. Chat Service - Interaction with LLM
// ====================================================================

import { apiClient } from './apiClient';
import { config } from '../config';
import type { InteractResponse, WSMessage } from '../types';

export interface InteractRequest {
    input: string;
    use_tools?: boolean;
}

export interface SSEEvent {
    type: 'status' | 'text' | 'audio' | 'result' | 'error';
    data: {
        message?: string;
        audio_url?: string;
    } | InteractResponse;
}

class ChatService {
    // Basic interaction (non-streaming)
    async interact(input: string, useTools: boolean = false): Promise<InteractResponse> {
        return apiClient.post<InteractResponse>(config.endpoints.interact, {
            input,
            use_tools: useTools,
        });
    }

    // SSE interaction with real-time status updates
    async interactSSE(
        input: string,
        useTools: boolean = false,
        onStatus?: (message: string) => void,
        onText?: (response: InteractResponse) => void,
        onAudio?: (audioUrl: string) => void
    ): Promise<InteractResponse> {
        const baseUrl = config.api.baseUrl;
        const url = `${baseUrl}${config.endpoints.interactSSE}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input,
                use_tools: useTools,
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }
        
        const decoder = new TextDecoder();
        let result: InteractResponse | null = null;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            const lines = text.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    
                    if (data === '[DONE]') {
                        break;
                    }
                    
                    try {
                        const event: SSEEvent = JSON.parse(data);
                        
                        if (event.type === 'status' && onStatus) {
                            const statusData = event.data as { message: string };
                            onStatus(statusData.message);
                        } else if (event.type === 'text') {
                            // 텍스트 먼저 받음 - 바로 표시
                            result = event.data as InteractResponse;
                            if (onText) {
                                onText(result);
                            }
                            if (onStatus) {
                                onStatus('');  // 상태 메시지 클리어
                            }
                        } else if (event.type === 'audio') {
                            // 오디오 URL 수신 - 재생
                            const audioData = event.data as { audio_url: string };
                            if (result) {
                                result.audio_url = audioData.audio_url;
                            }
                            if (onAudio) {
                                onAudio(audioData.audio_url);
                            }
                        } else if (event.type === 'result') {
                            result = event.data as InteractResponse;
                        } else if (event.type === 'error') {
                            const errorData = event.data as { message: string };
                            throw new Error(errorData.message);
                        }
                    } catch (e) {
                        if (e instanceof SyntaxError) {
                            console.warn('Failed to parse SSE data:', data);
                        } else {
                            throw e;
                        }
                    }
                }
            }
        }
        
        if (!result) {
            throw new Error('No result received from SSE');
        }
        
        return result;
    }

  // Streaming interaction
    async *interactStream(input: string): AsyncGenerator<WSMessage> {
        for await (const chunk of apiClient.stream(config.endpoints.interactStream, {
            input,
        })) {
            yield chunk as WSMessage;
        }
    }

    // Generate text with LLM
    async generate(
        input: string,
        temperature: number = 0.85,
        maxTokens: number = 64
    ): Promise<{ content: string }> {
        return apiClient.post(config.endpoints.generate, {
            input,
            temperature,
            max_tokens: maxTokens,
        });
    }

    // Create WebSocket connection for ASR
    createASRWebSocket(
        onMessage: (data: InteractResponse) => void,
        onError?: (error: Event) => void,
        onClose?: () => void
    ): WebSocket {
        const wsUrl = `${apiClient.getWsUrl()}${config.endpoints.wsAsr}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            onError?.(error);
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
            onClose?.();
        };

        return ws;
    }

    // Send audio data through WebSocket
    sendAudioData(ws: WebSocket, audioData: ArrayBuffer): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(audioData);
        }
    }
}

export const chatService = new ChatService();
export default chatService;
