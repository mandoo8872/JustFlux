/**
 * HeartAnnotation Component - 하트 모양 주석
 */

import { useState, useCallback } from 'react';
import type { HeartAnnotation as HeartAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface HeartAnnotationProps {
  annotation: HeartAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<HeartAnnotationType>) => void;
  onDelete: () => void;
}

export function HeartAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
}: HeartAnnotationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  const { bbox, style } = annotation;

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

  // Generate heart path
  const generateHeartPath = () => {
    const centerX = scaledBBox.width / 2;
    const centerY = scaledBBox.height / 2;
    const width = scaledBBox.width * 0.8;
    const height = scaledBBox.height * 0.8;
    
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    
    // Heart shape using cubic bezier curves
    const path = [
      `M ${x + width * 0.5} ${y + height * 0.3}`,
      `C ${x + width * 0.1} ${y + height * 0.1}, ${x} ${y + height * 0.4}, ${x} ${y + height * 0.6}`,
      `C ${x} ${y + height * 0.8}, ${x + width * 0.2} ${y + height * 0.9}, ${x + width * 0.4} ${y + height * 0.8}`,
      `L ${x + width * 0.5} ${y + height * 0.7}`,
      `L ${x + width * 0.6} ${y + height * 0.8}`,
      `C ${x + width * 0.8} ${y + height * 0.9}, ${x + width} ${y + height * 0.8}, ${x + width} ${y + height * 0.6}`,
      `C ${x + width} ${y + height * 0.4}, ${x + width * 0.9} ${y + height * 0.1}, ${x + width * 0.5} ${y + height * 0.3}`,
      'Z'
    ].join(' ');
    
    return path;
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
          d={generateHeartPath()}
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

