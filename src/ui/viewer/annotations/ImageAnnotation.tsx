/**
 * ImageAnnotation Component - 이미지 주석 렌더링
 */

import React from 'react';
import type { ImageAnnotation } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface ImageAnnotationProps {
  annotation: ImageAnnotation;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageAnnotation>) => void;
  onDelete: () => void;
}

export function ImageAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: ImageAnnotationProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleResize = (newWidth: number, newHeight: number) => {
    onUpdate({
      bbox: {
        ...annotation.bbox,
        width: newWidth,
        height: newHeight,
      },
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: annotation.bbox.x * scale,
        top: annotation.bbox.y * scale,
        width: annotation.bbox.width * scale,
        height: annotation.bbox.height * scale,
        cursor: isSelected ? 'move' : 'pointer',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <img
        src={annotation.imageData}
        alt="Annotation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          border: isSelected ? '2px solid #3B82F6' : '1px solid #e5e7eb',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
        }}
        draggable={false}
      />
      
      {isSelected && (
        <ResizeHandles
          width={annotation.bbox.width * scale}
          height={annotation.bbox.height * scale}
          onResize={handleResize}
        />
      )}
    </div>
  );
}
