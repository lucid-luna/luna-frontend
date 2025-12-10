// ====================================================================
// L.U.N.A. TTS Service - Text-to-Speech
// ====================================================================

import { apiClient } from './apiClient';
import { config } from '../config';
import type { TTSRequest, TTSResponse, CacheStats } from '../types';

class TTSService {
    // Synthesize text to speech
    async synthesize(
        text: string,
        style?: string,
        styleWeight?: number
    ): Promise<TTSResponse> {
        const request: TTSRequest = {
            text,
            style,
            style_weight: styleWeight,
        };
        return apiClient.post<TTSResponse>(config.endpoints.synthesize, request);
    }

    // Synthesize with parallel processing (for longer texts)
    async synthesizeParallel(
        text: string,
        style?: string,
        styleWeight?: number
    ): Promise<TTSResponse> {
        const request: TTSRequest = {
            text,
            style,
            style_weight: styleWeight,
        };
        return apiClient.post<TTSResponse>(config.endpoints.synthesizeParallel, request);
    }

    // Get audio URL for playback
    getAudioUrl(relativePath: string): string {
        return `${apiClient.getBaseUrl()}${relativePath}`;
    }

    // Play audio from response
    async playAudio(audioUrl: string, volume: number = 1.0): Promise<HTMLAudioElement> {
        const fullUrl = audioUrl.startsWith('http') 
            ? audioUrl 
            : this.getAudioUrl(audioUrl);
        
        const audio = new Audio(fullUrl);
        audio.volume = volume;
        
        return new Promise((resolve, reject) => {
            audio.oncanplaythrough = () => {
                audio.play()
                    .then(() => resolve(audio))
                    .catch(reject);
            };
            audio.onerror = () => reject(new Error('Failed to load audio'));
        });
    }

    // TTS Cache management
    async getCacheStats(): Promise<CacheStats> {
        return apiClient.get<CacheStats>(config.endpoints.ttsCacheStats);
    }

    async cleanupCache(): Promise<{ status: string; removed: number; message: string }> {
        return apiClient.post(config.endpoints.ttsCacheCleanup);
    }

    async clearCache(): Promise<{ status: string; message: string }> {
        return apiClient.delete(config.endpoints.ttsCacheClear);
    }
}

export const ttsService = new TTSService();
export default ttsService;
