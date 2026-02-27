/**
 * DrawPreview — 드로잉 도구 사용 중 실시간 프리뷰
 *
 * Agent 2 (Drawing Craftsman):
 * - 서브픽셀 스냅: Math.round()로 1px 이하 blur 방지
 * - Shift: 비례 잠금 (정사각형/정원)
 * - Alt: 중심점 기준 확장 (Figma/PPT 표준)
 * - preview-tokens.ts에서 색상 상수 참조
 */

import { useState, useEffect } from 'react';
import type { ToolType, BBox } from '../../core/model/types';
import { PREVIEW } from './preview-tokens';

// ── Props ────────────────────────────────────

interface DrawPreviewProps {
    activeTool: ToolType;
    drawStart: { x: number; y: number };
    drawCurrent: { x: number; y: number };
    scale: number;
}

// ── 서브픽셀 스냅 유틸 ──────────────────────

/** 좌표를 정수로 반올림하여 서브픽셀 blur 방지 */
function snap(v: number): number {
    return Math.round(v);
}

// ── BBox 계산 (비례 + 중심점 기준) ──────────

function scaledBBox(
    start: { x: number; y: number },
    current: { x: number; y: number },
    scale: number,
    constrain = false,
    fromCenter = false,
): BBox {
    let rawW = current.x - start.x;
    let rawH = current.y - start.y;

    if (constrain) {
        const maxSide = Math.max(Math.abs(rawW), Math.abs(rawH));
        rawW = Math.sign(rawW) * maxSide;
        rawH = Math.sign(rawH) * maxSide;
    }

    let x: number, y: number, width: number, height: number;

    if (fromCenter) {
        // Alt: 중심점(start)에서 양방향으로 확장
        width = Math.abs(rawW) * 2;
        height = Math.abs(rawH) * 2;
        x = start.x - Math.abs(rawW);
        y = start.y - Math.abs(rawH);
    } else {
        width = Math.abs(rawW);
        height = Math.abs(rawH);
        x = rawW >= 0 ? start.x : start.x + rawW;
        y = rawH >= 0 ? start.y : start.y + rawH;
    }

    // 스케일 적용 + 서브픽셀 스냅
    return {
        x: snap(x * scale),
        y: snap(y * scale),
        width: snap(width * scale),
        height: snap(height * scale),
    };
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

// ── 프리뷰 렌더러 ────────────────────────────

type PreviewRenderer = (props: DrawPreviewProps & { shift: boolean; alt: boolean }) => React.ReactNode;

const PREVIEW_RENDERERS: Record<string, PreviewRenderer> = {
    highlight: ({ drawStart, drawCurrent, scale, shift, alt }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale, shift, alt);
        return (
            <div style={{
                ...baseStyle(bbox),
                backgroundColor: PREVIEW.HIGHLIGHT_BG,
                opacity: PREVIEW.HIGHLIGHT_OPACITY,
                border: `${PREVIEW.STROKE_WIDTH}px dashed ${PREVIEW.HIGHLIGHT_BORDER}`,
            }} />
        );
    },

    rectangle: ({ drawStart, drawCurrent, scale, shift, alt }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale, shift, alt);
        return (
            <div style={{
                ...baseStyle(bbox),
                border: `${PREVIEW.STROKE_WIDTH}px dashed ${PREVIEW.SHAPE_STROKE}`,
                backgroundColor: 'transparent',
            }} />
        );
    },

    roundedRect: ({ drawStart, drawCurrent, scale, shift, alt }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale, shift, alt);
        return (
            <div style={{
                ...baseStyle(bbox),
                border: `${PREVIEW.STROKE_WIDTH}px dashed ${PREVIEW.SHAPE_STROKE}`,
                backgroundColor: 'transparent',
                borderRadius: '20px',
            }} />
        );
    },

    ellipse: ({ drawStart, drawCurrent, scale, shift, alt }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale, shift, alt);
        return (
            <div style={{
                ...baseStyle(bbox),
                border: `${PREVIEW.STROKE_WIDTH}px dashed ${PREVIEW.SHAPE_STROKE}`,
                backgroundColor: 'transparent',
                borderRadius: '50%',
            }} />
        );
    },

    arrow: ({ drawStart, drawCurrent, scale }) => {
        const sx = snap(drawStart.x * scale);
        const sy = snap(drawStart.y * scale);
        const ex = snap(drawCurrent.x * scale);
        const ey = snap(drawCurrent.y * scale);
        const angle = Math.atan2(ey - sy, ex - sx);
        const headLen = 10;

        return (
            <svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <line
                    x1={sx} y1={sy} x2={ex} y2={ey}
                    stroke={PREVIEW.LINE_STROKE}
                    strokeWidth={PREVIEW.STROKE_WIDTH}
                    strokeDasharray={PREVIEW.DASH_ARRAY}
                />
                <polygon
                    points={`${ex},${ey} ${snap(ex - headLen * Math.cos(angle - Math.PI / 6))},${snap(ey - headLen * Math.sin(angle - Math.PI / 6))} ${snap(ex - headLen * Math.cos(angle + Math.PI / 6))},${snap(ey - headLen * Math.sin(angle + Math.PI / 6))}`}
                    fill={PREVIEW.ARROW_FILL}
                />
            </svg>
        );
    },

    star: ({ drawStart, drawCurrent, scale, shift, alt }) => {
        const bbox = scaledBBox(drawStart, drawCurrent, scale, shift, alt);
        return (
            <div style={{
                ...baseStyle(bbox),
                border: `${PREVIEW.STROKE_WIDTH}px dashed ${PREVIEW.SPECIAL_STROKE}`,
                backgroundColor: 'transparent',
            }} />
        );
    },
};

// ── 메인 컴포넌트 ────────────────────────────

export function DrawPreview({ activeTool, drawStart, drawCurrent, scale }: DrawPreviewProps) {
    const [shiftHeld, setShiftHeld] = useState(false);
    const [altHeld, setAltHeld] = useState(false);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftHeld(true);
            if (e.key === 'Alt') { setAltHeld(true); e.preventDefault(); }
        };
        const up = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftHeld(false);
            if (e.key === 'Alt') setAltHeld(false);
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    const renderer = PREVIEW_RENDERERS[activeTool];
    if (!renderer) return null;

    // Shift 비례 잠금은 box 도구에만 적용
    const boxTools = ['rectangle', 'roundedRect', 'ellipse', 'star', 'highlight'];
    const isBox = boxTools.includes(activeTool);

    return <>{renderer({ activeTool, drawStart, drawCurrent, scale, shift: isBox && shiftHeld, alt: isBox && altHeld })}</>;
}

/** 외부에서 커스텀 프리뷰 렌더러를 등록 (확장용) */
export function registerPreviewRenderer(toolType: string, renderer: PreviewRenderer): void {
    PREVIEW_RENDERERS[toolType] = renderer;
}
