import { useState, useCallback, useEffect } from 'react';
import { useAnnotationStore } from '../../../state/stores/AnnotationStore';
import { getDelta } from '../utils/transformUtils';
import type { Annotation } from '../../../core/model/types';

interface DragState {
    isDragging: boolean;
    startPoint: { x: number; y: number } | null;
    annotationId: string | null;
}

interface UseAnnotationInteractionProps {
    scale: number;
    activeTool: string;
}

export const useAnnotationInteraction = ({ scale, activeTool }: UseAnnotationInteractionProps) => {
    const { moveAnnotation, selectAnnotation, selection } = useAnnotationStore();
    const selectedAnnotationIds = selection.selectedAnnotationIds;
    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        startPoint: null,
        annotationId: null,
    });

    useEffect(() => {
        if (!dragState.isDragging) return;

        const handlePointerMove = (e: PointerEvent) => {
            e.preventDefault();
            if (!dragState.startPoint || !dragState.annotationId) return;

            let { deltaX, deltaY } = getDelta(
                e.clientX,
                e.clientY,
                dragState.startPoint.x,
                dragState.startPoint.y,
                scale
            );

            // Shift key: constrain to dominant axis
            if (e.shiftKey) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    deltaY = 0;
                } else {
                    deltaX = 0;
                }
            }

            if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
                // Move ALL selected annotations together (group drag)
                const currentSelectedIds = useAnnotationStore.getState().selection.selectedAnnotationIds;
                for (const id of currentSelectedIds) {
                    moveAnnotation(id, deltaX, deltaY);
                }
                setDragState((prev) => ({
                    ...prev,
                    startPoint: { x: e.clientX, y: e.clientY },
                }));
            }
        };

        const handlePointerUp = () => {
            setDragState({
                isDragging: false,
                startPoint: null,
                annotationId: null,
            });
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [dragState.isDragging, dragState.annotationId, dragState.startPoint, moveAnnotation, scale]);

    const handlePointerDown = useCallback((e: React.PointerEvent, annotationId: string) => {
        if (activeTool !== 'select') return;
        if (e.button !== 0) return;

        e.stopPropagation();

        if (!selectedAnnotationIds.includes(annotationId)) {
            selectAnnotation(annotationId);
        }

        setDragState({
            isDragging: true,
            startPoint: { x: e.clientX, y: e.clientY },
            annotationId,
        });
    }, [activeTool, selectedAnnotationIds, selectAnnotation]);

    // Direct drag start function for components like ImageAnnotation
    const startDrag = useCallback((annotation: Annotation, startPos: { x: number; y: number }) => {
        if (activeTool !== 'select') return;

        if (!selectedAnnotationIds.includes(annotation.id)) {
            selectAnnotation(annotation.id);
        }

        setDragState({
            isDragging: true,
            startPoint: startPos,
            annotationId: annotation.id,
        });
    }, [activeTool, selectedAnnotationIds, selectAnnotation]);

    return {
        handlePointerDown,
        startDrag,
        isDragging: dragState.isDragging,
        draggedAnnotationId: dragState.annotationId,
    };
};
