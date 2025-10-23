/**
 * ShapeAnnotation Component - 도형 주석 (Rect, Ellipse)
 */

import { useState, useEffect } from 'react';
import type { RectAnnotation, EllipseAnnotation } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

type ShapeAnnotationType = RectAnnotation | EllipseAnnotation;

interface ShapeAnnotationProps {
  annotation: ShapeAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ShapeAnnotationType>) => void;
  onDelete: () => void;
}

export function ShapeAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: ShapeAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      onUpdate({
        bbox: {
          ...bbox,
          x: bbox.x + dx,
          y: bbox.y + dy,
        },
      });

      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, bbox, onUpdate]);

  const handleResize = (newWidth: number, newHeight: number) => {
    onUpdate({
      bbox: {
        ...bbox,
        width: newWidth / scale,
        height: newHeight / scale,
      },
    });
  };

  const isEllipse = annotation.type === 'ellipse';
  const strokeWidth = (annotation.style?.strokeWidth || 2) * scale;

  return (
    <div
      className={`absolute group ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* SVG Shape */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          overflow: 'visible',
        }}
      >
        {isEllipse ? (
          <ellipse
            cx={scaledBBox.width / 2}
            cy={scaledBBox.height / 2}
            rx={scaledBBox.width / 2 - strokeWidth / 2}
            ry={scaledBBox.height / 2 - strokeWidth / 2}
            fill={annotation.style?.fill || 'transparent'}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
          />
        ) : (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={scaledBBox.width - strokeWidth}
            height={scaledBBox.height - strokeWidth}
            rx={(annotation as RectAnnotation).cornerRadius || 0}
            fill={annotation.style?.fill || 'transparent'}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
          />
        )}
      </svg>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-1 pointer-events-none rounded-sm" />
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




