/**
 * PageView Component - PDF 페이지 렌더링
 * Canvas 기반으로 PDF.js를 사용하여 페이지를 렌더링합니다.
 *
 * Agent 1 (Canvas Precision): CSS/비트맵 스케일 분리
 * Agent 3 (Visual Hierarchy): 줌 연동 엘리베이션
 */

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Spinner } from 'phosphor-react';

import { useViewStore } from '../../state/stores/ViewStore';
import { getCanvasElevation } from './preview-tokens';

interface PageViewProps {
  pageId: string;
  pageIndex: number;
  pdfProxy: PDFDocumentProxy;
  scale: number;
  onPageChange?: (pageNum: number) => void;
  onRenderComplete?: () => void;
}

export function PageView({ pageId, pageIndex, pdfProxy, scale, onRenderComplete }: PageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const mountedRef = useRef(true);
  const renderIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const smoothRendering = useViewStore((s) => s.smoothRendering);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error(`❌ [PageView] Canvas ref is null!`);
      return;
    }
    if (!pdfProxy) {
      console.error(`❌ [PageView] pdfProxy is null!`);
      return;
    }

    const currentRenderId = ++renderIdRef.current;
    let isCancelled = false;

    const render = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cancel previous render
        if (renderTaskRef.current) {
          try { await renderTaskRef.current.cancel(); } catch (_) { /* ignore */ }
          renderTaskRef.current = null;
        }

        await new Promise(resolve => setTimeout(resolve, 0));
        if (isCancelled || currentRenderId !== renderIdRef.current) return;

        const pdfPage = await pdfProxy.getPage(pageIndex + 1);
        if (isCancelled || currentRenderId !== renderIdRef.current) return;

        // ── Agent 1: CSS/비트맵 스케일 분리 ──
        // CSS 뷰포트: 사용자가 보는 크기
        const cssViewport = pdfPage.getViewport({ scale });
        const displayWidth = cssViewport.width;
        const displayHeight = cssViewport.height;

        // 비트맵 뷰포트: 고해상도 렌더링 (Retina 대응)
        const dpr = window.devicePixelRatio || 1;
        const bitmapViewport = pdfPage.getViewport({ scale: scale * dpr });

        // Canvas 비트맵 크기 = 고해상도
        canvas.width = Math.round(bitmapViewport.width);
        canvas.height = Math.round(bitmapViewport.height);

        // CSS 표시 크기 = 논리적 크기
        canvas.style.width = `${Math.round(displayWidth)}px`;
        canvas.style.height = `${Math.round(displayHeight)}px`;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Failed to get 2D context');

        renderTaskRef.current = pdfPage.render({
          canvasContext: context,
          viewport: bitmapViewport,
          canvas: canvas,
        });
        await renderTaskRef.current.promise;

        if (!isCancelled && currentRenderId === renderIdRef.current && mountedRef.current) {
          setIsLoading(false);
          if (onRenderComplete) {
            setTimeout(() => onRenderComplete(), 50);
          }
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        if (!isCancelled && currentRenderId === renderIdRef.current && mountedRef.current) {
          console.error('Failed to render page:', err);
          setError(err instanceof Error ? err.message : 'Rendering failed');
          setIsLoading(false);
        }
      } finally {
        renderTaskRef.current = null;
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch (_) { /* ignore */ }
        renderTaskRef.current = null;
      }
    };
  }, [pageId, pageIndex, pdfProxy, scale]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Agent 3: 줌 연동 엘리베이션 ──
  const elevation = getCanvasElevation(scale);

  return (
    <div style={{ position: 'relative', display: 'block', width: 'fit-content', height: 'fit-content' }}>
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(249, 250, 251, 0.9)',
          zIndex: 1000, pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Spinner size={32} className="animate-spin text-blue-500" weight="bold" />
            <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' as any }}>
              페이지 렌더링 중...
            </p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(254, 242, 242, 0.9)',
          zIndex: 1000, pointerEvents: 'none'
        }}>
          <div style={{
            textAlign: 'center', padding: 'var(--space-6)',
            backgroundColor: 'var(--color-bg-card)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid #fecaca'
          }}>
            <p style={{ color: 'var(--color-danger)', fontWeight: 'var(--font-weight-medium)' as any, marginBottom: 'var(--space-2)' }}>
              렌더링 오류
            </p>
            <p style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-text-muted)' }}>{error}</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          border: '1px solid var(--color-border)',
          position: 'relative',
          zIndex: 1,
          // Agent 3: 줌 레벨 연동 엘리베이션
          boxShadow: elevation,
          borderRadius: smoothRendering ? 'var(--radius-lg)' : '0px',
          ...(smoothRendering ? {} : {
            imageRendering: '-webkit-optimize-contrast' as any,
          }),
        } as React.CSSProperties}
      />
    </div>
  );
}
