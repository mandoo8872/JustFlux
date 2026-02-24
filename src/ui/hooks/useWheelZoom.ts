/**
 * useWheelZoom — 마우스 휠 줌 핸들링
 *
 * MainContent에서 추출. Ctrl/Meta+휠로 줌 변경.
 * 브라우저 기본 확대/축소를 capture phase에서 차단.
 */

import { useCallback, useEffect, useRef } from 'react';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

function clampZoom(zoom: number): number {
    return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
}

interface UseWheelZoomOptions {
    zoom: number;
    onZoomChange: (zoom: number) => void;
}

export function useWheelZoom({ zoom, onZoomChange }: UseWheelZoomOptions) {
    const zoomRef = useRef(zoom);
    useEffect(() => { zoomRef.current = zoom; }, [zoom]);

    /** React onWheel 핸들러 */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            onZoomChange(clampZoom(zoom + delta));
        }
    }, [zoom, onZoomChange]);

    /** 전역 wheel 리스너 (브라우저 확대/축소 차단) */
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handler = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
                onZoomChange(clampZoom(zoomRef.current + delta));
                return false;
            }
        };

        let registered = false;
        const tid = setTimeout(() => {
            const opts: AddEventListenerOptions = { passive: false, capture: true };
            window.addEventListener('wheel', handler, opts);
            try {
                globalThis.document?.addEventListener('wheel', handler, opts);
                globalThis.document?.body?.addEventListener('wheel', handler, opts);
            } catch { /* no document */ }
            registered = true;
        }, 0);

        return () => {
            clearTimeout(tid);
            if (!registered) return;
            const opts: EventListenerOptions = { capture: true };
            window.removeEventListener('wheel', handler, opts);
            try {
                globalThis.document?.removeEventListener('wheel', handler, opts);
                globalThis.document?.body?.removeEventListener('wheel', handler, opts);
            } catch { /* no document */ }
        };
    }, [onZoomChange]);

    return { handleWheel };
}
