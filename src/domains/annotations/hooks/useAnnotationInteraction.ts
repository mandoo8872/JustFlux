import { useState, useCallback, useEffect } from 'react';
import { useAnnotationStore } from '../../../state/stores/AnnotationStore';
import { getDelta } from '../utils/transformUtils';

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
    const { moveAnnotation, selectAnnotation, selectedAnnotationIds } = useAnnotationStore();
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

            const { deltaX, deltaY } = getDelta(
                e.clientX,
                e.clientY,
                dragState.startPoint.x,
                dragState.startPoint.y,
                scale
            );

            if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
                moveAnnotation(dragState.annotationId, deltaX, deltaY);
                setDragState((prev) => ({
                    ...prev,
                    startPoint: { x: e.clientX, y: e.clientY },
                }));
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            console.log('🎯 [useAnnotationInteraction] Drag end');
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
        if (e.button !== 0) return; // Only left click

        e.stopPropagation();
        console.log('🎯 [useAnnotationInteraction] Drag start:', annotationId);

        if (!selectedAnnotationIds.includes(annotationId)) {
            selectAnnotation(annotationId);
        }

        setDragState({
            isDragging: true,
            startPoint: { x: e.clientX, y: e.clientY },
            annotationId,
        });
    }, [activeTool, selectedAnnotationIds, selectAnnotation]);

    return {
        handlePointerDown,
        isDragging: dragState.isDragging,
        draggedAnnotationId: dragState.annotationId,
    };
};
