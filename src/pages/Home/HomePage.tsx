/**
 * L.U.N.A. Home Page
 * Underwater-themed landing page with stunning visual effects
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fadeInVariants } from '../../utils/motion';
import { useNavigate } from 'react-router-dom';
import { Moon, ChevronRight, Waves, Sparkles, Compass, Activity, Volume2, VolumeX } from 'lucide-react';
import './HomePage.css';
import { useMusic } from '../../context/MusicContext';

const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [currentTime, setCurrentTime] = useState(new Date());
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const { isMuted, fadeIn, fadeOut } = useMusic();
    
    // 환경 수치 상태
    const [envStats, setEnvStats] = useState({
        temp: 4.2,
        pressure: 284,
        oxygen: 98.7
    });

    useEffect(() => {
        const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
        const envInterval = setInterval(() => {
            setEnvStats(prev => {
                let newTemp = prev.temp + (Math.random() - 0.5) * 0.3;
                newTemp = Math.max(3.8, Math.min(4.6, newTemp));
                let newPressure = prev.pressure + (Math.random() - 0.5) * 2;
                newPressure = Math.max(280, Math.min(288, newPressure));
                let newOxygen = prev.oxygen + (Math.random() - 0.5) * 0.4;
                newOxygen = Math.max(97.5, Math.min(99.5, newOxygen));
                return {
                    temp: Math.round(newTemp * 10) / 10,
                    pressure: Math.round(newPressure),
                    oxygen: Math.round(newOxygen * 10) / 10
                };
            });
        }, 2500 + Math.random() * 1500);
        return () => {
            clearInterval(timeInterval);
            clearInterval(envInterval);
        };
    }, []);

    const toggleMute = () => {
        if (isMuted) {
            fadeIn();
        } else {
            fadeOut();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        setMousePos({ x, y });
    };

    const handleEnter = () => {
        if (isMuted) fadeIn();
        navigate('/dashboard');
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ko-KR', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            weekday: 'short'
        });
    };

    return (
        <motion.div
            className="home-page"
            onMouseMove={handleMouseMove}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            {/* ...기존 HomePage 내용 그대로... */}
            {/* 백그라운드 비디오 */}
            <div className="video-container">
                <video
                    ref={videoRef}
                    className="home-video"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                >
                    <source src="/Assets/HomeScreen.mp4" type="video/mp4" />
                </video>
            </div>
            {/* 오버레이 레이어 */}
            <div className="overlay-layer overlay-gradient" />
            <div className="overlay-layer overlay-vignette" />
            <div className="overlay-layer overlay-scanlines" />
            {/* 플로팅 이펙트 */}
            <div 
                className="particles"
                style={{
                    transform: `translate(${(mousePos.x - 0.5) * 1.5}px, ${(mousePos.y - 0.5) * 1.5}px)`
                }}
            >
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className={`particle ${i % 3 === 0 ? 'glow' : ''}`}
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 10}s`,
                            animationDuration: `${8 + Math.random() * 8}s`,
                            width: `${2 + Math.random() * 6}px`,
                            height: `${2 + Math.random() * 6}px`,
                        }}
                    />
                ))}
            </div>
            {/* 해면 빛 이펙트 */}
            <div className="light-rays">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="light-ray"
                        style={{
                            left: `${10 + i * 16}%`,
                            animationDelay: `${i * 0.8}s`,
                            opacity: 0.15 + Math.random() * 0.15,
                        }}
                    />
                ))}
            </div>
            {/* 버블 이펙트 */}
            <div className="bubbles">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div
                        key={i}
                        className="bubble"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 10}s`,
                            animationDuration: `${10 + Math.random() * 10}s`,
                            width: `${4 + Math.random() * 12}px`,
                            height: `${4 + Math.random() * 12}px`,
                        }}
                    />
                ))}
            </div>
            {/* 상단 시간 및 상태바 */}
            <div className="top-bar">
                <div className="top-bar-left">
                    <span className="status-dot pulse" />
                    <span className="status-text">SYSTEM ACTIVE</span>
                </div>
                <div className="top-bar-center">
                    <span className="clock">{formatTime(currentTime)}</span>
                </div>
                <div className="top-bar-right">
                    <button className="sound-toggle" onClick={toggleMute}>
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                </div>
            </div>
            {/* 메인 콘텐츠 */}
            <div className="home-content">
                {/* 장식용 오비탈 링 */}
                <div className="orbital-container">
                    <div className="orbital ring-1" />
                    <div className="orbital ring-2" />
                    <div className="orbital ring-3" />
                </div>
                {/* 로고 */}
                <div className="home-logo">
                    <div className="logo-glow" />
                    <div className="logo-core">
                        <Moon className="logo-icon" size={56} />
                    </div>
                    <div className="logo-pulse" />
                </div>
                <div className="title-container">
                    <h1 className="home-title">
                        <span className="title-char" style={{ animationDelay: '0.1s' }}>L</span>
                        <span className="title-dot">.</span>
                        <span className="title-char" style={{ animationDelay: '0.2s' }}>U</span>
                        <span className="title-dot">.</span>
                        <span className="title-char" style={{ animationDelay: '0.3s' }}>N</span>
                        <span className="title-dot">.</span>
                        <span className="title-char" style={{ animationDelay: '0.4s' }}>A</span>
                        <span className="title-dot">.</span>
                    </h1>
                    <div className="title-underline" />
                </div>
                <p className="home-subtitle">
                    Living Universal Neural Assistant
                </p>
                {/* 기능 그리드 */}
                <div className="features-grid">
                    <div className="feature-item">
                        <Sparkles className="feature-icon" size={18} />
                        <span>AI Companion</span>
                    </div>
                    <div className="feature-divider" />
                    <div className="feature-item">
                        <Activity className="feature-icon" size={18} />
                        <span>Memory System</span>
                    </div>
                    <div className="feature-divider" />
                    <div className="feature-item">
                        <Compass className="feature-icon" size={18} />
                        <span>MCP Tools</span>
                    </div>
                </div>
                {/* 설명 */}
                <p className="home-description">
                    {/* 깊은 바다의 고요함 속에서<br />
                    당신만의 이야기를 들려주세요 */}
                </p>
                {/* 시작하기 버튼 */}
                <button className="home-enter-btn" onClick={handleEnter}>
                    <span className="btn-glow" />
                    <span className="btn-border" />
                    <span className="btn-content">
                        <span className="btn-text">시작하기</span>
                        <ChevronRight className="btn-icon" size={20} />
                    </span>
                </button>
                {/* 날짜 표시 */}
                <div className="date-display">
                    {formatDate(currentTime)}
                </div>
            </div>
            {/* 사이드 패널 */}
            <div className="side-panel left">
                <div className="depth-indicator">
                    <Waves className="depth-icon" size={14} />
                    <div className="depth-bar">
                        <div className="depth-fill" />
                    </div>
                    <span className="depth-value">-2,847m</span>
                </div>
            </div>
            <div className="side-panel right">
                <div className="stats-panel">
                    <div className="stat-item">
                        <span className="stat-label">TEMP</span>
                        <span className="stat-value">{envStats.temp.toFixed(1)}°C</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">PRESS</span>
                        <span className="stat-value">{envStats.pressure} atm</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">O₂</span>
                        <span className="stat-value">{envStats.oxygen.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
            {/* 하단 웨이브 이펙트 */}
            <div className="bottom-decoration">
                <svg className="wave-svg" viewBox="0 0 1440 200" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(100, 200, 255, 0.1)" />
                            <stop offset="100%" stopColor="rgba(0, 20, 40, 0.8)" />
                        </linearGradient>
                    </defs>
                    <path
                        className="wave wave-1"
                        d="M0,100 C320,150 420,50 640,100 C860,150 960,50 1180,100 C1300,130 1380,80 1440,100 L1440,200 L0,200 Z"
                        fill="url(#waveGradient)"
                    />
                    <path
                        className="wave wave-2"
                        d="M0,120 C240,80 360,160 600,120 C840,80 960,160 1200,120 C1320,100 1400,140 1440,120 L1440,200 L0,200 Z"
                        fill="rgba(0, 30, 50, 0.5)"
                    />
                </svg>
            </div>
        </motion.div>
    );
};

export default HomePage;
