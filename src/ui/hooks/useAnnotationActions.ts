/**
 * useAnnotationActions — 주석 CRUD + 히스토리 기록
 *
 * Shell.tsx에서 추출. 주석 추가/삭제 시 HistoryStore에 자동 기록.
 */

import { useCallback } from 'react';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { useHistoryStore } from '../../state/stores/HistoryStore';
import type { Annotation } from '../../core/model/types';

function generateAnnotationId(): string {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

interface UseAnnotationActionsOptions {
    currentPageId: string | null;
}

export function useAnnotationActions({ currentPageId }: UseAnnotationActionsOptions) {
    const { addAnnotationToPage, removeAnnotation, setActiveTool, selectAnnotation } =
        useAnnotationStore();

    /** 주석 추가 + 히스토리 기록 */
    const handleAddAnnotation = useCallback(
        (annotation: Omit<Annotation, 'id'> & { id?: string }) => {
            if (!currentPageId) return;

            const annotationId = annotation.id || generateAnnotationId();
            const annotationWithId: Annotation = {
                ...annotation,
                id: annotationId,
                pageId: currentPageId,
                ...(annotation.type === 'stamp' && { stampType: 'approved' }),
            } as Annotation;

            addAnnotationToPage(currentPageId, annotationWithId);

            useHistoryStore.getState().pushAction('주석 추가', [
                {
                    type: 'add',
                    annotationId,
                    pageId: currentPageId,
                    before: null,
                    after: { ...annotationWithId },
                },
            ]);

            setActiveTool('select');
            setTimeout(() => selectAnnotation(annotationId), 50);
        },
        [currentPageId, addAnnotationToPage, setActiveTool, selectAnnotation],
    );

    /** 주석 삭제 + 히스토리 기록 */
    const handleDeleteAnnotation = useCallback(
        (annotationId: string) => {
            const annotation = useAnnotationStore.getState().findAnnotation(annotationId);
            removeAnnotation(annotationId);

            if (annotation) {
                useHistoryStore.getState().pushAction('주석 삭제', [
                    {
                        type: 'remove',
                        annotationId,
                        pageId: annotation.pageId,
                        before: { ...annotation },
                        after: null,
                    },
                ]);
            }
        },
        [removeAnnotation],
    );

    return { handleAddAnnotation, handleDeleteAnnotation };
}
