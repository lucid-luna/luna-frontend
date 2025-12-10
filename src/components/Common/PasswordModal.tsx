import React, { useState } from 'react';
import './PasswordModal.css';
import { createPortal } from 'react-dom';

interface PasswordModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (password: string) => void;
    title?: string;
    description?: string;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ open, onClose, onSubmit, title, description }) => {
    const [password, setPassword] = useState('');
    if (!open) return null;
    return createPortal(
        <div className="password-modal-overlay">
            <div className="password-modal">
                <h4>{title || '암호 입력'}</h4>
                {description && <p>{description}</p>}
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="암호를 입력하세요"
                    autoFocus
                />
                <div className="modal-actions">
                    <button onClick={onClose}>취소</button>
                    <button onClick={() => { onSubmit(password); setPassword(''); }}>확인</button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PasswordModal;
