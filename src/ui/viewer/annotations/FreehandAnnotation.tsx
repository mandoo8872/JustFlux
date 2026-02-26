/**
 * FreehandAnnotation Component - 자유 그리기 주석 렌더링
 * Arrow 패턴을 따라 div wrapper 안에 SVG 사용
 */

import React, { useState } from 'react';
import type { FreehandAnnotation, Point } from '../../../types/annotation';

interface FreehandAnnotationProps {
    annotation: FreehandAnnotation;
    isSelected: boolean;
    isHovered?: boolean;
    scale: number;
    onSelect: () => void;
    onUpdate: (updates: Partial<FreehandAnnotation>) => void;
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

export function FreehandAnnotationComponent({
    annotation,
    isSelected,
    isHovered: isHoveredProp,
    scale,
    onSelect,
    onHover,
    onHoverEnd,
    onPointerDown,
}: FreehandAnnotationProps) {
    const [localHovered, setLocalHovered] = useState(false);
    const isHovered = isHoveredProp ?? localHovered;

    const { points = [], bbox, style } = annotation;
    const { stroke = '#000000', strokeWidth = 3 } = style || {};

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
                // SVG container has pointer-events:none, but child elements can override
                pointerEvents: 'none',
            }}
        >
            {/* Hit area (invisible thick path) - MUST capture events */}
            <path
                d={pathString}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(40, strokeWidth * 8)}
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
                    strokeWidth={(strokeWidth + 6) * scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={0.4}
                    style={{ pointerEvents: 'all', cursor: 'move' }}
                    onPointerDown={handlePointerDown}
                    onClick={handleClick}
                />
            )}

            {/* Visible path */}
            <path
                d={pathString}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
            />
        </svg>
    );
}
