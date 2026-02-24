/**
 * HighlighterAnnotation Component - 형광펜 주석 렌더링
 * FreehandAnnotation 기반, 반투명하고 두꺼운 스트로크
 */

import React, { useState, useCallback } from 'react';
import type { HighlighterAnnotation, Point } from '../../../types/annotation';
import { ResizeHandles } from './ResizeHandles';

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
    onUpdate,
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

    // Handle resize - scale all points relative to bbox
    const handleResize = useCallback((dWidth: number, dHeight: number, dX: number, dY: number) => {
        if (!bbox || !points.length) return;

        const dW_scaled = dWidth / scale;
        const dH_scaled = dHeight / scale;
        const dX_scaled = dX / scale;
        const dY_scaled = dY / scale;

        const newWidth = Math.max(10 / scale, bbox.width + dW_scaled);
        const newHeight = Math.max(10 / scale, bbox.height + dH_scaled);

        // Calculate scale factors
        const scaleX = newWidth / bbox.width;
        const scaleY = newHeight / bbox.height;

        // Transform all points relative to the old bbox origin
        const newPoints = points.map(point => ({
            x: bbox.x + dX_scaled + (point.x - bbox.x) * scaleX,
            y: bbox.y + dY_scaled + (point.y - bbox.y) * scaleY,
        }));

        onUpdate({
            bbox: {
                x: bbox.x + dX_scaled,
                y: bbox.y + dY_scaled,
                width: newWidth,
                height: newHeight,
            },
            points: newPoints,
        });
    }, [bbox, points, scale, onUpdate]);

    // Calculate scaled bbox for handles
    const scaledBBox = bbox ? {
        x: bbox.x * scale,
        y: bbox.y * scale,
        width: bbox.width * scale,
        height: bbox.height * scale,
    } : null;

    return (
        <>
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

                {/* Hover indicator */}
                {isHovered && !isSelected && (
                    <path
                        d={pathString}
                        fill="none"
                        stroke="#93C5FD"
                        strokeWidth={(strokeWidth + 10) * scale}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeOpacity={0.4}
                        style={{ pointerEvents: 'none' }}
                    />
                )}

                {/* Selection bounding box */}
                {isSelected && bbox && (
                    <rect
                        x={bbox.x * scale - 5}
                        y={bbox.y * scale - 5}
                        width={bbox.width * scale + 10}
                        height={bbox.height * scale + 10}
                        fill="transparent"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        strokeDasharray="4 2"
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

            {/* Resize handles */}
            {isSelected && scaledBBox && (
                <div
                    style={{
                        position: 'absolute',
                        left: scaledBBox.x - 5,
                        top: scaledBBox.y - 5,
                        width: scaledBBox.width + 10,
                        height: scaledBBox.height + 10,
                        pointerEvents: 'none',
                        zIndex: 51,
                    }}
                >
                    <ResizeHandles
                        width={scaledBBox.width + 10}
                        height={scaledBBox.height + 10}
                        onResize={handleResize}
                    />
                </div>
            )}
        </>
    );
}
