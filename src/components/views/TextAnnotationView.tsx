/**
 * TextAnnotationView - 텍스트 주석 렌더링 전용 컴포넌트
 * 순수 렌더링 로직만 담당, 외부 상태 접근 없음
 */

import React from 'react';
import type { TextAnnotation } from '../../types/annotation';

interface TextAnnotationViewProps {
  annotation: TextAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextAnnotation>) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
  onHoverEnd?: (id: string) => void;
}

export function TextAnnotationView({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onDelete,
  onHover,
  onHoverEnd
}: TextAnnotationViewProps) {
  const handleClick = () => onSelect(annotation.id);
  const handleDoubleClick = () => onUpdate(annotation.id, { content: '수정됨' });
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(annotation.id);
  };
  const handleMouseEnter = () => onHover?.(annotation.id);
  const handleMouseLeave = () => onHoverEnd?.(annotation.id);

  return (
    <div
      style={{
        position: 'absolute',
        left: annotation.bbox.x * scale,
        top: annotation.bbox.y * scale,
        width: annotation.bbox.width * scale,
        height: annotation.bbox.height * scale,
        border: isSelected ? '2px solid #007bff' : '1px solid #000',
        backgroundColor: isHovered ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 0, 0.3)',
        pointerEvents: 'auto',
        cursor: 'pointer',
        fontSize: annotation.style.fontSize,
        fontFamily: annotation.style.fontFamily,
        color: annotation.style.stroke || '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: annotation.style.textAlign || 'center'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {annotation.content}
    </div>
  );
}

