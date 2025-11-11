/**
 * LightningAnnotation Component - 번개 모양 주석
 */

import { useCallback } from 'react';
import type { LightningAnnotation as LightningAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface LightningAnnotationProps {
  annotation: LightningAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<LightningAnnotationType>) => void;
  onDelete: () => void;
  onDragStart?: (annotation: LightningAnnotationType, startPos: { x: number; y: number }) => void;
}

export function LightningAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDragStart,
}: LightningAnnotationProps) {

  const { bbox, style } = annotation;

  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Always stop propagation to prevent AnnotationLayer from handling this event
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // Select the annotation
    onSelect();
    
    // Start dragging using AnnotationLayer's drag system
    if (onDragStart) {
      onDragStart(annotation, { x: e.clientX, y: e.clientY });
    }
  }, [onSelect, onDragStart, annotation]);

  // Generate lightning path
  const generateLightningPath = () => {
    const centerX = scaledBBox.width / 2;
    const centerY = scaledBBox.height / 2;
    const width = scaledBBox.width * 0.8;
    const height = scaledBBox.height * 0.8;
    
    const x = centerX - width / 2;
    const y = centerY - height / 2;
    
    // Lightning bolt shape
    const path = [
      `M ${x + width * 0.3} ${y}`,
      `L ${x + width * 0.2} ${y + height * 0.3}`,
      `L ${x + width * 0.4} ${y + height * 0.3}`,
      `L ${x + width * 0.3} ${y + height * 0.6}`,
      `L ${x + width * 0.5} ${y + height * 0.6}`,
      `L ${x + width * 0.4} ${y + height}`,
      `L ${x + width * 0.6} ${y + height * 0.7}`,
      `L ${x + width * 0.4} ${y + height * 0.7}`,
      `L ${x + width * 0.5} ${y + height * 0.4}`,
      `L ${x + width * 0.3} ${y + height * 0.4}`,
      `L ${x + width * 0.4} ${y}`,
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
          d={generateLightningPath()}
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

