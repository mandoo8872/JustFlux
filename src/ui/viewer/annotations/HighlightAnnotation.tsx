/**
 * HighlightAnnotation Component - 하이라이트 주석
 * 형광펜 효과를 위한 반투명 사각형
 */

import { useState, useEffect } from 'react';
import type { HighlightAnnotation as HighlightAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface HighlightAnnotationProps {
  annotation: HighlightAnnotationType;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<HighlightAnnotationType>) => void;
  onDelete: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
}

export function HighlightAnnotationComponent({
  annotation,
  isSelected,
  isHovered: isHoveredProp,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
}: HighlightAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [localHovered, setLocalHovered] = useState(false);

  const isHovered = isHoveredProp ?? localHovered;

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: Math.max(bbox.width * scale, 10), // Minimum width
    height: Math.max(bbox.height * scale, 10), // Minimum height
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

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onHoverEnd?.();
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
    // Ensure minimum size to prevent disappearing
    const minSize = 10;
    const finalWidth = Math.max(newWidth / scale, minSize / scale);
    const finalHeight = Math.max(newHeight / scale, minSize / scale);

    onUpdate({
      bbox: {
        ...bbox,
        width: finalWidth,
        height: finalHeight,
      },
    });
  };

  const fillColor = annotation.style?.fill || '#FFFF00';
  const opacity = annotation.style?.opacity || annotation.opacity || 0.3;

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        backgroundColor: fillColor,
        opacity: opacity,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: '2px',
        transition: 'box-shadow 0.15s ease-in-out',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: '-3px',
            border: '2px dashed #93C5FD',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            inset: '-2px',
            border: '2px solid #3B82F6',
            borderRadius: '4px',
            pointerEvents: 'none',
          }}
        />
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
