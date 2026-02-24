/**
 * useFileDrop — 드래그&드롭 + 파일 다이얼로그 관리 훅
 *
 * Shell.tsx에서 추출.
 * 파일 드래그&드롭 UI 상태, 교체/추가 판단 로직을 캡슐화.
 */

import { useState, useCallback } from 'react';
import { useDocumentStore } from '../../state/documentStore';
import { usePageStore } from '../../state/stores/PageStore';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// ── 반환 타입 ──

export interface FileDropState {
    isDragOver: boolean;
    pendingDropFile: File | null;
    showDropDialog: boolean;
}

export interface FileDropHandlers {
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleDropReplace: () => Promise<void>;
    handleDropAppend: (matchWidth: boolean) => Promise<void>;
    handleDropCancel: () => void;
}

// ── 파일 로딩 유틸 ──

async function loadFileAsReplace(file: File): Promise<void> {
    try {
        const { FileService } = await import('../../core/services/FileService');
        const ext = file.name.toLowerCase().split('.').pop();

        if (file.type === 'application/pdf') {
            await FileService.loadPdfFile(file);
        } else if (file.type.startsWith('image/')) {
            await FileService.loadImageFile(file);
        } else if (ext === 'md' || ext === 'txt' || file.type === 'text/plain' || file.type === 'text/markdown') {
            await FileService.loadTextFile(file);
        } else {
            console.warn('Unsupported file type:', file.type, ext);
        }
    } catch (error) {
        console.error('Failed to load file:', error);
        useDocumentStore.setState({
            error: error instanceof Error ? error.message : 'Failed to load file',
            isLoading: false,
        });
    }
}

async function loadFileAsAppend(
    file: File,
    matchWidth: boolean,
    insertedPdfProxies: Map<string, PDFDocumentProxy>
): Promise<void> {
    try {
        const { FileService } = await import('../../core/services/FileService');

        if (file.type === 'application/pdf') {
            const proxy = await FileService.appendPdfFile(file, matchWidth);
            if (proxy) {
                insertedPdfProxies.set(file.name, proxy);
            }
        } else if (file.type.startsWith('image/')) {
            await FileService.appendImageFile(file, matchWidth);
        } else {
            console.warn('Unsupported file type for append:', file.type);
        }
    } catch (error) {
        console.error('Failed to append file:', error);
    }
}

// ── 메인 훅 ──

export function useFileDrop(
    insertedPdfProxies: Map<string, PDFDocumentProxy>
): FileDropState & FileDropHandlers {
    const [isDragOver, setIsDragOver] = useState(false);
    const [pendingDropFile, setPendingDropFile] = useState<File | null>(null);
    const [showDropDialog, setShowDropDialog] = useState(false);

    // ── 드래그 이벤트 ──

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        const { FileService } = await import('../../core/services/FileService');
        if (!FileService.validateFileType(file)) {
            console.warn('Unsupported file type:', file.type);
            return;
        }

        const { pages } = usePageStore.getState();
        if (pages.length > 0) {
            setPendingDropFile(file);
            setShowDropDialog(true);
        } else {
            await loadFileAsReplace(file);
        }
    }, []);

    // ── 파일 선택 (input[type=file]) ──

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const { pages } = usePageStore.getState();
        if (pages.length > 0) {
            setPendingDropFile(file);
            setShowDropDialog(true);
        } else {
            await loadFileAsReplace(file);
        }
        e.target.value = '';
    }, []);

    // ── 다이얼로그 핸들러 ──

    const handleDropReplace = useCallback(async () => {
        if (!pendingDropFile) return;
        setShowDropDialog(false);
        await loadFileAsReplace(pendingDropFile);
        setPendingDropFile(null);
    }, [pendingDropFile]);

    const handleDropAppend = useCallback(async (matchWidth: boolean) => {
        if (!pendingDropFile) return;
        setShowDropDialog(false);
        await loadFileAsAppend(pendingDropFile, matchWidth, insertedPdfProxies);
        setPendingDropFile(null);
    }, [pendingDropFile, insertedPdfProxies]);

    const handleDropCancel = useCallback(() => {
        setShowDropDialog(false);
        setPendingDropFile(null);
    }, []);

    return {
        // State
        isDragOver,
        pendingDropFile,
        showDropDialog,
        // Handlers
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleFileSelect,
        handleDropReplace,
        handleDropAppend,
        handleDropCancel,
    };
}
