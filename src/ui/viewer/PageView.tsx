/**
 * PageView Component - PDF 페이지 렌더링
 * Canvas 기반으로 PDF.js를 사용하여 페이지를 렌더링합니다.
 */

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { Spinner } from 'phosphor-react';

interface PageViewProps {
  pageId: string;
  pageIndex: number;
  pdfProxy: PDFDocumentProxy;
  scale: number;
  onPageChange?: (pageNum: number) => void;
}

export function PageView({ pageId, pageIndex, pdfProxy, scale }: PageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const mountedRef = useRef(true);
  const renderIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !pdfProxy) return;

    // Increment render ID for this effect
    const currentRenderId = ++renderIdRef.current;
    let isCancelled = false;

    const render = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Cancel previous render task if it exists
        if (renderTaskRef.current) {
          try {
            await renderTaskRef.current.cancel();
          } catch (e) {
            // Ignore cancellation errors
          }
          renderTaskRef.current = null;
        }

        // Wait a bit to ensure cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 0));

        // Check if this render is still valid
        if (isCancelled || currentRenderId !== renderIdRef.current) {
          return;
        }

        // Get PDF page
        const pdfPage = await pdfProxy.getPage(pageIndex + 1);
        
        // Check again before continuing
        if (isCancelled || currentRenderId !== renderIdRef.current) {
          return;
        }

        const viewport = pdfPage.getViewport({ scale: scale * window.devicePixelRatio });
        
        // Calculate CSS display size (actual size user sees)
        const displayWidth = viewport.width / window.devicePixelRatio;
        const displayHeight = viewport.height / window.devicePixelRatio;

        // Set canvas bitmap size (high-res for Retina)
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Set CSS display size explicitly
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get 2D context');
        }

        // Start render task
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        };

        renderTaskRef.current = pdfPage.render(renderContext);
        await renderTaskRef.current.promise;

        // Check if still valid after render
        if (!isCancelled && currentRenderId === renderIdRef.current && mountedRef.current) {
          setIsLoading(false);
        }
      } catch (err: any) {
        // Ignore cancellation errors
        if (err?.name === 'RenderingCancelledException') {
          return;
        }
        
        if (!isCancelled && currentRenderId === renderIdRef.current && mountedRef.current) {
          console.error('Failed to render page:', err);
          setError(err instanceof Error ? err.message : 'Rendering failed');
          setIsLoading(false);
        }
      } finally {
        if (renderTaskRef.current) {
          renderTaskRef.current = null;
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancellation errors
        }
        renderTaskRef.current = null;
      }
    };
  }, [pageId, pageIndex, pdfProxy, scale]);

  // Track component mount status
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm rounded-lg z-10">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={32} className="animate-spin text-blue-500" weight="bold" />
            <p className="text-sm text-gray-600 font-medium">페이지 렌더링 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 backdrop-blur-sm rounded-lg z-10">
          <div className="text-center px-6 py-4 bg-white rounded-lg shadow-lg border border-red-200">
            <p className="text-red-600 font-medium mb-2">렌더링 오류</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="shadow-2xl rounded-lg bg-white"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}

