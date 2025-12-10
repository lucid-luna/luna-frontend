import React, { createContext, useContext, useRef, useState } from 'react';

interface MusicContextType {
    isMuted: boolean;
    fadeIn: () => void;
    fadeOut: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) throw new Error('useMusic must be used within a MusicProvider');
    return context;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isMuted, setIsMuted] = useState(true);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const fadeIn = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.volume = 0;
        audio.play();
        setIsMuted(false);
        let volume = 0;
        const targetVolume = 0.3;
        const fadeStep = targetVolume / 60;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
            volume += fadeStep;
            if (volume >= targetVolume) {
                audio.volume = targetVolume;
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            } else {
                audio.volume = volume;
            }
        }, 50);
    };

    const fadeOut = () => {
        const audio = audioRef.current;
        if (!audio) return;
        let volume = audio.volume;
        const fadeStep = volume / 40;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
            volume -= fadeStep;
            if (volume <= 0) {
                audio.volume = 0;
                audio.pause();
                setIsMuted(true);
                if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
            } else {
                audio.volume = volume;
            }
        }, 50);
    };

    return (
        <MusicContext.Provider value={{ isMuted, fadeIn, fadeOut, audioRef }}>
            {/* 오디오 플레이어를 Provider에서 렌더링 */}
            <audio ref={audioRef} loop>
                <source src="/Assets/Background_lofi.mp3" type="audio/mpeg" />
            </audio>
            {children}
        </MusicContext.Provider>
    );
};
