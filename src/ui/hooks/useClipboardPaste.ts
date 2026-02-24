/**
 * useClipboardPaste — 이미지 클립보드 붙여넣기 훅
 *
 * Shell.tsx에서 추출.
 * window 'paste' 이벤트를 감지하여 이미지 데이터를 주석으로 변환.
 */

import { useEffect } from 'react';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { usePageStore } from '../../state/stores/PageStore';
import { createImageAnnotation } from '../../core/model/factories';

/** 텍스트 입력 필드에 포커스 중인지 확인 */
function isTextInputFocused(): boolean {
    const el = window.document.activeElement;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || (el as HTMLElement).isContentEditable;
}

export function useClipboardPaste(): void {
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            if (isTextInputFocused()) return;
            if (!e.clipboardData?.items) return;

            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') === -1) continue;

                const blob = items[i].getAsFile();
                if (!blob) continue;

                // 현재 페이지 ID 결정
                const { selection } = useAnnotationStore.getState();
                const { pages } = usePageStore.getState();
                const targetPageId = selection.selectedPageId ?? pages[0]?.id;
                if (!targetPageId) continue;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageUrl = event.target?.result as string;
                    if (!imageUrl) return;

                    const img = new Image();
                    img.onload = () => {
                        const width = Math.min(img.width, 500);
                        const height = width * (img.height / img.width);

                        const newAnnotation = createImageAnnotation({
                            pageId: targetPageId,
                            bbox: { x: 100, y: 100, width, height },
                            imageData: imageUrl,
                            originalWidth: img.width,
                            originalHeight: img.height,
                        });

                        useAnnotationStore.getState().addAnnotationToPage(targetPageId, newAnnotation);
                        useAnnotationStore.getState().setActiveTool('select');
                        setTimeout(() => {
                            useAnnotationStore.getState().selectAnnotation(newAnnotation.id);
                        }, 50);
                    };
                    img.src = imageUrl;
                };
                reader.readAsDataURL(blob);

                e.preventDefault();
                break;
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, []);
}
