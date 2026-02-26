/**
 * DrawPreview — 드로잉 도구 사용 중 실시간 프리뷰를 표시하는 컴포넌트
 *
 * AnnotationLayer에서 분리되어 단일 책임 원칙(SRP)을 따름.
 * 새로운 도구를 추가할 때 이 파일에만 프리뷰 렌더러를 추가하면 됨.
 */

import { useState, useEffect } from 'react';
import type { ToolType, BBox } from '../../core/model/types';

// ── Props ────────────────────────────────────

interface DrawPreviewProps {
    activeTool: ToolType;
    drawStart: { x: number; y: number };
    drawCurrent: { x: number; y: number };
    scale: number;
}

// ── 공통 스타일 ──────────────────────────────

function scaledBBox(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
    constrain = false
): BBox {
    let width = Math.abs(current.x - start.x) * scale;
    let height = Math.abs(current.y - start.y) * scale;

    if (constrain) {
        const maxSide = Math.max(width, height);
        width = maxSide;
        height = maxSide;
    }

    const x = (current.x >= start.x ? start.x : start.x - width / scale) * scale;
    const y = (current.y >= start.y ? start.y : start.y - height / scale) * scale;

    return { x, y, width, height };
}

function baseStyle(bbox: BBox): React.CSSProperties {
    return {
        position: 'absolute',
        left: bbox.x,
        top: bbox.y,
        width: bbox.width,
        height: bbox.height,
        pointerEvents: 'none',
    };
}

// ── 도구별 프리뷰 렌더러 ─────────────────────

type PreviewRenderer = (props: DrawPreviewProps) => React.ReactNode;

const PREVIEW_RENDERERS: Record<string, PreviewRenderer> = {
    highlight: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    backgroundColor: '#FFFF00',
                    opacity: 0.3,
                    border: '2px dashed #FFA500',
                }}
            />
        );
    },

    rectangle: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #3B82F6',
                    backgroundColor: 'transparent',
                }}
            />
        );
    },

    roundedRect: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #3B82F6',
                    backgroundColor: 'transparent',
                    borderRadius: '20px',
                }}
            />
        );
    },

    ellipse: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #3B82F6',
                    backgroundColor: 'transparent',
                    borderRadius: '50%',
                }}
            />
        );
    },

    arrow: ({ drawStart, drawCurrent, scale }) => {
        const startX = drawStart.x * scale;
        const startY = drawStart.y * scale;
        const endX = drawCurrent.x * scale;
        const endY = drawCurrent.y * scale;
        const angle = Math.atan2(endY - startY, endX - startX);

        return (
            <svg
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                }}
            >
                <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />
                <polygon
                    points={`${endX},${endY} ${endX - 10 * Math.cos(angle - Math.PI / 6)},${endY - 10 * Math.sin(angle - Math.PI / 6)} ${endX - 10 * Math.cos(angle + Math.PI / 6)},${endY - 10 * Math.sin(angle + Math.PI / 6)}`}
                    fill="#3B82F6"
                />
            </svg>
        );
    },

    // star, heart, lightning은 기본 사각형 프리뷰 사용
    star: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #F59E0B',
                    backgroundColor: 'transparent',
                }}
            />
        );
    },

    heart: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #EF4444',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                }}
            />
        );
    },

    lightning: ({ drawStart, drawCurrent, scale }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale);
        return (
            <div
                style={{
                    ...baseStyle(bbox),
                    border: '2px dashed #8B5CF6',
                    backgroundColor: 'transparent',
                }}
            />
        );
    },
};

// ── 메인 컴포넌트 ────────────────────────────

export function DrawPreview({ activeTool, drawStart, drawCurrent, scale }: DrawPreviewProps) {
    const [shiftHeld, setShiftHeld] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(true); };
        const up = (e: KeyboardEvent) => { if (e.key === 'Shift') setShiftHeld(false); };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const renderer = PREVIEW_RENDERERS[activeTool];
    if (!renderer) return null;

    // Pass shift state via a modified drawCurrent for box-based tools
    const boxTools = ['rectangle', 'roundedRect', 'ellipse', 'star', 'heart', 'lightning', 'highlight'];
    let effectiveCurrent = drawCurrent;
    if (shiftHeld && boxTools.includes(activeTool)) {
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);
        const maxSide = Math.max(w, h);
        effectiveCurrent = {
            x: drawCurrent.x >= drawStart.x ? drawStart.x + maxSide : drawStart.x - maxSide,
            y: drawCurrent.y >= drawStart.y ? drawStart.y + maxSide : drawStart.y - maxSide,
        };
    }

    return <>{renderer({ activeTool, drawStart, drawCurrent: effectiveCurrent, scale })}</>;
}

/**
 * 외부에서 커스텀 프리뷰 렌더러를 등록 (확장용)
 */
export function registerPreviewRenderer(toolType: string, renderer: PreviewRenderer): void {
    PREVIEW_RENDERERS[toolType] = renderer;
}
