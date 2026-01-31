/**
 * ClipboardService - 클립보드 붙여넣기 처리
 * 이미지와 텍스트를 현재 페이지에 주석으로 추가
 */

import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { usePageStore } from '../../state/stores/PageStore';

export class ClipboardService {
    /**
     * 클립보드에서 붙여넣기
     * @returns 붙여넣기 성공 여부
     */
    static async pasteFromClipboard(): Promise<boolean> {
        try {
            const clipboardItems = await navigator.clipboard.read();

            for (const item of clipboardItems) {
                // 이미지 처리
                if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
                    const imageType = item.types.find(t => t.startsWith('image/'));
                    if (imageType) {
                        const blob = await item.getType(imageType);
                        await this.pasteImage(blob);
                        return true;
                    }
                }

                // 텍스트 처리
                if (item.types.includes('text/plain')) {
                    const blob = await item.getType('text/plain');
                    const text = await blob.text();
                    if (text.trim()) {
                        this.pasteText(text);
                        return true;
                    }
                }
            }

            console.log('📋 [ClipboardService] No valid content found in clipboard');
            return false;
        } catch (error) {
            // Fallback: try reading text directly
            try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                    this.pasteText(text);
                    return true;
                }
            } catch (textError) {
                console.error('📋 [ClipboardService] Failed to read clipboard:', error);
            }
            return false;
        }
    }

    /**
     * 이미지를 주석으로 붙여넣기
     */
    private static async pasteImage(blob: Blob): Promise<void> {
        const { currentPageId } = usePageStore.getState();
        if (!currentPageId) {
            console.warn('📋 [ClipboardService] No current page to paste image');
            return;
        }

        // Blob을 Data URL로 변환
        const imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // 이미지 크기 가져오기
        const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
            img.src = imageUrl;
        });

        // 최대 크기 제한 (400px)
        const maxSize = 400;
        let finalWidth = width;
        let finalHeight = height;

        if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            finalWidth = width * ratio;
            finalHeight = height * ratio;
        }

        // 이미지 주석 생성
        const now = Date.now();
        const annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'image' as const,
            pageId: currentPageId,
            bbox: {
                x: 50, // 좌측 상단 기본 위치
                y: 50,
                width: finalWidth,
                height: finalHeight
            },
            imageUrl,
            style: {},
            createdAt: now,
            modifiedAt: now
        };

        const { addAnnotationToPage } = useAnnotationStore.getState();
        addAnnotationToPage(currentPageId, annotation as any);

        console.log(`📋 [ClipboardService] Image pasted: ${finalWidth}x${finalHeight}px`);
    }

    /**
     * 텍스트를 주석으로 붙여넣기
     */
    private static pasteText(text: string): void {
        const { currentPageId } = usePageStore.getState();
        if (!currentPageId) {
            console.warn('📋 [ClipboardService] No current page to paste text');
            return;
        }

        // 텍스트 주석 생성
        const now = Date.now();
        const annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'text' as const,
            pageId: currentPageId,
            bbox: {
                x: 50,
                y: 50,
                width: 300,
                height: 100
            },
            text: text,
            style: {
                fontSize: 14,
                color: '#000000',
                backgroundColor: '#ffffd4' // 연한 노란색 배경
            },
            createdAt: now,
            modifiedAt: now
        };

        const { addAnnotationToPage } = useAnnotationStore.getState();
        addAnnotationToPage(currentPageId, annotation as any);

        console.log(`📋 [ClipboardService] Text pasted: ${text.length} chars`);
    }
}
