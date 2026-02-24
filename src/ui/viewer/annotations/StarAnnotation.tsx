/**
 * StarAnnotation Component - 별 모양 주석
 */

import { useState, useCallback } from 'react';
import type { StarAnnotation as StarAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface StarAnnotationProps {
  annotation: StarAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<StarAnnotationType>) => void;
  onDelete: () => void;
}

export function StarAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: StarAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const { bbox, style, points = 5, innerRadius = 0.4 } = annotation;

  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  }, [onSelect]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const deltaX = (e.clientX - dragStart.x) / scale;
    const deltaY = (e.clientY - dragStart.y) / scale;

    const newBbox = {
      x: bbox.x + deltaX,
      y: bbox.y + deltaY,
      width: bbox.width,
      height: bbox.height,
    };

    onUpdate({ bbox: newBbox });
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, bbox, onUpdate, scale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  // Generate star path
  const centerX = scaledBBox.width / 2;
  const centerY = scaledBBox.height / 2;
  const outerRadius = Math.min(scaledBBox.width, scaledBBox.height) / 2 - 5;
  const innerRadiusValue = outerRadius * (innerRadius || 0.5);

  const generateStarPath = () => {
    const angleStep = (Math.PI * 2) / (points as number || 5);
    const path = [];
    
    for (let i = 0; i < (points as number || 5) * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadiusValue;
      const angle = i * angleStep / 2 - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      if (i === 0) {
        path.push(`M ${x} ${y}`);
      } else {
        path.push(`L ${x} ${y}`);
      }
    }
    path.push('Z');
    
    return path.join(' ');
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: isSelected ? 'grab' : 'pointer',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: scaledBBox.width,
          height: scaledBBox.height,
          overflow: 'visible',
        }}
      >
        <path
          d={generateStarPath()}
          fill={style?.fill || 'transparent'}
          stroke={style?.stroke || '#000000'}
          strokeWidth={(style?.strokeWidth || 2) * scale}
        />
      </svg>

      {isSelected && (
        <ResizeHandles
          width={bbox.width}
          height={bbox.height}
          onResize={(width, height) => onUpdate({ 
            bbox: { 
              ...bbox, 
              width, 
              height 
            } 
          })}
        />
      )}
    </div>
  );
}

