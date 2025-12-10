import React from 'react';
import './Avatar.css';

interface AvatarProps {
    size?: number | string;
    alt?: string;
    className?: string;
    type?: 'luna' | 'user';
}

const Avatar: React.FC<AvatarProps> = ({ size = 48, alt = 'Avatar', className = '', type = 'luna' }) => {
    const dimension = typeof size === 'number' ? size : parseInt(size) || 48;

    const imageConfig = type === 'luna' 
        ? { src: '/Assets/Profile.png', top: '-30%', width: '120%' }
        : { src: '/Assets/Dael.png', top: '-20%', width: '130%' };

    return (
        <div 
            className={`luna-avatar ${className}`}
            style={{ 
                width: dimension, 
                height: dimension,
                position: 'relative',
            }}
        >
            <img 
                src={imageConfig.src}
                alt={alt} 
                style={{
                    position: 'absolute',
                    width: imageConfig.width,
                    height: 'auto',
                    left: '50%',
                    top: imageConfig.top,
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    );
};

export default Avatar;
