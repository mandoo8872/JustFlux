/**
 * ShapeAnnotationView - 도형 주석 렌더링 전용 컴포넌트
 * 순수 렌더링 로직만 담당, 외부 상태 접근 없음
 */

import React from 'react';
import type {
  EllipseAnnotation,
  RectangleAnnotation,
  ArrowAnnotation,
  StarAnnotation,
  HeartAnnotation,
  LightningAnnotation
} from '../../types/annotation';

type ShapeAnnotation =
  | EllipseAnnotation
  | RectangleAnnotation
  | ArrowAnnotation
  | StarAnnotation
  | HeartAnnotation
  | LightningAnnotation;

interface ShapeAnnotationViewProps {
  annotation: ShapeAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShapeAnnotation>) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
  onHoverEnd?: (id: string) => void;
}

export function ShapeAnnotationView({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onDelete,
  onHover,
  onHoverEnd
}: ShapeAnnotationViewProps) {
  const handleClick = () => onSelect(annotation.id);
  const handleDoubleClick = () => onUpdate(annotation.id, { style: { ...annotation.style, stroke: '#ff0000' } });
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(annotation.id);
  };
  const handleMouseEnter = () => onHover?.(annotation.id);
  const handleMouseLeave = () => onHoverEnd?.(annotation.id);

  const baseStyle = {
    position: 'absolute' as const,
    left: annotation.bbox.x * scale,
    top: annotation.bbox.y * scale,
    width: annotation.bbox.width * scale,
    height: annotation.bbox.height * scale,
    border: isSelected ? '2px solid #007bff' : '1px solid #000',
    backgroundColor: isHovered
      ? 'rgba(255, 255, 0, 0.5)'
      : annotation.style.fill || 'transparent',
    stroke: annotation.style.stroke || '#000',
    strokeWidth: annotation.style.strokeWidth || 1,
    pointerEvents: 'auto' as const,
    cursor: 'pointer' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div
      style={baseStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {annotation.type}
    </div>
  );
}

