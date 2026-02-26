/**
 * HighlighterAnnotation Component - 형광펜 주석 렌더링
 * FreehandAnnotation 기반, 반투명하고 두꺼운 스트로크
 */

import React, { useState } from 'react';
import type { HighlighterAnnotation, Point } from '../../../types/annotation';

interface HighlighterAnnotationProps {
    annotation: HighlighterAnnotation;
    isSelected: boolean;
    isHovered?: boolean;
    scale: number;
    onSelect: () => void;
    onUpdate: (updates: Partial<HighlighterAnnotation>) => void;
    onDelete: () => void;
    onHover?: () => void;
    onHoverEnd?: () => void;
    onPointerDown?: (e: React.PointerEvent) => void;
}

// Convert points array to SVG path string (with scale applied)
function pointsToScaledPath(points: Point[], scale: number): string {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x * scale} ${points[0].y * scale}`;
    if (points.length === 2) {
        return `M ${points[0].x * scale} ${points[0].y * scale} L ${points[1].x * scale} ${points[1].y * scale}`;
    }

    // Use quadratic bezier curves for smooth path
    let path = `M ${points[0].x * scale} ${points[0].y * scale}`;

    for (let i = 1; i < points.length - 1; i++) {
        const midX = ((points[i].x + points[i + 1].x) / 2) * scale;
        const midY = ((points[i].y + points[i + 1].y) / 2) * scale;
        path += ` Q ${points[i].x * scale} ${points[i].y * scale}, ${midX} ${midY}`;
    }

    // End with the last point
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x * scale} ${lastPoint.y * scale}`;

    return path;
}

export function HighlighterAnnotationComponent({
    annotation,
    isSelected,
    isHovered: isHoveredProp,
    scale,
    onSelect,
    onUpdate: _onUpdate,
    onHover,
    onHoverEnd,
    onPointerDown,
}: HighlighterAnnotationProps) {
    const [localHovered, setLocalHovered] = useState(false);
    const isHovered = isHoveredProp ?? localHovered;

    const { points = [], bbox, style } = annotation;
    // Highlighter defaults: yellow color, thick stroke, semi-transparent
    const { stroke = '#FFFF00', strokeWidth = 20, opacity = 0.4 } = style || {};

    const pathString = pointsToScaledPath(points, scale);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
        onPointerDown?.(e);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect();
    };

    const handleMouseEnter = () => {
        setLocalHovered(true);
        onHover?.();
    };

    const handleMouseLeave = () => {
        setLocalHovered(false);
        onHoverEnd?.();
    };

    return (
        <svg
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                overflow: 'visible',
                pointerEvents: 'none',
            }}
        >
            {/* Hit area (invisible thick path) */}
            <path
                d={pathString}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(50, strokeWidth * 2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                    pointerEvents: 'stroke',
                    cursor: isSelected ? 'move' : 'pointer'
                }}
                onPointerDown={handlePointerDown}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />

            {/* Hover indicator — dashed bbox like other objects */}
            {isHovered && !isSelected && bbox && (
                <rect
                    x={bbox.x * scale - 4}
                    y={bbox.y * scale - 4}
                    width={bbox.width * scale + 8}
                    height={bbox.height * scale + 8}
                    fill="none"
                    stroke="#93C5FD"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    rx={4}
                    ry={4}
                    style={{ pointerEvents: 'none' }}
                />
            )}

            {/* Selection indicator — path-following blue outline */}
            {isSelected && (
                <path
                    d={pathString}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth={(strokeWidth + 8) * scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={0.35}
                    style={{ pointerEvents: 'all', cursor: 'move' }}
                    onPointerDown={handlePointerDown}
                    onClick={handleClick}
                />
            )}

            {/* Visible path - semi-transparent highlighter effect */}
            <path
                d={pathString}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeOpacity={opacity}
                style={{ pointerEvents: 'none' }}
            />
        </svg>
    );
}
