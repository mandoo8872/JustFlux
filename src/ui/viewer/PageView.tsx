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
  onRenderComplete?: () => void;
}

export function PageView({ pageId, pageIndex, pdfProxy, scale, onRenderComplete }: PageViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const mountedRef = useRef(true);
  const renderIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


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
          // Call render complete callback
          if (onRenderComplete) {
            setTimeout(() => onRenderComplete(), 50); // Small delay to ensure DOM is updated
          }
        } else {
          console.warn(`⚠️ [PageView] Render cancelled or invalid: cancelled=${isCancelled}, renderId=${currentRenderId}/${renderIdRef.current}, mounted=${mountedRef.current}`);
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
    <div style={{ 
      position: 'relative', 
      display: 'block',
      width: 'fit-content',
      height: 'fit-content'
    }}>
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(249, 250, 251, 0.9)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Spinner size={32} className="animate-spin text-blue-500" weight="bold" />
            <p style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>페이지 렌더링 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(254, 242, 242, 0.9)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fecaca'
          }}>
            <p style={{ color: '#dc2626', fontWeight: 500, marginBottom: '8px' }}>렌더링 오류</p>
            <p style={{ fontSize: '14px', color: '#4b5563' }}>{error}</p>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          pointerEvents: 'none',
          border: '1px solid #E0E0E0',
          opacity: 1,
          visibility: 'visible',
          position: 'relative',
          zIndex: 1
        } as React.CSSProperties}
      />
    </div>
  );
}

