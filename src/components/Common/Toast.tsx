/**
 * L.U.N.A. Toast Notification System
 * Beautiful toast notifications with glassmorphism
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import './Toast.css';

// Types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    dismissible?: boolean;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    updateToast: (id: string, updates: Partial<Toast>) => void;
    // Convenience methods
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
    loading: (title: string, message?: string) => string;
    promise: <T>(
        promise: Promise<T>,
        messages: { loading: string; success: string; error: string }
    ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Generate unique ID
const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Icons for each toast type
const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
    loading: <Loader2 size={20} className="spin" />,
};

// Default durations
const defaultDurations: Record<ToastType, number> = {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 3000,
    loading: Infinity,
};

// Toast Item Component
const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.duration && toast.duration !== Infinity) {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onRemove(toast.id), 300);
            }, toast.duration);
            return () => clearTimeout(timer);
        }
    }, [toast.id, toast.duration, onRemove]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    return (
        <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}>
            <div className="toast-icon">{toastIcons[toast.type]}</div>
            <div className="toast-content">
                <div className="toast-title">{toast.title}</div>
                {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            {toast.dismissible !== false && toast.type !== 'loading' && (
                <button className="toast-close" onClick={handleClose}>
                    <X size={16} />
                </button>
            )}
            {toast.duration && toast.duration !== Infinity && (
                <div 
                    className="toast-progress" 
                    style={{ animationDuration: `${toast.duration}ms` }} 
                />
            )}
        </div>
    );
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({
    toasts,
    onRemove,
}) => {
    if (toasts.length === 0) return null;

    return createPortal(
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>,
        document.body
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = generateId();
        const newToast: Toast = {
            id,
            duration: defaultDurations[toast.type],
            dismissible: true,
            ...toast,
        };
        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updates } : t))
        );
    }, []);

    // Convenience methods
    const success = useCallback((title: string, message?: string) => {
        return addToast({ type: 'success', title, message });
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        return addToast({ type: 'error', title, message });
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        return addToast({ type: 'warning', title, message });
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        return addToast({ type: 'info', title, message });
    }, [addToast]);

    const loading = useCallback((title: string, message?: string) => {
        return addToast({ type: 'loading', title, message, dismissible: false });
    }, [addToast]);

    const promise = useCallback(async <T,>(
        promiseToResolve: Promise<T>,
        messages: { loading: string; success: string; error: string }
    ): Promise<T> => {
        const id = loading(messages.loading);
        try {
            const result = await promiseToResolve;
            updateToast(id, {
                type: 'success',
                title: messages.success,
                duration: defaultDurations.success,
                dismissible: true,
            });
            return result;
        } catch (err) {
            updateToast(id, {
                type: 'error',
                title: messages.error,
                message: err instanceof Error ? err.message : undefined,
                duration: defaultDurations.error,
                dismissible: true,
            });
            throw err;
        }
    }, [loading, updateToast]);

    const value: ToastContextType = {
        toasts,
        addToast,
        removeToast,
        updateToast,
        success,
        error,
        warning,
        info,
        loading,
        promise,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
