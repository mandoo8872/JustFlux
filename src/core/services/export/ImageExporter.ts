import { logger } from '../../../utils/logger';
/**
 * ImageExporter - 이미지 내보내기 전용 서비스
 * PNG, JPEG, WebP 형식 지원
 */

import type { Document } from '../../model/types';
import type { ExportOptions, ExportResult } from '../ExportManager';
import { eventBus } from '../../events/EventBus';
import { EVENTS } from '../../events/EventTypes';

export class ImageExporter {
  /**
   * 이미지 내보내기 가능 여부 확인
   */
  canExport(format: string): boolean {
    return ['png', 'jpeg', 'webp'].includes(format);
  }

  /**
   * 이미지 내보내기
   */
  async export(document: Document, options: ExportOptions): Promise<ExportResult> {
    try {
      const { format, dpi, quality, transparent, backgroundColor } = options;

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format,
        progress: 10,
        message: '이미지 생성 시작...'
      });

      // 1. 페이지 범위 결정
      const targetPages = this.getTargetPages(document, options);
      
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format,
        progress: 30,
        message: '페이지 렌더링 중...'
      });

      // 2. 각 페이지를 이미지로 렌더링
      const images: Blob[] = [];
      for (let i = 0; i < targetPages.length; i++) {
        const pageIndex = targetPages[i];
        const page = document.pages[pageIndex];
        
        eventBus.emit(EVENTS.EXPORT_PROGRESS, {
          format,
          progress: 30 + (i / targetPages.length) * 50,
          message: `페이지 ${pageIndex + 1} 렌더링 중...`
        });

        const imageBlob = await this.renderPageAsImage(page, {
          format,
          dpi,
          quality,
          transparent,
          backgroundColor
        });
        
        images.push(imageBlob);
      }

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format,
        progress: 90,
        message: '이미지 최적화 중...'
      });

      // 3. 이미지 최적화
      const optimizedImages = await this.optimizeImages(images, options);

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format,
        progress: 100,
        message: '이미지 내보내기 완료'
      });

      // 단일 이미지인 경우 첫 번째 Blob 반환, 여러 이미지인 경우 배열 반환
      if (optimizedImages.length === 1) {
        return {
          success: true,
          data: optimizedImages[0],
          format,
          timestamp: Date.now()
        };
      } else {
        return {
          success: true,
          data: optimizedImages as any, // 여러 이미지 배열
          format,
          timestamp: Date.now()
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이미지 내보내기 실패';
      
      eventBus.emit(EVENTS.EXPORT_FAILED, {
        format: options.format,
        error: errorMessage,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: errorMessage,
        format: options.format,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 대상 페이지 결정
   */
  private getTargetPages(document: Document, options: ExportOptions): number[] {
    const { pageRange, customPageRange } = options;
    
    if (pageRange === 'all') {
      return document.pages.map((_, index) => index);
    } else if (pageRange === 'current') {
      return [0]; // 현재 페이지
    } else if (pageRange === 'custom') {
      return this.parseCustomPageRange(customPageRange, document.pages.length);
    }
    
    return [0];
  }

  /**
   * 페이지를 이미지로 렌더링
   */
  private async renderPageAsImage(page: any, options: {
    format: string;
    dpi: number;
    quality: number;
    transparent: boolean;
    backgroundColor: string;
  }): Promise<Blob> {
    const { format, dpi, quality, transparent, backgroundColor } = options;
    
    // Canvas를 사용한 페이지 렌더링
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context를 가져올 수 없습니다.');
    }

    // DPI에 따른 크기 조정
    const scale = dpi / 96; // 96 DPI 기준
    canvas.width = page.width * scale;
    canvas.height = page.height * scale;
    
    // 배경색 설정
    if (!transparent) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 페이지 콘텐츠 렌더링
    await this.renderPageContent(ctx, page, scale);
    
    // 주석 렌더링
    if (page.layers?.annotations) {
      await this.renderAnnotations(ctx, page.layers.annotations, scale);
    }

    // Canvas를 Blob으로 변환
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          throw new Error('이미지 생성에 실패했습니다.');
        }
      }, this.getMimeType(format), quality / 100);
    });
  }

  /**
   * 페이지 콘텐츠 렌더링
   */
  private async renderPageContent(_ctx: CanvasRenderingContext2D, _page: any, _scale: number): Promise<void> {
    // PDF 페이지 또는 이미지 콘텐츠 렌더링
    // 실제 구현에서는 PDF.js나 이미지 로딩 로직이 필요
    logger.debug('Rendering page content...', _page);
  }

  /**
   * 주석 렌더링
   */
  private async renderAnnotations(ctx: CanvasRenderingContext2D, annotations: any[], scale: number): Promise<void> {
    for (const annotation of annotations) {
      await this.renderAnnotation(ctx, annotation, scale);
    }
  }

  /**
   * 개별 주석 렌더링
   */
  private async renderAnnotation(ctx: CanvasRenderingContext2D, annotation: any, scale: number): Promise<void> {
    const { type } = annotation;
    
    ctx.save();
    ctx.scale(scale, scale);
    
    switch (type) {
      case 'text':
        this.renderTextAnnotation(ctx, annotation);
        break;
      case 'highlight':
        this.renderHighlightAnnotation(ctx, annotation);
        break;
      case 'rectangle':
        this.renderRectangleAnnotation(ctx, annotation);
        break;
      case 'ellipse':
        this.renderEllipseAnnotation(ctx, annotation);
        break;
      case 'arrow':
        this.renderArrowAnnotation(ctx, annotation);
        break;
      default:
        console.warn(`Unknown annotation type: ${type}`);
    }
    
    ctx.restore();
  }

  /**
   * 텍스트 주석 렌더링
   */
  private renderTextAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    const { bbox, content, style } = annotation;
    const { x, y } = bbox;
    
    ctx.font = `${style.fontSize || 12}px ${style.fontFamily || 'Arial'}`;
    ctx.fillStyle = style.fill || '#000000';
    ctx.textAlign = style.textAlign || 'left';
    
    ctx.fillText(content, x, y + (style.fontSize || 12));
  }

  /**
   * 하이라이트 주석 렌더링
   */
  private renderHighlightAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;
    
    ctx.fillStyle = style.fill || '#FFFF00';
    ctx.globalAlpha = style.opacity || 0.3;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
  }

  /**
   * 사각형 주석 렌더링
   */
  private renderRectangleAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;
    
    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fillRect(x, y, width, height);
    }
    
    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth || 1;
      ctx.strokeRect(x, y, width, height);
    }
  }

  /**
   * 타원 주석 렌더링
   */
  private renderEllipseAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fill();
    }
    
    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.strokeWidth || 1;
      ctx.stroke();
    }
  }

  /**
   * 화살표 주석 렌더링
   */
  private renderArrowAnnotation(ctx: CanvasRenderingContext2D, annotation: any): void {
    const { startPoint, endPoint, style } = annotation;
    
    ctx.strokeStyle = style.stroke || '#000000';
    ctx.lineWidth = style.strokeWidth || 2;
    
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    
    // 화살표 머리 그리기
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(
      endPoint.x - arrowLength * Math.cos(angle - arrowAngle),
      endPoint.y - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(endPoint.x, endPoint.y);
    ctx.lineTo(
      endPoint.x - arrowLength * Math.cos(angle + arrowAngle),
      endPoint.y - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  }

  /**
   * 이미지 최적화
   */
  private async optimizeImages(images: Blob[], _options: ExportOptions): Promise<Blob[]> {
    // 이미지 최적화 로직 (압축, 크기 조정 등)
    return images;
  }

  /**
   * MIME 타입 반환
   */
  private getMimeType(format: string): string {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/png';
    }
  }

  /**
   * 사용자 정의 페이지 범위 파싱
   */
  private parseCustomPageRange(range: string, totalPages: number): number[] {
    const pages: number[] = [];
    const parts = range.split(',');
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(n => parseInt(n.trim()) - 1);
        for (let i = start; i <= end; i++) {
          if (i >= 0 && i < totalPages) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(part.trim()) - 1;
        if (pageNum >= 0 && pageNum < totalPages) {
          pages.push(pageNum);
        }
      }
    }
    
    return pages;
  }
}
