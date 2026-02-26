/**
 * StarAnnotation Component - 별 모양 주석
 * Figma UI3 스타일: 내부 반지름 핸들 + 꼭짓점 수 핸들
 */

import React, { useState, useCallback, useRef } from 'react';
import type { StarAnnotation as StarAnnotationType } from '../../../types/annotation';
import { ResizeHandles } from './ResizeHandles';

interface StarAnnotationProps {
  annotation: StarAnnotationType;
  isSelected: boolean;
  isHovered?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<StarAnnotationType>) => void;
  onDelete: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function StarAnnotationComponent({
  annotation,
  isSelected,
  isHovered: isHoveredProp,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onPointerDown,
}: StarAnnotationProps) {
  const [localHovered, setLocalHovered] = useState(false);
  const [activeHandle, setActiveHandle] = useState<'inner' | 'points' | null>(null);
  const isHovered = isHoveredProp ?? localHovered;
  const dragInitRef = useRef<{ value: number; mouseY: number; mouseAngle: number }>({ value: 0, mouseY: 0, mouseAngle: 0 });

  const { bbox, style } = annotation;
  const numPoints = annotation.numPoints ?? ((annotation as any).points as number) ?? 5;
  const innerRadius = annotation.innerRadius ?? 0.4;
  const strokeWidth = (style?.strokeWidth || 1) * scale;

  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  const centerX = scaledBBox.width / 2;
  const centerY = scaledBBox.height / 2;
  const outerR = Math.min(scaledBBox.width, scaledBBox.height) / 2 - strokeWidth;
  const innerR = outerR * innerRadius;

  // Generate star SVG path
  const generateStarPath = useCallback(() => {
    const n = numPoints;
    const angleStep = (Math.PI * 2) / n;
    const parts: string[] = [];

    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = i * angleStep / 2 - Math.PI / 2;
      const x = centerX + r * Math.cos(angle);
      const y = centerY + r * Math.sin(angle);
      parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    parts.push('Z');
    return parts.join(' ');
  }, [numPoints, outerR, innerR, centerX, centerY]);

  // Resize handler
  const handleResize = useCallback((dWidth: number, dHeight: number, dX: number, dY: number) => {
    onUpdate({
      bbox: {
        x: bbox.x + dX / scale,
        y: bbox.y + dY / scale,
        width: Math.max(20 / scale, bbox.width + dWidth / scale),
        height: Math.max(20 / scale, bbox.height + dHeight / scale),
      },
    });
  }, [bbox, scale, onUpdate]);

  // Inner radius handle drag
  const handleInnerRadiusDrag = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle('inner');

    const parentRect = (e.currentTarget as HTMLElement).closest('div')?.getBoundingClientRect();
    if (!parentRect) return;

    const handleMove = (moveEvent: PointerEvent) => {
      const localX = moveEvent.clientX - parentRect.left;
      const localY = moveEvent.clientY - parentRect.top;
      const dist = Math.sqrt((localX - centerX) ** 2 + (localY - centerY) ** 2);
      const maxR = Math.min(scaledBBox.width, scaledBBox.height) / 2 - strokeWidth;
      const ratio = Math.max(0.1, Math.min(0.9, dist / maxR));
      onUpdate({ innerRadius: Math.round(ratio * 100) / 100 });
    };

    const handleUp = () => {
      setActiveHandle(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [centerX, centerY, scaledBBox.width, scaledBBox.height, strokeWidth, onUpdate]);

  // Point count handle drag (vertical drag changes count)
  const handlePointCountDrag = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveHandle('points');

    dragInitRef.current = { value: numPoints, mouseY: e.clientY, mouseAngle: 0 };

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaY = dragInitRef.current.mouseY - moveEvent.clientY;
      const steps = Math.round(deltaY / 20); // Every 20px = 1 point
      const newCount = Math.max(3, Math.min(12, dragInitRef.current.value + steps));
      onUpdate({ numPoints: newCount });
    };

    const handleUp = () => {
      setActiveHandle(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }, [numPoints, onUpdate]);

  // Handle positions
  // Inner radius handle: at the first inner vertex position
  const innerAngle = (Math.PI * 2) / numPoints / 2 - Math.PI / 2;
  const innerHandleX = centerX + innerR * Math.cos(innerAngle);
  const innerHandleY = centerY + innerR * Math.sin(innerAngle);

  // Point count handle: at the top outer vertex
  const topHandleX = centerX;
  const topHandleY = centerY - outerR;

  const handleMouseEnter = () => { setLocalHovered(true); onHover?.(); };
  const handleMouseLeave = () => { setLocalHovered(false); onHoverEnd?.(); };

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
      {/* Star shape */}
      <svg
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', overflow: 'visible',
        }}
      >
        <path
          d={generateStarPath()}
          fill={style?.fill || 'transparent'}
          fillOpacity={style?.opacity ?? 1}
          stroke={style?.stroke || '#000000'}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      </svg>

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div style={{
          position: 'absolute', inset: '-3px',
          border: '2px dashed #93C5FD',
          pointerEvents: 'none',
        }} />
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: '0 0 0 2px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.3)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Resize handles */}
      {isSelected && (
        <ResizeHandles
          width={scaledBBox.width}
          height={scaledBBox.height}
          onResize={handleResize}
        />
      )}

      {/* Figma UI3 Handles */}
      {isSelected && (
        <svg
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            overflow: 'visible', pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          {/* Guide line from center to inner handle */}
          <line
            x1={centerX} y1={centerY}
            x2={innerHandleX} y2={innerHandleY}
            stroke="#F97316" strokeWidth={1} strokeDasharray="3 2"
            style={{ pointerEvents: 'none' }}
          />

          {/* Inner Radius Handle (orange) */}
          <circle
            cx={innerHandleX}
            cy={innerHandleY}
            r={5}
            fill={activeHandle === 'inner' ? '#EA580C' : '#F97316'}
            stroke="white" strokeWidth={2}
            style={{
              pointerEvents: 'auto', cursor: 'pointer',
              filter: activeHandle === 'inner'
                ? 'drop-shadow(0 0 4px rgba(249, 115, 22, 0.8))'
                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
            onPointerDown={handleInnerRadiusDrag}
          >
            <title>내부 반지름: {Math.round(innerRadius * 100)}% (드래그로 조절)</title>
          </circle>

          {/* Point Count Handle (green) - at top vertex */}
          <circle
            cx={topHandleX}
            cy={topHandleY}
            r={5}
            fill={activeHandle === 'points' ? '#15803D' : '#22C55E'}
            stroke="white" strokeWidth={2}
            style={{
              pointerEvents: 'auto', cursor: 'ns-resize',
              filter: activeHandle === 'points'
                ? 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.8))'
                : 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
            }}
            onPointerDown={handlePointCountDrag}
          >
            <title>꼭짓점: {numPoints}개 (위아래 드래그로 3~12개 조절)</title>
          </circle>

          {/* Point count label */}
          <text
            x={topHandleX + 12}
            y={topHandleY + 4}
            fontSize={11}
            fontWeight={600}
            fill="#22C55E"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {numPoints}
          </text>
        </svg>
      )}
    </div>
  );
}
