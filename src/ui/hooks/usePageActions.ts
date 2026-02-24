/**
 * usePageActions — 페이지 핸들러 (순서변경, 복제, 삭제, 빈 페이지 추가, PDF 추가)
 *
 * Shell.tsx에서 추출. PageStore 조작을 캡슐화.
 */

import { useCallback } from 'react';
import { usePageStore } from '../../state/stores/PageStore';
import { createPage } from '../../core/model/factories';

interface UsePageActionsOptions {
    documentId: string | null;
}

export function usePageActions({ documentId }: UsePageActionsOptions) {
    const handlePageReorder = useCallback((pageIds: string[]) => {
        usePageStore.getState().reorderPages(pageIds);
    }, []);

    const handlePageDuplicate = useCallback((pageId: string) => {
        usePageStore.getState().duplicatePage(pageId);
    }, []);

    const handlePageDelete = useCallback((pageId: string) => {
        usePageStore.getState().removePage(pageId);
    }, []);

    const handleAddBlankPage = useCallback(
        (afterPageId: string, width: number, height: number) => {
            const store = usePageStore.getState();

            if (!afterPageId || store.pages.length === 0) {
                const newPage = createPage({
                    docId: documentId || 'new-doc',
                    index: 0,
                    width,
                    height,
                    contentType: 'blank',
                });
                store.addPage(newPage);
                store.setCurrentPage(newPage.id);
                return;
            }

            const afterPage = store.getPage(afterPageId);
            const afterIndex = store.getPageIndex(afterPageId);
            if (!afterPage) return;

            const newPage = createPage({
                docId: afterPage.docId,
                index: afterIndex + 1,
                width,
                height,
                contentType: 'blank',
            });

            if (afterIndex !== -1 && afterIndex < store.pages.length - 1) {
                store.insertPdfPages(afterPageId, [newPage]);
            } else {
                store.addPage(newPage);
            }
            store.setCurrentPage(newPage.id);
        },
        [documentId],
    );

    const handleAddPdfPages = useCallback(async (_afterPageId: string, file: File) => {
        try {
            const { FileService } = await import('../../core/services/FileService');
            await FileService.loadPdfFile(file);
        } catch (error) {
            console.error('Failed to add PDF pages:', error);
        }
    }, []);

    return {
        handlePageReorder,
        handlePageDuplicate,
        handlePageDelete,
        handleAddBlankPage,
        handleAddPdfPages,
    };
}
