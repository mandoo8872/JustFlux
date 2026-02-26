/**
 * useKeyboardShortcuts — 전역 키보드 단축키 훅
 *
 * Shell.tsx에서 추출.
 * Ctrl+D (복제), Ctrl+V (붙여넣기) 등 전역 키보드 단축키를 처리.
 */

import { useEffect } from 'react';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';

/** 텍스트 입력 필드에 포커스 중인지 확인 */
function isTextInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(): void {
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if (isTextInputFocused()) return;

            const mod = e.ctrlKey || e.metaKey;

            // ── Ctrl+D: 선택된 객체 복제 ──
            if (mod && e.key === 'd') {
                e.preventDefault();
                const { selection, cloneAnnotation } = useAnnotationStore.getState();
                const selectedId = selection.selectedAnnotationIds[0];
                if (selectedId) {
                    cloneAnnotation(selectedId);
                }
                return;
            }

            // ── Ctrl+V: 클립보드 붙여넣기 ──
            if (mod && e.key === 'v') {
                e.preventDefault();
                try {
                    const { ClipboardService } = await import('../../core/services/ClipboardService');
                    await ClipboardService.pasteFromClipboard();
                } catch (error) {
                    console.error('[KeyboardShortcuts] Paste failed:', error);
                }
                return;
            }

            // ── Ctrl+G: 그룹화 / Ctrl+Shift+G: 그룹 해제 ──
            if (mod && e.key.toLowerCase() === 'g') {
                e.preventDefault();
                const { selection, groupAnnotations, ungroupAnnotations } = useAnnotationStore.getState();
                const ids = selection.selectedAnnotationIds;
                if (ids.length < 2) return;

                if (e.shiftKey) {
                    ungroupAnnotations(ids);
                } else {
                    groupAnnotations(ids);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
