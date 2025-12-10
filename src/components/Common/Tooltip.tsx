import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Tooltip.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactElement<any>;
    position?: TooltipPosition;
    delay?: number;
    disabled?: boolean;
    className?: string;
    maxWidth?: number;
}

interface TooltipState {
    visible: boolean;
    coords: { x: number; y: number };
    actualPosition: TooltipPosition;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    delay = 200,
    disabled = false,
    className = '',
    maxWidth = 250,
}) => {
    const [state, setState] = useState<TooltipState>({
        visible: false,
        coords: { x: 0, y: 0 },
        actualPosition: position,
    });
    
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        const padding = 8;
        const arrowSize = 6;

        let x = 0;
        let y = 0;
        let finalPosition = position;

        // 기본 위치 계산
        const positions = {
            top: {
                x: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
                y: triggerRect.top + scrollY - tooltipRect.height - arrowSize,
            },
            bottom: {
                x: triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2,
                y: triggerRect.bottom + scrollY + arrowSize,
            },
            left: {
                x: triggerRect.left + scrollX - tooltipRect.width - arrowSize,
                y: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
            },
            right: {
                x: triggerRect.right + scrollX + arrowSize,
                y: triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2,
            },
        };

        // 화면 경계 체크 및 위치 조정
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const checkBounds = (pos: TooltipPosition): boolean => {
            const coords = positions[pos];
            const tooltipLeft = coords.x - scrollX;
            const tooltipTop = coords.y - scrollY;
            const tooltipRight = tooltipLeft + tooltipRect.width;
            const tooltipBottom = tooltipTop + tooltipRect.height;

            return (
                tooltipLeft >= padding &&
                tooltipTop >= padding &&
                tooltipRight <= viewportWidth - padding &&
                tooltipBottom <= viewportHeight - padding
            );
        };

        // 원하는 위치가 가능한지 확인, 아니면 대안 찾기
        const positionOrder: TooltipPosition[] = [position];
        if (position === 'top') positionOrder.push('bottom', 'left', 'right');
        else if (position === 'bottom') positionOrder.push('top', 'left', 'right');
        else if (position === 'left') positionOrder.push('right', 'top', 'bottom');
        else if (position === 'right') positionOrder.push('left', 'top', 'bottom');

        for (const pos of positionOrder) {
            if (checkBounds(pos)) {
                finalPosition = pos;
                break;
            }
        }

        x = positions[finalPosition].x;
        y = positions[finalPosition].y;

        // 화면 밖으로 나가지 않도록 최종 조정
        x = Math.max(padding, Math.min(x, viewportWidth + scrollX - tooltipRect.width - padding));
        y = Math.max(padding, Math.min(y, viewportHeight + scrollY - tooltipRect.height - padding));

        setState(prev => ({
            ...prev,
            coords: { x, y },
            actualPosition: finalPosition,
        }));
    }, [position]);

    const showTooltip = useCallback(() => {
        if (disabled || !content) return;
        
        timeoutRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, visible: true }));
        }, delay);
    }, [disabled, content, delay]);

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setState(prev => ({ ...prev, visible: false }));
    }, []);

    useEffect(() => {
        if (state.visible) {
            // 약간의 딜레이 후 위치 계산 (DOM이 렌더링된 후)
            requestAnimationFrame(calculatePosition);
        }
    }, [state.visible, calculatePosition]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // children에 ref와 이벤트 핸들러 추가
    const childProps = children.props as Record<string, any>;
    const childElement = React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e: React.MouseEvent) => {
            showTooltip();
            childProps.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
            hideTooltip();
            childProps.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
            showTooltip();
            childProps.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
            hideTooltip();
            childProps.onBlur?.(e);
        },
    });

    const tooltipElement = state.visible && content ? createPortal(
        <div
            ref={tooltipRef}
            className={`tooltip tooltip-${state.actualPosition} ${className}`}
            style={{
                left: state.coords.x,
                top: state.coords.y,
                maxWidth,
            }}
            role="tooltip"
        >
            <div className="tooltip-content">{content}</div>
            <div className="tooltip-arrow" />
        </div>,
        document.body
    ) : null;

    return (
        <>
            {childElement}
            {tooltipElement}
        </>
    );
};

// 간단한 래퍼 - 기존 title 속성을 대체하기 쉽게
interface TooltipWrapperProps {
    tip: string;
    children: React.ReactElement;
    position?: TooltipPosition;
}

export const Tip: React.FC<TooltipWrapperProps> = ({ tip, children, position = 'top' }) => {
    return (
        <Tooltip content={tip} position={position}>
            {children}
        </Tooltip>
    );
};

export default Tooltip;
