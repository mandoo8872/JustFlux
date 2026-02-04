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
  onPointerDown?: (e: React.PointerEvent) => void;
  onDragStart?: (annotation: TextAnnotationType, startPos: { x: number; y: number }) => void;
  isDragging?: boolean;
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
  onPointerDown,
}: TextAnnotationProps) {
  const [isEditing, setIsEditing] = useState(false);
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

  // End editing when this annotation is no longer selected
  useEffect(() => {
    if (isEditing && !isSelected) {
      console.log('📝 [TextAnnotation] Annotation deselected, ending edit mode');
      setIsEditing(false);
    }
  }, [isEditing, isSelected]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    console.log('📝 [TextAnnotation] Double click, entering edit mode');

    // Always stop propagation to prevent AnnotationLayer from handling this event
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    // Enter edit mode
    setIsEditing(true);
  };

  const handleBlur = () => {
    console.log('📝 [TextAnnotation] Blur event, ending edit mode');
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

  const handleResize = (dWidth: number, dHeight: number, dX: number, dY: number) => {
    const dW_scaled = dWidth / scale;
    const dH_scaled = dHeight / scale;
    const dX_scaled = dX / scale;
    const dY_scaled = dY / scale;

    onUpdate({
      bbox: {
        x: bbox.x + dX_scaled,
        y: bbox.y + dY_scaled,
        width: Math.max(20 / scale, bbox.width + dW_scaled),
        height: Math.max(20 / scale, bbox.height + dH_scaled),
      },
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: isEditing ? 'text' : 'grab',
        pointerEvents: 'auto',
      }}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          onSelect();
        }
      }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Transparent hit area for reliable selection */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'transparent',
          pointerEvents: 'auto',
        }}
      />
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: annotation.style.backgroundColor || 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.15s ease-in-out',
          border: isSelected
            ? '2px solid #3B82F6'
            : isHovered
              ? '2px solid #93C5FD'
              : annotation.style.borderColor
                ? `1px solid ${annotation.style.borderColor}`
                : '1px solid transparent',
        }}
      />

      {/* Hover indicator */}
      {isHovered && !isSelected && (
        <div
          style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            right: '-2px',
            bottom: '-2px',
            border: '2px solid #93C5FD',
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {/* Content */}
      {isEditing ? (
        <textarea
          ref={textRef}
          defaultValue={annotation.content}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: annotation.style.fontFamily,
            fontSize: annotation.style.fontSize * scale,
            fontWeight: annotation.style.fontWeight,
            fontStyle: annotation.style.fontStyle || 'normal',
            color: annotation.style.color || '#000000',
            textAlign: annotation.style.textAlign,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '8px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: annotation.style.verticalAlign === 'top' ? 'flex-start'
              : annotation.style.verticalAlign === 'bottom' ? 'flex-end' : 'center',
            fontFamily: annotation.style.fontFamily,
            fontSize: annotation.style.fontSize * scale,
            fontWeight: annotation.style.fontWeight,
            fontStyle: annotation.style.fontStyle || 'normal',
            color: annotation.style.color || '#000000',
            opacity: annotation.style.opacity ?? 1,
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




