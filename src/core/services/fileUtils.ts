/**
 * fileUtils — 파일 처리 공통 유틸리티
 *
 * FileService에서 추출. 이미지 읽기, 크기 가져오기, 폭 맞춤 등
 * load/append 메서드에서 반복되던 패턴을 통합.
 */

import { createDocument } from '../model/factories';
import { useDocumentStore } from '../../state/documentStore';
import { usePageStore } from '../../state/stores/PageStore';
import { useViewStore } from '../../state/stores/ViewStore';

/** 파일을 Data URL로 읽기 */
export function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/** 이미지 URL에서 크기 가져오기 */
export function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.onerror = reject;
        img.src = src;
    });
}

/** 폭 맞춤 적용 */
export function applyWidthMatching(
    width: number,
    height: number,
    targetWidth: number | null,
    matchWidth: boolean,
): { width: number; height: number } {
    if (matchWidth && targetWidth && Math.abs(width - targetWidth) > 1) {
        const ratio = targetWidth / width;
        return { width: targetWidth, height: height * ratio };
    }
    return { width, height };
}

/** A4 최대 크기 제한 */
export function clampToA4(width: number, height: number): { width: number; height: number } {
    const maxWidth = 595;
    const maxHeight = 842;
    if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        return { width: width * ratio, height: height * ratio };
    }
    return { width, height };
}

/** 새 문서를 생성하고 Store에 설정 */
export function initNewDocument(
    fileName: string,
    fileSize: number,
    sourceKind: 'pdf' | 'images',
) {
    const doc = createDocument({
        name: fileName,
        source: { kind: sourceKind, fileName, fileSize },
    });
    useDocumentStore.getState().setDocument(doc);
    usePageStore.getState().clearPages();
    return doc;
}

/** 첫 페이지를 현재 페이지로 설정 + fitToPage */
export function selectFirstPage() {
    const { pages, setCurrentPage } = usePageStore.getState();
    const { fitToPage } = useViewStore.getState();
    const firstPage = pages[0];
    if (firstPage) {
        setCurrentPage(firstPage.id);
        fitToPage(firstPage.width, firstPage.height);
    }
}

/** 특정 인덱스의 페이지를 현재 페이지로 이동 */
export function selectPageAtIndex(index: number) {
    const { pages, setCurrentPage } = usePageStore.getState();
    const page = pages[index];
    if (page) setCurrentPage(page.id);
}

// ── 파일 검증 유틸 ──

const ALLOWED_TYPES = [
    'application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
    'image/gif', 'image/webp', 'text/plain', 'text/markdown',
];

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'txt', 'md'];

/** 파일 타입 검증 */
export function validateFileType(file: File): boolean {
    const ext = file.name.toLowerCase().split('.').pop();
    return ALLOWED_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext || '');
}

/** 파일 크기 검증 */
export function validateFileSize(file: File, maxSizeMB = 50): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
}

/** 파일 메타데이터 추출 */
export function getFileMetadata(file: File) {
    return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified),
    };
}
