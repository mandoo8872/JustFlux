/**
 * ImageAnnotation Component - 이미지 주석 렌더링
 */

import React from 'react';
import type { ImageAnnotation } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface ImageAnnotationProps {
  annotation: ImageAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageAnnotation>) => void;
  onDelete: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
  onDragStart?: (annotation: ImageAnnotation, startPos: { x: number; y: number }) => void;
}

export function ImageAnnotationComponent({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onDragStart,
}: ImageAnnotationProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    
    // Start dragging using AnnotationLayer's drag system
    if (onDragStart) {
      onDragStart(annotation, { x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseEnter = () => {
    onHover();
  };

  const handleMouseLeave = () => {
    onHoverEnd();
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
        cursor: isSelected ? 'grab' : 'pointer',
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={annotation.imageData}
        alt="Annotation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          border: isSelected 
            ? '2px solid #3B82F6' 
            : isHovered 
              ? '2px solid #93C5FD' 
              : '1px solid #e5e7eb',
          borderRadius: '4px',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.2s ease',
        }}
        draggable={false}
      />
      
      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            border: '2px dashed #93C5FD',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}
      
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
