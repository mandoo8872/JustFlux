/**
 * ShapeAnnotation Component - 도형 주석 (Rect, RoundedRect, Ellipse)
 * Ellipse: Figma UI3 스타일 arc/donut 편집 핸들 지원
 */

import React, { useState, useRef, useCallback } from 'react';
import type { RectangleAnnotation, EllipseAnnotation, RoundedRectAnnotation } from '../../../types/annotation';
import { ResizeHandles } from './ResizeHandles';
import { EllipseArcHandles } from './EllipseArcHandles';

type ShapeAnnotationType = RectangleAnnotation | RoundedRectAnnotation | EllipseAnnotation;

interface ShapeAnnotationProps {
  annotation: ShapeAnnotationType;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ShapeAnnotationType>) => void;
  onDelete: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

// ── SVG Arc Path Builder ──

function degToRad(deg: number): number {
  return (deg - 90) * (Math.PI / 180);
}

function polarToCartesian(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
  const rad = degToRad(angleDeg);
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

/** Build SVG path for arc/donut shape */
function buildArcPath(
  cx: number, cy: number,
  rx: number, ry: number,
  startAngle: number, sweepAngle: number,
  innerRatio: number
): string {
  const endAngle = startAngle + sweepAngle;
  const largeArc = sweepAngle > 180 ? 1 : 0;

  const outerStart = polarToCartesian(cx, cy, rx, ry, startAngle);
  const outerEnd = polarToCartesian(cx, cy, rx, ry, endAngle);

  if (innerRatio <= 0) {
    // Pie slice (no inner hole)
    if (sweepAngle >= 359.99) {
      const mid = polarToCartesian(cx, cy, rx, ry, startAngle + 180);
      return [
        `M ${outerStart.x} ${outerStart.y}`,
        `A ${rx} ${ry} 0 1 1 ${mid.x} ${mid.y}`,
        `A ${rx} ${ry} 0 1 1 ${outerStart.x} ${outerStart.y}`,
        'Z'
      ].join(' ');
    }
    return [
      `M ${cx} ${cy}`,
      `L ${outerStart.x} ${outerStart.y}`,
      `A ${rx} ${ry} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      'Z'
    ].join(' ');
  }

  // Donut / ring arc
  const irx = rx * innerRatio;
  const iry = ry * innerRatio;
  const innerStart = polarToCartesian(cx, cy, irx, iry, startAngle);
  const innerEnd = polarToCartesian(cx, cy, irx, iry, endAngle);

  if (sweepAngle >= 359.99) {
    const outerMid = polarToCartesian(cx, cy, rx, ry, startAngle + 180);
    const innerMid = polarToCartesian(cx, cy, irx, iry, startAngle + 180);
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${rx} ${ry} 0 1 1 ${outerMid.x} ${outerMid.y}`,
      `A ${rx} ${ry} 0 1 1 ${outerStart.x} ${outerStart.y}`,
      `M ${innerStart.x} ${innerStart.y}`,
      `A ${irx} ${iry} 0 1 0 ${innerMid.x} ${innerMid.y}`,
      `A ${irx} ${iry} 0 1 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
  }

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rx} ${ry} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${irx} ${iry} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}

export function ShapeAnnotationComponent({
  annotation,
  isSelected,
  isHovered: isHoveredProp,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onPointerDown,
}: ShapeAnnotationProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const [isDraggingCorner, setIsDraggingCorner] = useState(false);
  const isHovered = isHoveredProp ?? localHovered;
  const cornerStartRef = useRef<{ x: number; radius: number } | null>(null);

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const handleMouseEnter = () => {
    setLocalHovered(true);
    onHover?.();
  };

  const handleMouseLeave = () => {
    setLocalHovered(false);
    onHoverEnd?.();
  };

  const handleResize = (dWidth: number, dHeight: number, dX: number, dY: number) => {
    const dW_scaled = dWidth / scale;
    const dH_scaled = dHeight / scale;
    const dX_scaled = dX / scale;
    const dY_scaled = dY / scale;

    onUpdate({
      bbox: {
        x: bbox.x + dX_scaled,
        y: bbox.y + dY_scaled,
        width: Math.max(10 / scale, bbox.width + dW_scaled),
        height: Math.max(10 / scale, bbox.height + dH_scaled),
      },
    });
  };

  // Corner radius handle for rounded rectangles
  const handleCornerPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingCorner(true);

    const currentRadius = (annotation as RoundedRectAnnotation).cornerRadius || 0;
    cornerStartRef.current = { x: e.clientX, radius: currentRadius };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!cornerStartRef.current) return;
      const deltaX = (moveEvent.clientX - cornerStartRef.current.x) / scale;
      const maxRadius = Math.min(bbox.width, bbox.height) / 2;
      const newRadius = Math.max(0, Math.min(maxRadius, cornerStartRef.current.radius + deltaX));
      onUpdate({ cornerRadius: newRadius } as Partial<RoundedRectAnnotation>);
    };

    const handlePointerUp = () => {
      setIsDraggingCorner(false);
      cornerStartRef.current = null;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [annotation, bbox.width, bbox.height, scale, onUpdate]);

  const isEllipse = annotation.type === 'ellipse';
  const isRoundedRect = annotation.type === 'roundedRect';
  const strokeWidth = (annotation.style?.strokeWidth || 1) * scale;

  const cornerRadius = (annotation as RoundedRectAnnotation).cornerRadius || 0;
  const scaledCornerRadius = cornerRadius * scale;
  const cornerHandleX = scaledCornerRadius + 10;
  const cornerHandleY = 10;

  // ── Ellipse arc properties ──
  const ellipseAnn = annotation as EllipseAnnotation;
  const startAngle = ellipseAnn.startAngle ?? 0;
  const sweepAngle = ellipseAnn.sweepAngle ?? 360;
  const innerRadiusRatio = ellipseAnn.innerRadiusRatio ?? 0;
  const isArc = isEllipse && (sweepAngle < 360 || innerRadiusRatio > 0);

  const sCx = scaledBBox.width / 2;
  const sCy = scaledBBox.height / 2;
  const sRx = Math.max(0, scaledBBox.width / 2 - strokeWidth / 2);
  const sRy = Math.max(0, scaledBBox.height / 2 - strokeWidth / 2);

  const handleArcUpdate = useCallback((updates: {
    startAngle?: number;
    sweepAngle?: number;
    innerRadiusRatio?: number;
  }) => {
    onUpdate(updates as Partial<EllipseAnnotation>);
  }, [onUpdate]);

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* SVG Shape */}
      <svg
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', overflow: 'visible',
        }}
      >
        {isEllipse ? (
          isArc ? (
            <path
              d={buildArcPath(sCx, sCy, sRx, sRy, startAngle, sweepAngle, innerRadiusRatio)}
              fill={annotation.style?.fill || 'transparent'}
              fillOpacity={annotation.style?.opacity ?? 1}
              stroke={annotation.style?.stroke || '#000000'}
              strokeWidth={strokeWidth}
              fillRule="evenodd"
            />
          ) : (
            <ellipse
              cx={sCx} cy={sCy} rx={sRx} ry={sRy}
              fill={annotation.style?.fill || 'transparent'}
              fillOpacity={annotation.style?.opacity ?? 1}
              stroke={annotation.style?.stroke || '#000000'}
              strokeWidth={strokeWidth}
              strokeDasharray={annotation.style?.strokeDasharray ? annotation.style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
            />
          )
        ) : (
          <rect
            x={strokeWidth / 2} y={strokeWidth / 2}
            width={Math.max(0, scaledBBox.width - strokeWidth)}
            height={Math.max(0, scaledBBox.height - strokeWidth)}
            rx={scaledCornerRadius} ry={scaledCornerRadius}
            fill={annotation.style?.fill || 'transparent'}
            fillOpacity={annotation.style?.opacity ?? 1}
            stroke={annotation.style?.stroke || '#000000'}
            strokeWidth={strokeWidth}
            strokeDasharray={annotation.style?.strokeDasharray ? annotation.style.strokeDasharray.split(' ').map(v => String(parseFloat(v) * scale)).join(' ') : undefined}
          />
        )}
      </svg>

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div style={{
          position: 'absolute', inset: '-3px',
          border: '2px dashed #93C5FD',
          borderRadius: isEllipse ? '50%' : `${scaledCornerRadius + 3}px`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.3)',
          borderRadius: isEllipse ? '50%' : `${scaledCornerRadius}px`,
          pointerEvents: 'none',
        }} />
      )}

      {/* Resize handles */}
      {isSelected && (
        <ResizeHandles width={scaledBBox.width} height={scaledBBox.height} onResize={handleResize} />
      )}

      {/* Ellipse Arc Handles (Figma UI3) */}
      {isSelected && isEllipse && (
        <EllipseArcHandles
          cx={sCx} cy={sCy} rx={sRx} ry={sRy}
          startAngle={startAngle}
          sweepAngle={sweepAngle}
          innerRadiusRatio={innerRadiusRatio}
          scale={scale}
          onUpdate={handleArcUpdate}
        />
      )}

      {/* Corner radius handle */}
      {isSelected && isRoundedRect && (
        <div
          onPointerDown={handleCornerPointerDown}
          style={{
            position: 'absolute',
            left: cornerHandleX - 5, top: cornerHandleY - 5,
            width: 10, height: 10,
            backgroundColor: isDraggingCorner ? '#F97316' : '#FBBF24',
            border: '2px solid white', borderRadius: '2px',
            cursor: 'ew-resize',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            zIndex: 100, pointerEvents: 'auto',
          }}
          title={`모서리 반경: ${Math.round(cornerRadius)}px (드래그로 조정)`}
        />
      )}
    </div>
  );
}
