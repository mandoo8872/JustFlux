/**
 * EllipseArcHandles - Figma UI3 스타일 원 편집 핸들
 *
 * 3가지 핸들:
 * - Sweep Handle (주황): 호의 범위 조절 (0-360)
 * - Start Handle (초록): 호의 시작점 조절
 * - Ratio Handle (보라): 내부 반지름 (도넛 형태)
 */

import React, { useCallback, useRef, useState } from 'react';

interface EllipseArcHandlesProps {
    cx: number;          // center x (scaled)
    cy: number;          // center y (scaled)
    rx: number;          // radius x (scaled)
    ry: number;          // radius y (scaled)
    startAngle: number;  // degrees
    sweepAngle: number;  // degrees
    innerRadiusRatio: number; // 0-1
    scale: number;
    onUpdate: (updates: {
        startAngle?: number;
        sweepAngle?: number;
        innerRadiusRatio?: number;
    }) => void;
}

// Degrees → Radians (0° = right, clockwise)
function degToRad(deg: number): number {
    return (deg - 90) * (Math.PI / 180);
}

// Get point on ellipse at given angle
function pointOnEllipse(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
    const rad = degToRad(angleDeg);
    return {
        x: cx + rx * Math.cos(rad),
        y: cy + ry * Math.sin(rad),
    };
}

// Calculate angle from center to point (in degrees, 0 = top, clockwise)
function angleFromCenter(cx: number, cy: number, px: number, py: number): number {
    const rad = Math.atan2(py - cy, px - cx);
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    return deg % 360;
}

const HANDLE_SIZE = 10;

