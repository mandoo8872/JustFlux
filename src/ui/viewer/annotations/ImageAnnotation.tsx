/**
 * ImageAnnotation Component - 이미지 주석 렌더링
 */

import type { ImageAnnotation } from '../../../core/model/types';
import { ResizeHandles } from './ResizeHandles';

interface ImageAnnotationProps {
  annotation: ImageAnnotation;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<ImageAnnotation>) => void;
  onDelete: () => void;
  onHover: () => void;
  onHoverEnd: () => void;
  onDragStart?: (annotation: ImageAnnotation, startPos: { x: number; y: number }) => void;
}

export function ImageAnnotationComponent({
  annotation,
  isSelected,
  isHovered,
  scale,
  onSelect,
  onUpdate,
  onHover,
  onHoverEnd,
  onDragStart,
}: ImageAnnotationProps) {

  const handleMouseEnter = () => {
    onHover();
  };

  const handleMouseLeave = () => {
    onHoverEnd();
  };

  const handleResize = (dWidth: number, dHeight: number, dX: number, dY: number) => {
    const dW_scaled = dWidth / scale;
    const dH_scaled = dHeight / scale;
    const dX_scaled = dX / scale;
    const dY_scaled = dY / scale;

    // Check if aspect ratio lock is enabled (default: true)
    const lockAspect = annotation.style?.lockAspectRatio !== false;

    let newWidth = Math.max(10 / scale, annotation.bbox.width + dW_scaled);
    let newHeight = Math.max(10 / scale, annotation.bbox.height + dH_scaled);
    let adjustedDX = dX_scaled;
    let adjustedDY = dY_scaled;

    if (lockAspect && annotation.originalWidth && annotation.originalHeight) {
      // Calculate original aspect ratio
      const aspectRatio = annotation.originalWidth / annotation.originalHeight;

      // Determine which dimension changed more and adjust the other
      if (Math.abs(dW_scaled) > Math.abs(dH_scaled)) {
        // Width changed more, adjust height
        newHeight = newWidth / aspectRatio;
        // Adjust dY if resizing from top
        if (dY_scaled !== 0) {
          adjustedDY = dY_scaled - (newHeight - annotation.bbox.height - dH_scaled);
        }
      } else {
        // Height changed more, adjust width
        newWidth = newHeight * aspectRatio;
        // Adjust dX if resizing from left
        if (dX_scaled !== 0) {
          adjustedDX = dX_scaled - (newWidth - annotation.bbox.width - dW_scaled);
        }
      }
    }

    onUpdate({
      bbox: {
        x: annotation.bbox.x + adjustedDX,
        y: annotation.bbox.y + adjustedDY,
        width: newWidth,
        height: newHeight,
      },
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: annotation.bbox.x * scale,
        top: annotation.bbox.y * scale,
        width: annotation.bbox.width * scale,
        height: annotation.bbox.height * scale,
        cursor: isSelected ? 'grab' : 'pointer',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();

        // Select the annotation
        onSelect();

        // Start dragging
        if (onDragStart) {
          onDragStart(annotation, { x: e.clientX, y: e.clientY });
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={annotation.imageData}
        alt="Annotation"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          opacity: annotation.style?.opacity ?? 1,
          border: isSelected
            ? '2px solid #3B82F6'
            : isHovered
              ? '2px solid #93C5FD'
              : '1px solid transparent',
          borderRadius: '4px',
          transition: 'border-color 0.2s ease, opacity 0.2s ease',
        }}
        draggable={false}
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
            border: '2px dashed #93C5FD',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}

      {isSelected && (
        <ResizeHandles
          width={annotation.bbox.width * scale}
          height={annotation.bbox.height * scale}
          onResize={handleResize}
        />
      )}
    </div>
  );
}
