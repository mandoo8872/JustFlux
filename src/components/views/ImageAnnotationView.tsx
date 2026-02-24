/**
 * ImageAnnotationView - 이미지 주석 렌더링 전용 컴포넌트
 * 순수 렌더링 로직만 담당, 외부 상태 접근 없음
 */

import React from 'react';
import type { ImageAnnotation } from '../../types/annotation';

interface ImageAnnotationViewProps {
  annotation: ImageAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ImageAnnotation>) => void;
  onDelete: (id: string) => void;
  onHover?: (id: string) => void;
  onHoverEnd?: (id: string) => void;
}

export function ImageAnnotationView({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onDelete,
  onHover,
  onHoverEnd
}: ImageAnnotationViewProps) {
  const handleClick = () => onSelect(annotation.id);
  const handleDoubleClick = () => onUpdate(annotation.id, { imageData: 'updated' });
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
        backgroundColor: isHovered ? 'rgba(255, 255, 0, 0.5)' : 'transparent',
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={annotation.imageData}
        alt="Annotation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}