export function EllipseArcHandles({
    cx, cy, rx, ry,
    startAngle, sweepAngle, innerRadiusRatio,
    scale: _scale,
    onUpdate,
}: EllipseArcHandlesProps) {
    const [activeHandle, setActiveHandle] = useState<'start' | 'sweep' | 'ratio' | null>(null);
    const containerRef = useRef<SVGSVGElement | null>(null);
    const lastAngleRef = useRef<number>(0);

    // Only show arc handles when we have a partial arc or inner radius
    const isFullCircle = sweepAngle >= 360 && innerRadiusRatio === 0;

    // Sweep handle position: at the end of the arc
    const sweepEnd = startAngle + sweepAngle;
    const sweepHandlePos = pointOnEllipse(cx, cy, rx, ry, sweepEnd);

    // Start handle position: at the beginning of the arc
    const startHandlePos = pointOnEllipse(cx, cy, rx, ry, startAngle);

    // Ratio handle position: at center, offset based on inner radius
    const ratioDistance = innerRadiusRatio * Math.min(rx, ry);
    const ratioHandlePos = pointOnEllipse(cx, cy, ratioDistance, ratioDistance, startAngle + sweepAngle / 2);

    // Generic drag handler
    const handleDrag = useCallback((
        e: React.PointerEvent,
        type: 'start' | 'sweep' | 'ratio'
    ) => {
        e.stopPropagation();
        e.preventDefault();
        setActiveHandle(type);

        const parentRect = containerRef.current?.closest('div')?.getBoundingClientRect();
        if (!parentRect) return;

        const handleMove = (moveEvent: PointerEvent) => {
            const localX = moveEvent.clientX - parentRect.left;
            const localY = moveEvent.clientY - parentRect.top;

            if (type === 'ratio') {
                // Ratio: distance from center determines inner radius
                const dist = Math.sqrt((localX - cx) ** 2 + (localY - cy) ** 2);
                const maxRadius = Math.min(rx, ry);
                const ratio = Math.max(0, Math.min(0.95, dist / maxRadius));
                onUpdate({ innerRadiusRatio: Math.round(ratio * 100) / 100 });
            } else {
                const angle = angleFromCenter(cx, cy, localX, localY);

                if (type === 'start') {
                    // Start: rotate the arc start
                    const delta = angle - lastAngleRef.current;
                    let newStart = (startAngle + delta + 360) % 360;
                    onUpdate({ startAngle: Math.round(newStart * 10) / 10 });
                    lastAngleRef.current = angle;
                } else {
                    // Sweep: change the arc extent
                    let newSweep = ((angle - startAngle + 360) % 360);
                    if (newSweep < 5) newSweep = 5; // Minimum 5°
                    if (newSweep > 360) newSweep = 360;
                    onUpdate({ sweepAngle: Math.round(newSweep * 10) / 10 });
                }
            }
        };

        lastAngleRef.current = angleFromCenter(
            cx, cy,
            e.clientX - parentRect.left,
            e.clientY - parentRect.top
        );

        const handleUp = () => {
            setActiveHandle(null);
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    }, [cx, cy, rx, ry, startAngle, sweepAngle, onUpdate]);

    // Sweep "pie line" indicator from center to arc endpoints
    const renderArcGuides = () => {
        if (isFullCircle) return null;
        return (
            <>
                <line
                    x1={cx} y1={cy}
                    x2={startHandlePos.x} y2={startHandlePos.y}
                    stroke="#3B82F6" strokeWidth={1} strokeDasharray="3 2"
                    style={{ pointerEvents: 'none' }}
                />
                <line
                    x1={cx} y1={cy}
                    x2={sweepHandlePos.x} y2={sweepHandlePos.y}
                    stroke="#3B82F6" strokeWidth={1} strokeDasharray="3 2"
                    style={{ pointerEvents: 'none' }}
                />
            </>
        );
    };

    const handleStyle = (_color: string, isActive: boolean): React.CSSProperties => ({
        cursor: 'pointer',
        filter: isActive ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.8))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
        transition: 'filter 0.15s ease',
    });

    return (
        <svg
            ref={containerRef}
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
                zIndex: 20,
            }}
        >
            {/* Arc guide lines */}
            {renderArcGuides()}

            {/* Sweep Handle (orange) — at end of arc */}
            <circle
                cx={sweepHandlePos.x}
                cy={sweepHandlePos.y}
                r={HANDLE_SIZE / 2}
                fill={activeHandle === 'sweep' ? '#EA580C' : '#F97316'}
                stroke="white"
                strokeWidth={2}
                style={{ ...handleStyle('#F97316', activeHandle === 'sweep'), pointerEvents: 'auto' }}
                onPointerDown={(e) => handleDrag(e, 'sweep')}
            >
                <title>Sweep: {Math.round(sweepAngle)}° (드래그로 호 범위 조절)</title>
            </circle>

            {/* Start Handle (green) — at start of arc */}
            {!isFullCircle && (
                <circle
                    cx={startHandlePos.x}
                    cy={startHandlePos.y}
                    r={HANDLE_SIZE / 2}
                    fill={activeHandle === 'start' ? '#15803D' : '#22C55E'}
                    stroke="white"
                    strokeWidth={2}
                    style={{ ...handleStyle('#22C55E', activeHandle === 'start'), pointerEvents: 'auto' }}
                    onPointerDown={(e) => handleDrag(e, 'start')}
                >
                    <title>Start: {Math.round(startAngle)}° (드래그로 시작점 조절)</title>
                </circle>
            )}

            {/* Ratio Handle (purple) — controls inner radius */}
            {!isFullCircle && (
                <circle
                    cx={ratioHandlePos.x}
                    cy={ratioHandlePos.y}
                    r={HANDLE_SIZE / 2}
                    fill={activeHandle === 'ratio' ? '#7E22CE' : '#A855F7'}
                    stroke="white"
                    strokeWidth={2}
                    style={{ ...handleStyle('#A855F7', activeHandle === 'ratio'), pointerEvents: 'auto' }}
                    onPointerDown={(e) => handleDrag(e, 'ratio')}
                >
                    <title>Inner Radius: {Math.round(innerRadiusRatio * 100)}% (드래그로 도넛 형태 조절)</title>
                </circle>
            )}
        </svg>
    );
}
