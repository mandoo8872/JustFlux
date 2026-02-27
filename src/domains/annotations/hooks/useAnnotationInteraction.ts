import { useState, useCallback, useEffect, useRef } from 'react';
import { useAnnotationStore } from '../../../state/stores/AnnotationStore';
import { useHistoryStore } from '../../../state/stores/HistoryStore';
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

    // Snapshot of selected annotations before drag starts (for undo)
    const beforeSnapshotsRef = useRef<Map<string, Annotation>>(new Map());
    const didMoveRef = useRef(false);

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
                didMoveRef.current = true;
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
            // Record history if annotations actually moved
            if (didMoveRef.current && beforeSnapshotsRef.current.size > 0) {
                const actions = Array.from(beforeSnapshotsRef.current.entries()).map(
                    ([id, before]) => {
                        const after = useAnnotationStore.getState().annotations.find(a => a.id === id);
                        return {
                            type: 'update' as const,
                            annotationId: id,
                            pageId: before.pageId,
                            before: { ...before },
                            after: after ? { ...after } : null,
                        };
                    }
                );
                if (actions.length > 0) {
                    useHistoryStore.getState().pushAction('주석 이동', actions);
                }
            }

            beforeSnapshotsRef.current.clear();
            didMoveRef.current = false;

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

    /** Capture snapshots of all selected annotations before drag */
    const captureSnapshots = useCallback(() => {
        const store = useAnnotationStore.getState();
        const ids = store.selection.selectedAnnotationIds;
        const map = new Map<string, Annotation>();
        for (const id of ids) {
            const ann = store.annotations.find(a => a.id === id);
            if (ann) map.set(id, { ...ann });
        }
        beforeSnapshotsRef.current = map;
        didMoveRef.current = false;
    }, []);

    const handlePointerDown = useCallback((e: React.PointerEvent, annotationId: string) => {
        if (activeTool !== 'select') return;
        if (e.button !== 0) return;

        e.stopPropagation();

        const isMultiSelect = e.ctrlKey || e.metaKey;

        if (isMultiSelect) {
            selectAnnotation(annotationId, true);
        } else if (!selectedAnnotationIds.includes(annotationId)) {
            selectAnnotation(annotationId);
        }

        // Capture before-snapshots for undo (setTimeout lets selection update first)
        setTimeout(() => captureSnapshots(), 0);

        setDragState({
            isDragging: true,
            startPoint: { x: e.clientX, y: e.clientY },
            annotationId,
        });
    }, [activeTool, selectedAnnotationIds, selectAnnotation, captureSnapshots]);

    // Direct drag start function for components like ImageAnnotation
    const startDrag = useCallback((annotation: Annotation, startPos: { x: number; y: number }) => {
        if (activeTool !== 'select') return;

        if (!selectedAnnotationIds.includes(annotation.id)) {
            selectAnnotation(annotation.id);
        }

        setTimeout(() => captureSnapshots(), 0);

        setDragState({
            isDragging: true,
            startPoint: startPos,
            annotationId: annotation.id,
        });
    }, [activeTool, selectedAnnotationIds, selectAnnotation, captureSnapshots]);

    return {
        handlePointerDown,
        startDrag,
        isDragging: dragState.isDragging,
        draggedAnnotationId: dragState.annotationId,
    };
};
