/**
 * ArrowAnnotation Component - 화살표 주석 렌더링
 */

import React from 'react';
import type { ArrowAnnotation as ArrowAnnotationType, LineAnnotation } from '../../../core/model/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ResizeHandles as _ResizeHandles } from './ResizeHandles';

interface ArrowAnnotationProps {
  annotation: ArrowAnnotationType | LineAnnotation;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ArrowAnnotationType | LineAnnotation>) => void;
  onDelete: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function ArrowAnnotationComponent({
  annotation,
  isSelected,
  isHovered: isHoveredProp,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onPointerDown,
}: ArrowAnnotationProps) {
  const [localHovered, setLocalHovered] = React.useState(false);
  const isHovered = isHoveredProp ?? localHovered;

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onHoverEnd?.();
  };

  const { startPoint, endPoint, arrowHeadSize = 10, style } = annotation;
  const { stroke = '#000000', strokeWidth = 2 } = style || {};

  // Calculate arrow direction
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

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

  // State for dragging endpoints
  const [dragState, setDragState] = React.useState<{
    isDragging: boolean;
    pointType: 'start' | 'end' | null;
    startPos: { x: number; y: number } | null;
  }>({ isDragging: false, pointType: null, startPos: null });

  // Handle endpoint drag start
  const handlePointDown = (e: React.PointerEvent, type: 'start' | 'end') => {
    e.stopPropagation();
    e.preventDefault();
    setDragState({
      isDragging: true,
      pointType: type,
      startPos: { x: e.clientX, y: e.clientY }
    });
  };

  React.useEffect(() => {
    if (!dragState.isDragging || !dragState.startPos || !dragState.pointType) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      const dx = (e.clientX - dragState.startPos!.x) / scale;
      const dy = (e.clientY - dragState.startPos!.y) / scale;

      const newPoint = {
        x: (dragState.pointType === 'start' ? startPoint.x : endPoint.x) + dx,
        y: (dragState.pointType === 'start' ? startPoint.y : endPoint.y) + dy
      };

      onUpdate({
        [dragState.pointType === 'start' ? 'startPoint' : 'endPoint']: newPoint
      });

      // Update startPos for incremental calculation to avoid drift
      setDragState(prev => ({
        ...prev,
        startPos: { x: e.clientX, y: e.clientY }
      }));
    };

    const handleWindowPointerUp = () => {
      setDragState({ isDragging: false, pointType: null, startPos: null });
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [dragState, onUpdate, scale, startPoint, endPoint]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Allow clicking through empty space
      }}
    >
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        {/* Hit Area (Invisible thick line) */}
        <line
          x1={startPoint.x * scale}
          y1={startPoint.y * scale}
          x2={endPoint.x * scale}
          y2={endPoint.y * scale}
          stroke="rgba(255, 255, 255, 0.01)"
          strokeWidth={Math.max(30, strokeWidth * 4)}
          strokeLinecap="round"
          style={{ pointerEvents: 'stroke', cursor: isSelected ? 'move' : 'pointer' }}
          onPointerDown={onPointerDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        />

        {/* Hover indicator line */}
        {isHovered && !isSelected && (
          <line
            x1={startPoint.x * scale}
            y1={startPoint.y * scale}
            x2={endPoint.x * scale}
            y2={endPoint.y * scale}
            stroke="#93C5FD"
            strokeWidth={(strokeWidth + 6) * scale}
            strokeLinecap="round"
            strokeOpacity={0.5}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Selection Bounding Box (Interactive) */}
        {isSelected && (
          <rect
            x={Math.min(startPoint.x, endPoint.x) * scale - 10}
            y={Math.min(startPoint.y, endPoint.y) * scale - 10}
            width={Math.abs(endPoint.x - startPoint.x) * scale + 20}
            height={Math.abs(endPoint.y - startPoint.y) * scale + 20}
            fill="rgba(255, 255, 255, 0.01)" // Catch clicks inside the box
            stroke="#3B82F6"
            strokeWidth={1}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'all', cursor: 'move' }} // Enable dragging on the whole box area
            onPointerDown={onPointerDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          />
        )}

        {/* Visible Arrow line */}
        <line
          x1={startPoint.x * scale}
          y1={startPoint.y * scale}
          x2={endPoint.x * scale}
          y2={endPoint.y * scale}
          stroke={stroke}
          strokeWidth={strokeWidth * scale}
          strokeLinecap="round"
          strokeDasharray={style?.strokeDasharray ? style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
          style={{ pointerEvents: 'none' }}
        />

        {/* Arrow head (Always shown for arrows) */}
        {(annotation.type as string) !== 'line' && (
          <polygon
            points={`${endPoint.x * scale},${endPoint.y * scale} ${headPoint1.x * scale},${headPoint1.y * scale} ${headPoint2.x * scale},${headPoint2.y * scale}`}
            fill={stroke}
            style={{ pointerEvents: 'none' }}
          />
        )}
      </svg>

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Start point handle */}
          <div
            style={{
              position: 'absolute',
              left: startPoint.x * scale - 6,
              top: startPoint.y * scale - 6,
              width: 12,
              height: 12,
              backgroundColor: '#3B82F6',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'move',
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => handlePointDown(e, 'start')}
          />

          {/* End point handle */}
          <div
            style={{
              position: 'absolute',
              left: endPoint.x * scale - 6,
              top: endPoint.y * scale - 6,
              width: 12,
              height: 12,
              backgroundColor: '#3B82F6',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'move',
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => handlePointDown(e, 'end')}
          />
        </>
      )}
    </div>
  );
}
