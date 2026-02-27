/**
 * ArrowAnnotation Component - 화살표/직선 주석 렌더링
 * Quadratic Bézier 커브 지원 (Figma UI3 스타일)
 *
 * controlPoint가 null/undefined이면 직선, 있으면 Q(Quadratic Bézier) 곡선
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

/** Calculate midpoint of a line segment */
function midPoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
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

  // Bézier control point (only for line type)
  const cp = (annotation as any).controlPoint as { x: number; y: number } | null | undefined;
  const hasCurve = cp != null;

  // Calculate arrow direction (use tangent at endpoint for curves)
  const arrowTangentEnd = hasCurve
    ? { x: endPoint.x - cp.x, y: endPoint.y - cp.y }
    : { x: endPoint.x - startPoint.x, y: endPoint.y - startPoint.y };
  const angle = Math.atan2(arrowTangentEnd.y, arrowTangentEnd.x);

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

  // Build SVG path string
  const buildLinePath = (s: number) => {
    const sx = startPoint.x * s;
    const sy = startPoint.y * s;
    const ex = endPoint.x * s;
    const ey = endPoint.y * s;

    if (hasCurve) {
      const cx = cp.x * s;
      const cy = cp.y * s;
      return `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`;
    }
    return `M ${sx} ${sy} L ${ex} ${ey}`;
  };

  // State for dragging endpoints
  const [dragState, setDragState] = React.useState<{
    isDragging: boolean;
    pointType: 'start' | 'end' | 'control' | null;
    startPos: { x: number; y: number } | null;
  }>({ isDragging: false, pointType: null, startPos: null });

  // Handle endpoint drag start
  const handlePointDown = (e: React.PointerEvent, type: 'start' | 'end' | 'control') => {
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

      if (dragState.pointType === 'control') {
        const currentCp = (annotation as any).controlPoint;
        const base = currentCp || midPoint(startPoint, endPoint);
        onUpdate({
          controlPoint: { x: base.x + dx, y: base.y + dy }
        } as any);
      } else {
        const currentPoint = dragState.pointType === 'start' ? startPoint : endPoint;
        const newPoint = {
          x: currentPoint.x + dx,
          y: currentPoint.y + dy
        };
        onUpdate({
          [dragState.pointType === 'start' ? 'startPoint' : 'endPoint']: newPoint
        });
      }

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
  }, [dragState, onUpdate, scale, startPoint, endPoint, annotation]);

  // Double-click on control handle → reset to straight line
  const handleControlDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onUpdate({ controlPoint: null } as any);
  };

  // Midpoint for the control handle initial position
  const controlDisplayPoint = hasCurve ? cp : midPoint(startPoint, endPoint);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
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
        {/* Hit Area (Invisible thick path) */}
        <path
          d={buildLinePath(scale)}
          fill="none"
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

        {/* Hover indicator */}
        {isHovered && !isSelected && (
          <path
            d={buildLinePath(scale)}
            fill="none"
            stroke="#93C5FD"
            strokeWidth={(strokeWidth + 6) * scale}
            strokeLinecap="round"
            strokeOpacity={0.5}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Selection Bounding Box */}
        {isSelected && (
          <rect
            x={Math.min(startPoint.x, endPoint.x, hasCurve ? cp.x : Infinity) * scale - 10}
            y={Math.min(startPoint.y, endPoint.y, hasCurve ? cp.y : Infinity) * scale - 10}
            width={(Math.max(startPoint.x, endPoint.x, hasCurve ? cp.x : -Infinity) - Math.min(startPoint.x, endPoint.x, hasCurve ? cp.x : Infinity)) * scale + 20}
            height={(Math.max(startPoint.y, endPoint.y, hasCurve ? cp.y : -Infinity) - Math.min(startPoint.y, endPoint.y, hasCurve ? cp.y : Infinity)) * scale + 20}
            fill="rgba(255, 255, 255, 0.01)"
            stroke="#3B82F6"
            strokeWidth={1}
            strokeDasharray="4 2"
            style={{ pointerEvents: 'all', cursor: 'move' }}
            onPointerDown={onPointerDown}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          />
        )}

        {/* Visible line/curve */}
        <path
          d={buildLinePath(scale)}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth * scale}
          strokeLinecap="round"
          strokeDasharray={style?.strokeDasharray ? style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
          style={{ pointerEvents: 'none' }}
        />

        {/* Arrow head (for arrow type only) */}
        {(annotation.type as string) !== 'line' && (
          <polygon
            points={`${endPoint.x * scale},${endPoint.y * scale} ${headPoint1.x * scale},${headPoint1.y * scale} ${headPoint2.x * scale},${headPoint2.y * scale}`}
            fill={stroke}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Control point guide lines (when curve is active and selected) */}
        {isSelected && hasCurve && (
          <>
            <line
              x1={startPoint.x * scale} y1={startPoint.y * scale}
              x2={cp.x * scale} y2={cp.y * scale}
              stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3"
              style={{ pointerEvents: 'none' }}
            />
            <line
              x1={cp.x * scale} y1={cp.y * scale}
              x2={endPoint.x * scale} y2={endPoint.y * scale}
              stroke="#94A3B8" strokeWidth={1} strokeDasharray="3 3"
              style={{ pointerEvents: 'none' }}
            />
          </>
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

          {/* Curve control handle (midpoint — drag to create/modify curve) */}
          <div
            style={{
              position: 'absolute',
              left: controlDisplayPoint.x * scale - 5,
              top: controlDisplayPoint.y * scale - 5,
              width: 10,
              height: 10,
              backgroundColor: hasCurve ? '#F97316' : '#94A3B8',
              border: '2px solid white',
              borderRadius: '2px',
              cursor: 'move',
              pointerEvents: 'auto',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              transition: 'background-color 0.15s',
            }}
            onPointerDown={(e) => {
              // If no curve yet, initialize controlPoint to midpoint before dragging
              if (!hasCurve) {
                onUpdate({ controlPoint: midPoint(startPoint, endPoint) } as any);
              }
              handlePointDown(e, 'control');
            }}
            onDoubleClick={handleControlDoubleClick}
            title={hasCurve ? '더블클릭으로 직선 복귀' : '드래그하여 커브 생성'}
          />
        </>
      )}
    </div>
  );
}
