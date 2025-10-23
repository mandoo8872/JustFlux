/**
 * HighlightAnnotation Component - 하이라이트 주석
 */

import { useState, useEffect } from 'react';
import type { HighlightAnnotation as HighlightAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface HighlightAnnotationProps {
  annotation: HighlightAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<HighlightAnnotationType>) => void;
  onDelete: () => void;
}

export function HighlightAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: HighlightAnnotationProps) {
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

  return (
    <div
      className={`absolute group ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        backgroundColor: annotation.style?.fill || '#FFFF00',
        opacity: annotation.opacity || 0.3,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 ring-2 ring-yellow-500 ring-offset-1 pointer-events-none" />
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




