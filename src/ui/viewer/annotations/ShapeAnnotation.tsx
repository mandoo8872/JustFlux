/**
 * ShapeAnnotation Component - 도형 주석 (Rect, Ellipse)
 */

import React from 'react';
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
  onDragStart?: (annotation: ShapeAnnotationType, startPos: { x: number; y: number }) => void;
}

export function ShapeAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDragStart,
}: ShapeAnnotationProps) {

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('🔷 [ShapeAnnotation] Mouse down for annotation:', annotation.id);

    // Always stop propagation to prevent AnnotationLayer from handling this event
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    // Select the annotation
    console.log('🔷 [ShapeAnnotation] Selecting annotation:', annotation.id);
    onSelect();

    // Start dragging using AnnotationLayer's drag system
    if (onDragStart) {
      console.log('🔷 [ShapeAnnotation] Starting drag for annotation:', annotation.id);
      onDragStart(annotation, { x: e.clientX, y: e.clientY });
    }
  };

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
      className={`absolute group ${isSelected ? 'z-50' : 'z-20'}`}
      style={{
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
      onMouseDownCapture={(e) => {
        console.log('🔷 [ShapeAnnotation] Mouse down capture, stopping propagation');
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        return false; // Additional event blocking
      }}
      onMouseUpCapture={(e) => {
        console.log('🔷 [ShapeAnnotation] Mouse up capture, stopping propagation');
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        return false; // Additional event blocking
      }}
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




