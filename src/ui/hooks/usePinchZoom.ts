/**
 * usePinchZoom — 터치 핀치 줌/팬 핸들링
 *
 * MainContent에서 추출.
 * 2-finger 핀치 제스처를 앱 내부 줌으로 변환하고
 * 브라우저 기본 핀치 줌을 capture phase에서 차단.
 */

import { useEffect, useRef } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;

interface UsePinchZoomOptions {
    zoom: number;
    onZoomChange: (zoom: number) => void;
    containerRef: React.RefObject<HTMLDivElement>;
}

export function usePinchZoom({ zoom, onZoomChange, containerRef }: UsePinchZoomOptions) {
    const zoomRef = useRef(zoom);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let initialDistance = 0;
        let initialZoom = zoomRef.current;
        let isPinching = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                isPinching = true;
                const [t1, t2] = [e.touches[0], e.touches[1]];
                initialDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                initialZoom = zoomRef.current;
            } else {
                isPinching = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (isPinching && initialDistance > 0) {
                    const [t1, t2] = [e.touches[0], e.touches[1]];
                    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
                    const scale = dist / initialDistance;
                    onZoomChange(Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom * scale)));
                }
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) {
                isPinching = false;
                initialDistance = 0;
            }
        };

        let registered = false;
        const opts: AddEventListenerOptions = { passive: false, capture: true };
        const plainOpts: AddEventListenerOptions = { passive: false };

        const tid = setTimeout(() => {
            window.addEventListener('touchstart', handleTouchStart, opts);
            window.addEventListener('touchmove', handleTouchMove, opts);
            window.addEventListener('touchend', handleTouchEnd, opts);
            window.addEventListener('touchcancel', handleTouchEnd, opts);

            try {
                const doc = globalThis.document;
                if (doc) {
                    doc.addEventListener('touchstart', handleTouchStart, opts);
                    doc.addEventListener('touchmove', handleTouchMove, opts);
                    doc.addEventListener('touchend', handleTouchEnd, opts);
                    doc.addEventListener('touchcancel', handleTouchEnd, opts);
                }
            } catch { /* no document */ }

            const container = containerRef.current;
            if (container) {
                container.addEventListener('touchstart', handleTouchStart, plainOpts);
                container.addEventListener('touchmove', handleTouchMove, plainOpts);
                container.addEventListener('touchend', handleTouchEnd, plainOpts);
                container.addEventListener('touchcancel', handleTouchEnd, plainOpts);
            }
            registered = true;
        }, 0);

        return () => {
            clearTimeout(tid);
            if (!registered) return;
            const rmOpts: EventListenerOptions = { capture: true };

            window.removeEventListener('touchstart', handleTouchStart, rmOpts);
            window.removeEventListener('touchmove', handleTouchMove, rmOpts);
            window.removeEventListener('touchend', handleTouchEnd, rmOpts);
            window.removeEventListener('touchcancel', handleTouchEnd, rmOpts);

            try {
                const doc = globalThis.document;
                if (doc) {
                    doc.removeEventListener('touchstart', handleTouchStart, rmOpts);
                    doc.removeEventListener('touchmove', handleTouchMove, rmOpts);
                    doc.removeEventListener('touchend', handleTouchEnd, rmOpts);
                    doc.removeEventListener('touchcancel', handleTouchEnd, rmOpts);
                }
            } catch { /* no document */ }

            const container = containerRef.current;
            if (container) {
                container.removeEventListener('touchstart', handleTouchStart);
                container.removeEventListener('touchmove', handleTouchMove);
                container.removeEventListener('touchend', handleTouchEnd);
                container.removeEventListener('touchcancel', handleTouchEnd);
            }
        };
    }, [zoom, onZoomChange, containerRef]);
}
