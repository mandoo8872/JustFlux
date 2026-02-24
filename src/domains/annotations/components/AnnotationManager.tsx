/**
 * Annotation Manager - 주석 관리 컴포넌트
 * Refactored to use modular architecture (board6 style)
 */

import React, { useCallback, useRef } from 'react';
import { useAnnotationStore } from '../../../state/stores/AnnotationStore';
import { annotationService } from '../services/AnnotationService';
import { AnnotationLayer } from './AnnotationLayer';
import { useAnnotationInteraction } from '../hooks/useAnnotationInteraction';
import type { Annotation } from '../../../core/model/types';
import type { ToolType } from '../../../core/model/types';

interface AnnotationManagerProps {
  pageId: string;
  scale: number;
  activeTool: ToolType;
  onCreate: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<Annotation>) => void;
  onDelete: (id: string) => void;
}

export function AnnotationManager({
  pageId,
  scale,
  activeTool,
  onCreate,
  onUpdate,
  onDelete,
}: AnnotationManagerProps) {

  const { annotations, selection, clearSelection } = useAnnotationStore();
  const selectedAnnotationIds = selection.selectedAnnotationIds;
  const layerRef = useRef<HTMLDivElement>(null);

  // Hook manages drag state and pointer down events
  const { handlePointerDown, startDrag, draggedAnnotationId } = useAnnotationInteraction({
    scale,
    activeTool
  });

  // Filter annotations for current page
  const pageAnnotations = annotations.filter(annotation => annotation.pageId === pageId);

  // Canvas interaction (Creation & Clear Selection)
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {

    // If clicking on the background (ref matches target), clear selection
    if (activeTool === 'select') {
      if (e.target === layerRef.current) {
        clearSelection();
      }
      return;
    }

    // Creating new annotations (Drag to Create)
    if (['text', 'highlight', 'highlighter', 'rectangle', 'roundedRect', 'ellipse', 'arrow', 'line', 'star', 'heart', 'lightning', 'brush', 'eraser'].includes(activeTool)) {
      e.preventDefault();
      const rect = layerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const startX = (e.clientX - rect.left) / scale;
      const startY = (e.clientY - rect.top) / scale;

      let createdAnnotationId: string | null = null;

      // Start Dragging Logic
      const handleWindowMouseMove = (moveEvent: PointerEvent) => {
        const currentX = (moveEvent.clientX - rect.left) / scale;
        const currentY = (moveEvent.clientY - rect.top) / scale;

        // Calculate distance
        const dist = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));

        // Create annotation only if dragged enough (> 5px)
        if (!createdAnnotationId && dist > 5) {

          // Map brush tool to freehand type, highlighter stays as highlighter
          const annotationType = activeTool === 'brush' ? 'freehand' : activeTool;

          const initialProps = {
            // BBox is required by BaseAnnotation validation
            bbox: { x: startX, y: startY, width: 0, height: 0 },
            // For Arrow/Line/Lightning
            startPoint: { x: startX, y: startY },
            endPoint: { x: startX, y: startY },
            // For Freehand - initial point
            points: [{ x: startX, y: startY }]
          };

          const newAnnotation = annotationService.createAnnotation(annotationType, pageId, initialProps);
          if (newAnnotation) {
            onCreate(newAnnotation);
            createdAnnotationId = newAnnotation.id;
          }
        }

        // Update if created
        if (createdAnnotationId) {
          if (activeTool === 'arrow' || activeTool === 'line' || activeTool === 'lightning') {
            const minX = Math.min(startX, currentX);
            const minY = Math.min(startY, currentY);
            const newWidth = Math.abs(currentX - startX);
            const newHeight = Math.abs(currentY - startY);

            onUpdate(createdAnnotationId, {
              endPoint: { x: currentX, y: currentY },
              bbox: { x: minX, y: minY, width: newWidth, height: newHeight }
            });
          } else if (activeTool === 'brush' || activeTool === 'highlighter') {
            // For freehand: append points and update bbox
            const annotation = useAnnotationStore.getState().annotations.find(a => a.id === createdAnnotationId);
            if (annotation && 'points' in annotation) {
              const existingPoints = (annotation as any).points || [];
              const newPoints = [...existingPoints, { x: currentX, y: currentY }];

              // Calculate bounding box from all points
              const allPoints = [{ x: startX, y: startY }, ...newPoints];
              const minX = Math.min(...allPoints.map(p => p.x));
              const minY = Math.min(...allPoints.map(p => p.y));
              const maxX = Math.max(...allPoints.map(p => p.x));
              const maxY = Math.max(...allPoints.map(p => p.y));

              onUpdate(createdAnnotationId, {
                points: newPoints,
                bbox: { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
              });
            }
          } else {
            // Update BBox for Box-based shapes
            const width = Math.abs(currentX - startX);
            const height = Math.abs(currentY - startY);
            const newX = Math.min(startX, currentX);
            const newY = Math.min(startY, currentY);

            onUpdate(createdAnnotationId, {
              bbox: { x: newX, y: newY, width, height }
            });
          }
        }
      };

      const handleWindowMouseUp = () => {
        window.removeEventListener('pointermove', handleWindowMouseMove);
        window.removeEventListener('pointerup', handleWindowMouseUp);

        // Text tool: create immediately on click (no drag required)
        if (!createdAnnotationId && activeTool === 'text') {
          const newAnnotation = annotationService.createAnnotation('text', pageId, {
            bbox: { x: startX, y: startY, width: 200, height: 40 },
          });
          if (newAnnotation) {
            onCreate(newAnnotation);
            createdAnnotationId = newAnnotation.id;
          }
        }

        if (createdAnnotationId) {
          // If created, switch to select tool and select the new annotation
          const { setActiveTool, selectAnnotation } = useAnnotationStore.getState();
          setActiveTool('select');
          selectAnnotation(createdAnnotationId);
        }
      };

      window.addEventListener('pointermove', handleWindowMouseMove);
      window.addEventListener('pointerup', handleWindowMouseUp);
    }
  }, [activeTool, scale, pageId, onCreate, onUpdate, clearSelection]);

  // Global Key handler using window event to ensure capture
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationIds.length > 0) {
          // Ignore if user is typing in an input
          if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

          selectedAnnotationIds.forEach(id => onDelete(id));
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedAnnotationIds, onDelete]);

  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
        touchAction: 'none'
      }}
      onPointerDown={onCanvasPointerDown}
      // onKeyDown moved to window listener
      tabIndex={0}
    >
      {pageAnnotations.map((annotation) => (
        <React.Fragment key={annotation.id}>
          <AnnotationLayer
            annotation={annotation}
            scale={scale}
            isSelected={selectedAnnotationIds.includes(annotation.id)}
            isDragging={draggedAnnotationId === annotation.id}
            onSelect={() => { }}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onPointerDown={handlePointerDown}
            onDragStart={startDrag}
          />
        </React.Fragment>
      ))}
    </div>
  );
}
