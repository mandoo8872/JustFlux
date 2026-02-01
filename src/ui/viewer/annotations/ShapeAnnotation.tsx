/**
 * ShapeAnnotation Component - 도형 주석 (Rect, Ellipse)
 */

import React, { useState } from 'react';
import type { RectAnnotation, EllipseAnnotation } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

type ShapeAnnotationType = RectAnnotation | EllipseAnnotation;

interface ShapeAnnotationProps {
  annotation: ShapeAnnotationType;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ShapeAnnotationType>) => void;
  onDelete: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function ShapeAnnotationComponent({
  annotation,
  isSelected,
  isHovered: isHoveredProp,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onPointerDown,
}: ShapeAnnotationProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const isHovered = isHoveredProp ?? localHovered;

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onHoverEnd?.();
  };

  const handleResize = (dWidth: number, dHeight: number, dX: number, dY: number) => {
    const dW_scaled = dWidth / scale;
    const dH_scaled = dHeight / scale;
    const dX_scaled = dX / scale;
    const dY_scaled = dY / scale;

    onUpdate({
      bbox: {
        x: bbox.x + dX_scaled,
        y: bbox.y + dY_scaled,
        width: Math.max(10 / scale, bbox.width + dW_scaled),
        height: Math.max(10 / scale, bbox.height + dH_scaled),
      },
    });
  };

  const isEllipse = annotation.type === 'ellipse';
  const strokeWidth = (annotation.style?.strokeWidth || 2) * scale;

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: 'grab',
        zIndex: isSelected ? 50 : 20,
      }}
      onPointerDown={onPointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* SVG Shape */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {isEllipse ? (
          <ellipse
            cx={scaledBBox.width / 2}
            cy={scaledBBox.height / 2}
            rx={Math.max(0, scaledBBox.width / 2 - strokeWidth / 2)}
            ry={Math.max(0, scaledBBox.height / 2 - strokeWidth / 2)}
            fill={annotation.style?.fill || 'transparent'}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
          />
        ) : (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(0, scaledBBox.width - strokeWidth)}
            height={Math.max(0, scaledBBox.height - strokeWidth)}
            rx={(annotation as RectAnnotation).cornerRadius || 0}
            fill={annotation.style?.fill || 'transparent'}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
          />
        )}
      </svg>

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div style={{
          position: 'absolute',
          inset: '-3px',
          border: '2px dashed #93C5FD',
          borderRadius: '4px',
          pointerEvents: 'none',
        }} />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.3)',
          borderRadius: '2px',
          pointerEvents: 'none',
        }} />
      )}

      {/* Resize handles */}
      {isSelected && (
        <ResizeHandles
          width={scaledBBox.width}
          height={scaledBBox.height}
          onResize={handleResize}
        />
      )}
    </div>
  );
}
