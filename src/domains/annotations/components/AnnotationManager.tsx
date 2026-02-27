/**
 * Annotation Manager - 주석 관리 컴포넌트
 * Refactored to use modular architecture (board6 style)
 */

import React, { useCallback, useRef, useEffect } from 'react';
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
  const autoSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hook manages drag state and pointer down events
  const { handlePointerDown, startDrag, draggedAnnotationId } = useAnnotationInteraction({
    scale,
    activeTool
  });

  // Filter annotations for current page
  const pageAnnotations = annotations.filter(annotation => annotation.pageId === pageId);

  // Marquee selection state
  const [marquee, setMarquee] = React.useState<{
    startX: number; startY: number; currentX: number; currentY: number;
  } | null>(null);

  // Canvas interaction (Creation & Clear Selection)
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {

    // Select tool: marquee drag or clear selection
    if (activeTool === 'select') {
      if (e.target === layerRef.current) {
        e.preventDefault();
        const rect = layerRef.current?.getBoundingClientRect();
        if (!rect) {
          if (!(e.ctrlKey || e.metaKey)) clearSelection();
          return;
        }

        const startX = (e.clientX - rect.left) / scale;
        const startY = (e.clientY - rect.top) / scale;

        setMarquee({ startX, startY, currentX: startX, currentY: startY });
        if (!(e.ctrlKey || e.metaKey)) {
          clearSelection();
        }

        const handleMarqueeMove = (moveEvent: PointerEvent) => {
          const cx = (moveEvent.clientX - rect.left) / scale;
          const cy = (moveEvent.clientY - rect.top) / scale;
          setMarquee(prev => prev ? { ...prev, currentX: cx, currentY: cy } : null);
        };

        const handleMarqueeUp = (upEvent: PointerEvent) => {
          window.removeEventListener('pointermove', handleMarqueeMove);
          window.removeEventListener('pointerup', handleMarqueeUp);

          const endX = (upEvent.clientX - rect.left) / scale;
          const endY = (upEvent.clientY - rect.top) / scale;

          const minX = Math.min(startX, endX);
          const minY = Math.min(startY, endY);
          const maxX = Math.max(startX, endX);
          const maxY = Math.max(startY, endY);
          const w = maxX - minX;
          const h = maxY - minY;

          // Only select if dragged enough (> 5px)
          if (w > 5 || h > 5) {
            const { selectAnnotations } = useAnnotationStore.getState();
            const insideIds = pageAnnotations
              .filter(a => {
                const b = a.bbox;
                if (!b) return false;
                return b.x >= minX && b.y >= minY &&
                  b.x + b.width <= maxX && b.y + b.height <= maxY;
              })
              .map(a => a.id);

            if (insideIds.length > 0) {
              selectAnnotations(insideIds);
            }
          }

          setMarquee(null);
        };

        window.addEventListener('pointermove', handleMarqueeMove);
        window.addEventListener('pointerup', handleMarqueeUp);
      }
      return;
    }

    // Creating new annotations (Drag to Create)
    if (['text', 'highlight', 'highlighter', 'rectangle', 'roundedRect', 'ellipse', 'arrow', 'line', 'star', 'brush', 'eraser'].includes(activeTool)) {
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
            let width = Math.abs(currentX - startX);
            let height = Math.abs(currentY - startY);

            // Shift key: constrain to 1:1 ratio (perfect square/circle)
            if (moveEvent.shiftKey) {
              const maxSide = Math.max(width, height);
              width = maxSide;
              height = maxSide;
            }

            const newX = currentX >= startX ? startX : startX - width;
            const newY = currentY >= startY ? startY : startY - height;

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
          const { setActiveTool, selectAnnotation } = useAnnotationStore.getState();
          const isFreehand = activeTool === 'brush' || activeTool === 'highlighter';

          if (isFreehand) {
            // Freedraw: 2s delay before switching to select
            selectAnnotation(createdAnnotationId);
            if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
            autoSwitchTimerRef.current = setTimeout(() => {
              setActiveTool('select');
              autoSwitchTimerRef.current = null;
            }, 2000);
          } else {
            // Other tools: switch immediately
            setActiveTool('select');
            selectAnnotation(createdAnnotationId);
          }
        }
      };

      window.addEventListener('pointermove', handleWindowMouseMove);
      window.addEventListener('pointerup', handleWindowMouseUp);
    }
  }, [activeTool, scale, pageId, onCreate, onUpdate, clearSelection]);

  // Clear auto-switch timer on unmount
  useEffect(() => {
    return () => {
      if (autoSwitchTimerRef.current) clearTimeout(autoSwitchTimerRef.current);
    };
  }, []);

  // Cancel auto-switch timer when starting a new drawing
  useEffect(() => {
    if (activeTool === 'brush' || activeTool === 'highlighter') {
      if (autoSwitchTimerRef.current) {
        clearTimeout(autoSwitchTimerRef.current);
        autoSwitchTimerRef.current = null;
      }
    }
  }, [activeTool]);

  // Global Key handler: Delete + Arrow nudge
  React.useEffect(() => {
    const { moveAnnotation } = useAnnotationStore.getState();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if ((document.activeElement as HTMLElement)?.isContentEditable) return;

      // Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationIds.length > 0) {
          selectedAnnotationIds.forEach(id => onDelete(id));
          e.preventDefault();
        }
        return;
      }

      // Arrow key nudge
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedAnnotationIds.length === 0) return;
        e.preventDefault();

        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;

        selectedAnnotationIds.forEach(id => moveAnnotation(id, dx, dy));
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

      {/* Group / Multi-select bounding box outline */}
      {selectedAnnotationIds.length >= 2 && (() => {
        const selected = pageAnnotations.filter(a => selectedAnnotationIds.includes(a.id));
        if (selected.length < 2) return null;
        const minX = Math.min(...selected.map(a => a.bbox.x));
        const minY = Math.min(...selected.map(a => a.bbox.y));
        const maxX = Math.max(...selected.map(a => a.bbox.x + a.bbox.width));
        const maxY = Math.max(...selected.map(a => a.bbox.y + a.bbox.height));
        const isGrouped = selected.every(a => a.groupId && a.groupId === selected[0]?.groupId);
        return (
          <div
            style={{
              position: 'absolute',
              left: minX * scale - 4,
              top: minY * scale - 4,
              width: (maxX - minX) * scale + 8,
              height: (maxY - minY) * scale + 8,
              border: isGrouped ? '2px solid #3B82F6' : '1.5px dashed #94A3B8',
              borderRadius: isGrouped ? '4px' : '2px',
              pointerEvents: 'none',
              zIndex: 9998,
              boxShadow: isGrouped ? '0 0 0 1px rgba(59,130,246,0.2)' : 'none',
            }}
          >
            {/* Group badge */}
            {isGrouped && (
              <div style={{
                position: 'absolute', top: '-10px', left: '4px',
                fontSize: '9px', color: '#3B82F6', fontWeight: 700,
                backgroundColor: 'white', padding: '0 4px', borderRadius: '2px',
                border: '1px solid #3B82F6', lineHeight: '14px',
              }}>
                그룹 ({selected.length})
              </div>
            )}
          </div>
        );
      })()}

      {/* Marquee selection overlay */}
      {marquee && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(marquee.startX, marquee.currentX) * scale,
            top: Math.min(marquee.startY, marquee.currentY) * scale,
            width: Math.abs(marquee.currentX - marquee.startX) * scale,
            height: Math.abs(marquee.currentY - marquee.startY) * scale,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px dashed #3B82F6',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}
    </div>
  );
}
