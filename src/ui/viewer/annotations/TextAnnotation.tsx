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
  onDragStart,
  isDragging = false,
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

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('📝 [TextAnnotation] Mouse down, isEditing:', isEditing, 'isDragging:', isDragging);

    // Always stop propagation to prevent AnnotationLayer from handling this event
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();

    if (isEditing) {
      // If editing, don't handle selection or dragging
      return;
    }

    // If already dragging, don't handle new events
    if (isDragging) {
      return;
    }

    // Select the annotation immediately
    console.log('📝 [TextAnnotation] Selecting annotation:', annotation.id);
    onSelect();

    // Start dragging using AnnotationLayer's drag system
    if (onDragStart) {
      console.log('📝 [TextAnnotation] Starting drag for annotation:', annotation.id);
      onDragStart(annotation, { x: e.clientX, y: e.clientY });
    }
  };

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
      style={{
        position: 'absolute',
        left: scaledBBox.x,
        top: scaledBBox.y,
        width: scaledBBox.width,
        height: scaledBBox.height,
        cursor: isEditing ? 'text' : 'grab',
        zIndex: isSelected ? 50 : 20,
      }}
      onMouseDown={handleMouseDown}
      onMouseDownCapture={(e) => {
        console.log('📝 [TextAnnotation] Mouse down capture, stopping propagation');
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        return false; // Additional event blocking
      }}
      onMouseUpCapture={(e) => {
        console.log('📝 [TextAnnotation] Mouse up capture, stopping propagation');
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        return false; // Additional event blocking
      }}
      onMouseMoveCapture={(e) => {
        // Block mouse move events during interaction
        if (isDragging) {
          e.stopPropagation();
          e.preventDefault();
          e.nativeEvent.stopImmediatePropagation();
          return false;
        }
      }}
      onClickCapture={(e) => {
        console.log('📝 [TextAnnotation] Click capture, stopping propagation');
        e.stopPropagation();
        e.preventDefault();
        e.nativeEvent.stopImmediatePropagation();
        return false;
      }}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {/* Background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          borderRadius: '4px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.15s ease-in-out',
          border: isSelected
            ? '2px solid #3B82F6'
            : isHovered
              ? '2px solid #93C5FD'
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
            color: annotation.style.stroke,
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




