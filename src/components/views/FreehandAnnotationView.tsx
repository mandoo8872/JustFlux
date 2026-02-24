/**
 * FreehandAnnotationView - 자유 그리기 주석 렌더링 컴포넌트
 * Arrow 패턴을 따라 SVG path로 부드러운 곡선 렌더링
 */

import React from 'react';
import type { FreehandAnnotation, Point } from '../../types/annotation';

interface FreehandAnnotationViewProps {
    annotation: FreehandAnnotation;
    isSelected: boolean;
    isHovered: boolean;
    scale: number;
    onSelect: (id: string) => void;
    onUpdate: (id: string, updates: Partial<FreehandAnnotation>) => void;
    onDelete: (id: string) => void;
    onHover?: (id: string) => void;
    onHoverEnd?: (id: string) => void;
    onPointerDown?: (e: React.PointerEvent) => void;
}

// Convert points array to SVG path string (scaled)
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

export function FreehandAnnotationView({
    annotation,
    isSelected,
    isHovered,
    scale,
    onSelect,
    onHover,
    onHoverEnd,
    onPointerDown
}: FreehandAnnotationViewProps) {
    const { points = [], bbox, style } = annotation;
    const { stroke = '#000000', strokeWidth = 3 } = style || {};

    const pathString = pointsToScaledPath(points, scale);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect(annotation.id);
        onPointerDown?.(e);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onSelect(annotation.id);
    };

    const handleMouseEnter = () => onHover?.(annotation.id);
    const handleMouseLeave = () => onHoverEnd?.(annotation.id);

    return (
        <svg
            style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // SVG container doesn't capture events
                overflow: 'visible',
                zIndex: isSelected ? 50 : 20,
            }}
        >
            {/* Hit Area (Invisible thick path) - MUST have pointerEvents for selection */}
            <path
                d={pathString}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(40, strokeWidth * 6)}
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

            {/* Hover indicator - shows when hovering but not selected */}
            {isHovered && !isSelected && (
                <path
                    d={pathString}
                    fill="none"
                    stroke="#93C5FD"
                    strokeWidth={(strokeWidth + 6) * scale}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={0.6}
                    style={{ pointerEvents: 'none' }}
                />
            )}

            {/* Selection Bounding Box */}
            {isSelected && bbox && (
                <rect
                    x={bbox.x * scale - 10}
                    y={bbox.y * scale - 10}
                    width={bbox.width * scale + 20}
                    height={bbox.height * scale + 20}
                    fill="transparent"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    strokeDasharray="4 2"
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
