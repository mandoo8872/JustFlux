/**
 * ShapeAnnotation Component - 도형 주석 (Rect, RoundedRect, Ellipse)
 */

import React, { useState, useRef, useCallback } from 'react';
import type { RectangleAnnotation, EllipseAnnotation, RoundedRectAnnotation } from '../../../types/annotation';
import { ResizeHandles } from './ResizeHandles';

type ShapeAnnotationType = RectangleAnnotation | RoundedRectAnnotation | EllipseAnnotation;

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
  const [isDraggingCorner, setIsDraggingCorner] = useState(false);
  const isHovered = isHoveredProp ?? localHovered;
  const cornerStartRef = useRef<{ x: number; radius: number } | null>(null);

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

  // Corner radius handle for rounded rectangles
  const handleCornerPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingCorner(true);

    const currentRadius = (annotation as RoundedRectAnnotation).cornerRadius || 0;
    cornerStartRef.current = {
      x: e.clientX,
      radius: currentRadius,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!cornerStartRef.current) return;

      const deltaX = (moveEvent.clientX - cornerStartRef.current.x) / scale;
      const maxRadius = Math.min(bbox.width, bbox.height) / 2;
      const newRadius = Math.max(0, Math.min(maxRadius, cornerStartRef.current.radius + deltaX));

      onUpdate({
        cornerRadius: newRadius,
      } as Partial<RoundedRectAnnotation>);
    };

    const handlePointerUp = () => {
      setIsDraggingCorner(false);
      cornerStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [annotation, bbox.width, bbox.height, scale, onUpdate]);

  const isEllipse = annotation.type === 'ellipse';
  const isRoundedRect = annotation.type === 'roundedRect';
  const strokeWidth = (annotation.style?.strokeWidth || 2) * scale;

  // Corner radius for rectangles
  const cornerRadius = (annotation as RoundedRectAnnotation).cornerRadius || 0;
  const scaledCornerRadius = cornerRadius * scale;

  // Corner handle position (top-left corner, offset by corner radius)
  const cornerHandleX = scaledCornerRadius + 10;
  const cornerHandleY = 10;

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: 'grab',
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
            fillOpacity={annotation.style?.opacity ?? 1}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
            strokeDasharray={annotation.style?.strokeDasharray ? annotation.style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
          />
        ) : (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(0, scaledBBox.width - strokeWidth)}
            height={Math.max(0, scaledBBox.height - strokeWidth)}
            rx={scaledCornerRadius}
            ry={scaledCornerRadius}
            fill={annotation.style?.fill || 'transparent'}
            fillOpacity={annotation.style?.opacity ?? 1}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
            strokeDasharray={annotation.style?.strokeDasharray ? annotation.style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
          />
        )}
      </svg>

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div style={{
          position: 'absolute',
          inset: '-3px',
          border: '2px dashed #93C5FD',
          borderRadius: isEllipse ? '50%' : `${scaledCornerRadius + 3}px`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          inset: 0,
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.3)',
          borderRadius: isEllipse ? '50%' : `${scaledCornerRadius}px`,
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

      {/* Corner radius handle - only for roundedRect type */}
      {isSelected && isRoundedRect && (
        <div
          onPointerDown={handleCornerPointerDown}
          style={{
            position: 'absolute',
            left: cornerHandleX - 5,
            top: cornerHandleY - 5,
            width: 10,
            height: 10,
            backgroundColor: isDraggingCorner ? '#F97316' : '#FBBF24',
            border: '2px solid white',
            borderRadius: '2px',
            cursor: 'ew-resize',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            zIndex: 100,
            pointerEvents: 'auto',
          }}
          title={`모서리 반경: ${Math.round(cornerRadius)}px (드래그로 조정)`}
        />
      )}
    </div>
  );
}
