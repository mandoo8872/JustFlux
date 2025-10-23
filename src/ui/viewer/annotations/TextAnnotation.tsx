/**
 * TextAnnotation Component - 텍스트 주석
 */

import { useState, useRef, useEffect } from 'react';
import type { TextAnnotation as TextAnnotationType } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface TextAnnotationProps {
  annotation: TextAnnotationType;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextAnnotationType>) => void;
  onDelete: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
}

export function TextAnnotationComponent({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
}: TextAnnotationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const bbox = annotation.bbox;
  const scaledBBox = {
    x: bbox.x * scale,
    y: bbox.y * scale,
    width: bbox.width * scale,
    height: bbox.height * scale,
  };

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (textRef.current) {
      onUpdate({ content: textRef.current.value });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    e.stopPropagation();
    onSelect();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });
  };

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;

      onUpdate({
        bbox: {
          ...bbox,
          x: bbox.x + dx,
          y: bbox.y + dy,
        },
      });

      setDragStart({
        x: e.clientX,
        y: e.clientY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, scale, bbox, onUpdate]);

  const handleResize = (newWidth: number, newHeight: number) => {
    onUpdate({
      bbox: {
        ...bbox,
        width: newWidth / scale,
        height: newHeight / scale,
      },
    });
  };

  return (
    <div
      className={`absolute group ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Background */}
      <div
        className={`absolute inset-0 bg-white/90 backdrop-blur-sm rounded shadow-sm transition-all ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : 
          isHovered ? 'ring-1 ring-blue-300' : ''
        }`}
      />

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textRef}
          defaultValue={annotation.content}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="absolute inset-0 w-full h-full p-2 bg-transparent border-none outline-none resize-none"
          style={{
            fontFamily: annotation.style.fontFamily,
            fontSize: annotation.style.fontSize * scale,
            fontWeight: annotation.style.fontWeight,
            color: annotation.style.stroke,
            textAlign: annotation.style.textAlign,
          }}
        />
      ) : (
        <div
          className="absolute inset-0 p-2 overflow-hidden"
          style={{
            fontFamily: annotation.style.fontFamily,
            fontSize: annotation.style.fontSize * scale,
            fontWeight: annotation.style.fontWeight,
            color: annotation.style.stroke,
            textAlign: annotation.style.textAlign,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {annotation.content}
        </div>
      )}

      {/* Resize handles */}
      {isSelected && !isEditing && (
        <ResizeHandles
          width={scaledBBox.width}
          height={scaledBBox.height}
          onResize={handleResize}
        />
      )}
    </div>
  );
}




