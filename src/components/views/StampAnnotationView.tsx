/**
 * StampAnnotationView - 스탬프 주석 렌더링 전용 컴포넌트
 * 순수 렌더링 로직만 담당, 외부 상태 접근 없음
 */

import React from 'react';
import type { StampAnnotation } from '../../types/annotation';

interface StampAnnotationViewProps {
  annotation: StampAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<StampAnnotation>) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
  onHoverEnd?: (id: string) => void;
}

export function StampAnnotationView({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onDelete,
  onHover,
  onHoverEnd
}: StampAnnotationViewProps) {
  const handleClick = () => onSelect(annotation.id);
  const handleDoubleClick = () => onUpdate(annotation.id, { stampType: 'approved' });
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(annotation.id);
  };
  const handleMouseEnter = () => onHover?.(annotation.id);
  const handleMouseLeave = () => onHoverEnd?.(annotation.id);

  const getStampColor = (stampType: string) => {
    switch (stampType) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: annotation.bbox.x * scale,
        top: annotation.bbox.y * scale,
        width: annotation.bbox.width * scale,
        height: annotation.bbox.height * scale,
        border: isSelected ? '2px solid #007bff' : '1px solid #000',
        backgroundColor: isHovered 
          ? 'rgba(255, 255, 0, 0.5)' 
          : annotation.style.fill || 'transparent',
        stroke: annotation.style.stroke || getStampColor(annotation.stampType),
        strokeWidth: annotation.style.strokeWidth || 2,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: getStampColor(annotation.stampType)
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {annotation.stampType.toUpperCase()}
    </div>
  );
}

