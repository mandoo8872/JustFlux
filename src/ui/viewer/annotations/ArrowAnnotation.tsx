/**
 * ArrowAnnotation Component - 화살표 주석 렌더링
 */

import { useState } from 'react';
import type { ArrowAnnotation as ArrowAnnotationType } from '../../../core/model/types';

interface ArrowAnnotationProps {
  annotation: ArrowAnnotationType;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ArrowAnnotationType>) => void;
  onDelete: () => void;
}

export function ArrowAnnotationComponent({
  annotation,
  isSelected,
  scale,
  onSelect,
  onUpdate,
  onDelete,
}: ArrowAnnotationProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { startPoint, endPoint, arrowHeadSize = 10, style } = annotation;
  const { stroke = '#000000', strokeWidth = 2 } = style || {};

  // Calculate arrow direction and length
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const length = Math.sqrt((endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2);

  // Calculate arrow head points
  const headSize = arrowHeadSize * scale;
  const headAngle1 = angle - Math.PI / 6;
  const headAngle2 = angle + Math.PI / 6;
  
  const headPoint1 = {
    x: endPoint.x - headSize * Math.cos(headAngle1),
    y: endPoint.y - headSize * Math.sin(headAngle1),
  };
  
  const headPoint2 = {
    x: endPoint.x - headSize * Math.cos(headAngle2),
    y: endPoint.y - headSize * Math.sin(headAngle2),
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onDelete();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        cursor: isSelected ? 'move' : 'pointer',
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {/* Arrow line */}
        <line
          x1={startPoint.x * scale}
          y1={startPoint.y * scale}
          x2={endPoint.x * scale}
          y2={endPoint.y * scale}
          stroke={stroke}
          strokeWidth={strokeWidth * scale}
          strokeLinecap="round"
        />
        
        {/* Arrow head */}
        <polygon
          points={`${endPoint.x * scale},${endPoint.y * scale} ${headPoint1.x * scale},${headPoint1.y * scale} ${headPoint2.x * scale},${headPoint2.y * scale}`}
          fill={stroke}
        />
      </svg>

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Start point handle */}
          <div
            style={{
              position: 'absolute',
              left: startPoint.x * scale - 4,
              top: startPoint.y * scale - 4,
              width: 8,
              height: 8,
              backgroundColor: '#3B82F6',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'move',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // TODO: Implement drag to move start point
            }}
          />
          
          {/* End point handle */}
          <div
            style={{
              position: 'absolute',
              left: endPoint.x * scale - 4,
              top: endPoint.y * scale - 4,
              width: 8,
              height: 8,
              backgroundColor: '#3B82F6',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'move',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              // TODO: Implement drag to move end point
            }}
          />
        </>
      )}
    </div>
  );
}



