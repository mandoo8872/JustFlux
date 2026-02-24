/**
 * Page Renderer - PDF 페이지 + 주석 + 래스터 레이어를 Canvas로 렌더링
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Page, Annotation, TextAnnotation, ExportOptions } from '../model/types';
import { renderPdfPage } from '../pdf/pdfLoader';

/**
 * 페이지를 Canvas로 렌더링 (PDF + Annotations + Raster Layers)
 */
export async function renderPageToCanvas(
  page: Page,
  pdfProxy: PDFDocumentProxy,
  options: ExportOptions,
  insertedPdfProxies?: Map<string, PDFDocumentProxy>
): Promise<HTMLCanvasElement> {
  const scale = options.dpi ? options.dpi / 72 : 2.0;

  const canvas = document.createElement('canvas');

  // 1. Render original PDF
  if (page.pdfRef) {
    // Use the correct PDF proxy for inserted pages
    const correctPdfProxy = insertedPdfProxies?.get(page.id) || pdfProxy;
    const pageIndex = page.pdfRef.sourceIndex - 1; // Convert to 0-based index
    await renderPdfPage(correctPdfProxy, pageIndex, canvas, scale);
  } else {
    // For blank pages, just create a white canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, page.width * scale, page.height * scale);
    }
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }

  // 2. Draw annotations
  if (options.includeAnnotations !== false) {
    for (const annotation of page.layers.annotations) {
      drawAnnotation(ctx, annotation, scale);
    }
  }

  // 3. Composite raster layers
  if (options.includeRasterLayers !== false) {
    for (const rasterLayer of page.layers.rasters) {
      if (!rasterLayer.visible || !rasterLayer.canvasData) continue;

      await compositeRasterLayer(ctx, rasterLayer.canvasData, rasterLayer.opacity, scale);
    }
  }

  return canvas;
}

/**
 * 래스터 레이어 합성
 */
async function compositeRasterLayer(
  ctx: CanvasRenderingContext2D,
  dataUrl: string,
  opacity: number,
  scale: number
): Promise<void> {
  const image = new Image();
  image.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = reject;
  });

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(image, 0, 0, image.width * scale, image.height * scale);
  ctx.restore();
}

/**
 * Annotation을 Canvas에 그리기
 */
function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number
): void {
  const bbox = {
    x: annotation.bbox.x * scale,
    y: annotation.bbox.y * scale,
    width: annotation.bbox.width * scale,
    height: annotation.bbox.height * scale,
  };

  ctx.save();

  switch (annotation.type) {
    case 'text': {
      const text = annotation as TextAnnotation;
      const fontSize = text.style.fontSize * scale;
      ctx.font = `${text.style.fontWeight || 'normal'} ${fontSize}px ${text.style.fontFamily}`;
      ctx.fillStyle = text.style.stroke || '#000000';
      ctx.textAlign = text.style.textAlign || 'left';
      ctx.textBaseline = 'top';

      // Draw background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);

      // Draw text
      ctx.fillStyle = text.style.stroke || '#000000';
      const lines = text.content.split('\n');
      const lineHeight = fontSize * 1.2;

      lines.forEach((line, i) => {
        ctx.fillText(line, bbox.x + 8, bbox.y + 8 + i * lineHeight, bbox.width - 16);
      });
      break;
    }

    case 'highlight': {
      ctx.fillStyle = annotation.style?.fill || '#FFFF00';
      ctx.globalAlpha = annotation.opacity || 0.3;
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
      break;
    }

    case 'rectangle': {
      ctx.strokeStyle = annotation.style?.stroke || '#000000';
      ctx.lineWidth = (annotation.style?.strokeWidth || 2) * scale;

      if (annotation.style?.fill && annotation.style.fill !== 'transparent') {
        ctx.fillStyle = annotation.style.fill;
        ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height);
      }

      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);
      break;
    }

    case 'ellipse': {
      ctx.strokeStyle = annotation.style?.stroke || '#000000';
      ctx.lineWidth = (annotation.style?.strokeWidth || 2) * scale;

      ctx.beginPath();
      ctx.ellipse(
        bbox.x + bbox.width / 2,
        bbox.y + bbox.height / 2,
        bbox.width / 2,
        bbox.height / 2,
        0,
        0,
        Math.PI * 2
      );

      if (annotation.style?.fill && annotation.style.fill !== 'transparent') {
        ctx.fillStyle = annotation.style.fill;
        ctx.fill();
      }

      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

/**
 * Canvas를 이미지 바이트로 변환
 */
export async function canvasToImageBytes(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  quality?: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to blob'));
          return;
        }

        const arrayBuffer = await blob.arrayBuffer();
        resolve(new Uint8Array(arrayBuffer));
      },
      format === 'jpeg' ? 'image/jpeg' : 'image/png',
      quality
    );
  });
}




