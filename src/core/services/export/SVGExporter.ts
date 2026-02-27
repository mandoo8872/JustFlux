/**
 * SVGExporter - SVG 내보내기 전용 서비스
 * 벡터 기반 SVG 문서 생성
 */

import type { Document } from '../../model/types';
import type { ExportOptions, ExportResult } from '../ExportManager';
import { eventBus } from '../../events/EventBus';
import { EVENTS } from '../../events/EventTypes';

export class SVGExporter {
  /**
   * SVG 내보내기 가능 여부 확인
   */
  canExport(format: string): boolean {
    return format === 'svg';
  }

  /**
   * SVG 내보내기
   */
  async export(document: Document, options: ExportOptions): Promise<ExportResult> {
    try {
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'svg',
        progress: 10,
        message: 'SVG 생성 시작...'
      });

      // 1. 페이지 범위 결정
      const targetPages = this.getTargetPages(document, options);

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'svg',
        progress: 30,
        message: 'SVG 구조 생성 중...'
      });

      // 2. SVG 문서 생성
      const svgContent = await this.generateSVG(document, targetPages, options);

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'svg',
        progress: 90,
        message: 'SVG 최적화 중...'
      });

      // 3. SVG 최적화
      const optimizedSVG = this.optimizeSVG(svgContent);

      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'svg',
        progress: 100,
        message: 'SVG 내보내기 완료'
      });

      return {
        success: true,
        data: new Blob([optimizedSVG], { type: 'image/svg+xml' }),
        format: 'svg',
        timestamp: Date.now()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SVG 내보내기 실패';

      eventBus.emit(EVENTS.EXPORT_FAILED, {
        format: 'svg',
        error: errorMessage,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: errorMessage,
        format: 'svg',
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
   * SVG 문서 생성
   */
  private async generateSVG(document: Document, targetPages: number[], options: ExportOptions): Promise<string> {
    const { backgroundColor, transparent } = options;

    // 전체 문서 크기 계산
    const totalWidth = Math.max(...document.pages.map(p => p.width));
    const totalHeight = document.pages.reduce((sum, p) => sum + p.height, 0);

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${totalWidth}" 
     height="${totalHeight}"
     viewBox="0 0 ${totalWidth} ${totalHeight}">`;

    // 배경 설정
    if (!transparent && backgroundColor) {
      svgContent += `
  <rect width="100%" height="100%" fill="${backgroundColor}"/>`;
    }

    // 각 페이지 렌더링
    let currentY = 0;
    for (const pageIndex of targetPages) {
      const page = document.pages[pageIndex];

      svgContent += `
  <!-- Page ${pageIndex + 1} -->
  <g id="page-${pageIndex + 1}" transform="translate(0, ${currentY})">`;

      // 페이지 콘텐츠
      svgContent += await this.renderPageContent(page);

      // 주석 렌더링
      if (options.includeAnnotations && page.layers?.annotations) {
        svgContent += this.renderAnnotations(page.layers.annotations);
      }

      svgContent += `
  </g>`;

      currentY += page.height;
    }

    svgContent += `
</svg>`;

    return svgContent;
  }

  /**
   * 페이지 콘텐츠 렌더링
   */
  private async renderPageContent(page: any): Promise<string> {
    // PDF 페이지나 이미지를 SVG로 변환
    // 실제 구현에서는 PDF.js나 이미지 로딩 로직이 필요
    return `
    <!-- Page content placeholder -->
    <rect width="${page.width}" height="${page.height}" 
          fill="white" stroke="#ccc" stroke-width="1"/>`;
  }

  /**
   * 주석 렌더링
   */
  private renderAnnotations(annotations: any[]): string {
    let svgContent = '';

    for (const annotation of annotations) {
      svgContent += this.renderAnnotation(annotation);
    }

    return svgContent;
  }

  /**
   * 개별 주석 렌더링
   */
  private renderAnnotation(annotation: any): string {
    const { type } = annotation;

    switch (type) {
      case 'text':
        return this.renderTextAnnotation(annotation);
      case 'highlight':
        return this.renderHighlightAnnotation(annotation);
      case 'rectangle':
        return this.renderRectangleAnnotation(annotation);
      case 'ellipse':
        return this.renderEllipseAnnotation(annotation);
      case 'arrow':
      case 'line':
        return this.renderArrowAnnotation(annotation);
      case 'star':
        return this.renderStarAnnotation(annotation);
      case 'lightning':
        return this.renderLightningAnnotation(annotation);
      case 'table':
        return this.renderTableAnnotation(annotation);
      default:
        return `<!-- Unknown annotation type: ${type} -->`;
    }
  }

  /**
   * 텍스트 주석 렌더링
   */
  private renderTextAnnotation(annotation: any): string {
    const { bbox, content, style } = annotation;
    const { x, y } = bbox;

    return `
    <text x="${x}" y="${y + (style.fontSize || 12)}" 
          font-family="${style.fontFamily || 'Arial'}" 
          font-size="${style.fontSize || 12}" 
          fill="${style.fill || '#000000'}"
          text-anchor="${style.textAlign === 'center' ? 'middle' : style.textAlign === 'right' ? 'end' : 'start'}">
      ${this.escapeXml(content)}
    </text>`;
  }

  /**
   * 하이라이트 주석 렌더링
   */
  private renderHighlightAnnotation(annotation: any): string {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;

    return `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" 
          fill="${style.fill || '#FFFF00'}" 
          opacity="${style.opacity || 0.3}"/>`;
  }

  /**
   * 사각형 주석 렌더링
   */
  private renderRectangleAnnotation(annotation: any): string {
    const { bbox, style, cornerRadius } = annotation;
    const { x, y, width, height } = bbox;

    let rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}"`;

    if (cornerRadius) {
      rect += ` rx="${cornerRadius}" ry="${cornerRadius}"`;
    }

    if (style.fill) {
      rect += ` fill="${style.fill}"`;
    }

    if (style.stroke) {
      rect += ` stroke="${style.stroke}" stroke-width="${style.strokeWidth || 1}"`;
    }

    rect += '/>';
    return rect;
  }

  /**
   * 타원 주석 렌더링
   */
  private renderEllipseAnnotation(annotation: any): string {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = width / 2;
    const radiusY = height / 2;

    let ellipse = `<ellipse cx="${centerX}" cy="${centerY}" rx="${radiusX}" ry="${radiusY}"`;

    if (style.fill) {
      ellipse += ` fill="${style.fill}"`;
    }

    if (style.stroke) {
      ellipse += ` stroke="${style.stroke}" stroke-width="${style.strokeWidth || 1}"`;
    }

    ellipse += '/>';
    return ellipse;
  }

  /**
   * 화살표 주석 렌더링
   */
  private renderArrowAnnotation(annotation: any): string {
    const { startPoint, endPoint, style, controlPoint, type } = annotation;
    const strokeColor = style.stroke || '#000000';
    const sw = style.strokeWidth || 2;
    const dashArray = style.strokeDasharray ? ` stroke-dasharray="${style.strokeDasharray}"` : '';
    const hasCurve = controlPoint != null;

    // Build path
    let pathD: string;
    if (hasCurve) {
      pathD = `M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`;
    } else {
      pathD = `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
    }

    let svg = `
    <path d="${pathD}" fill="none"
          stroke="${strokeColor}" stroke-width="${sw}"
          stroke-linecap="round"${dashArray}/>`;

    // Arrow head (only for arrow type)
    if (type === 'arrow') {
      // Tangent direction at endpoint
      const tx = hasCurve ? endPoint.x - controlPoint.x : endPoint.x - startPoint.x;
      const ty = hasCurve ? endPoint.y - controlPoint.y : endPoint.y - startPoint.y;
      const angle = Math.atan2(ty, tx);
      const arrowLength = 10;
      const arrowAngle = Math.PI / 6;

      const ax1 = endPoint.x - arrowLength * Math.cos(angle - arrowAngle);
      const ay1 = endPoint.y - arrowLength * Math.sin(angle - arrowAngle);
      const ax2 = endPoint.x - arrowLength * Math.cos(angle + arrowAngle);
      const ay2 = endPoint.y - arrowLength * Math.sin(angle + arrowAngle);

      svg += `
    <polygon points="${endPoint.x},${endPoint.y} ${ax1},${ay1} ${ax2},${ay2}" 
             fill="${strokeColor}"/>`;
    }

    return svg;
  }

  /**
   * 별 주석 렌더링
   */
  private renderStarAnnotation(annotation: any): string {
    const { bbox, style, points, innerRadius } = annotation;
    const { x, y, width, height } = bbox;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const outerRadius = Math.min(width, height) / 2;
    const innerRadiusValue = outerRadius * (innerRadius || 0.5);
    const pointCount = points || 5;

    let path = `M ${centerX} ${centerY - outerRadius}`;

    for (let i = 1; i < pointCount * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadiusValue;
      const angle = (Math.PI / pointCount) * i - Math.PI / 2;
      const pointX = centerX + radius * Math.cos(angle);
      const pointY = centerY + radius * Math.sin(angle);
      path += ` L ${pointX} ${pointY}`;
    }

    path += ' Z';

    return `
    <path d="${path}" 
          fill="${style.fill || 'transparent'}" 
          stroke="${style.stroke || '#000000'}" 
          stroke-width="${style.strokeWidth || 1}"/>`;
  }

  /**
   * 번개 주석 렌더링
   */
  private renderLightningAnnotation(annotation: any): string {
    const { bbox, style } = annotation;
    const { x, y, width, height } = bbox;

    const path = `M ${x + width * 0.4} ${y + height * 0.05} 
                  L ${x + width * 0.1} ${y + height * 0.5} 
                  L ${x + width * 0.4} ${y + height * 0.4} 
                  L ${x + width * 0.6} ${y + height * 0.95} 
                  L ${x + width * 0.9} ${y + height * 0.5} 
                  L ${x + width * 0.6} ${y + height * 0.6} Z`;

    return `
    <path d="${path}" 
          fill="${style.fill || '#FFD700'}" 
          stroke="${style.stroke || '#000000'}" 
          stroke-width="${style.strokeWidth || 1}"/>`;
  }

  /**
   * 표 주석 렌더링
   */
  private renderTableAnnotation(annotation: any): string {
    const { bbox, colWidths, rowHeights, cells, borderWidth = 1, borderColor = '#000' } = annotation;
    const { x, y } = bbox;
    const totalW = colWidths.reduce((s: number, w: number) => s + w, 0);
    const totalH = rowHeights.reduce((s: number, h: number) => s + h, 0);

    let svg = '';
    svg += `\n    <rect x="${x}" y="${y}" width="${totalW}" height="${totalH}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}"/>`;

    let cx = x;
    for (let c = 0; c < colWidths.length - 1; c++) {
      cx += colWidths[c];
      svg += `\n    <line x1="${cx}" y1="${y}" x2="${cx}" y2="${y + totalH}" stroke="${borderColor}" stroke-width="${borderWidth * 0.5}"/>`;
    }

    let ry = y;
    for (let r = 0; r < rowHeights.length - 1; r++) {
      ry += rowHeights[r];
      svg += `\n    <line x1="${x}" y1="${ry}" x2="${x + totalW}" y2="${ry}" stroke="${borderColor}" stroke-width="${borderWidth * 0.5}"/>`;
    }

    let cellY = y;
    for (let r = 0; r < cells.length; r++) {
      let cellX = x;
      for (let c = 0; c < cells[r].length; c++) {
        const cell = cells[r][c];
        if (cell.content) {
          const cs = cell.style;
          svg += `\n    <text x="${cellX + 4}" y="${cellY + (cs.fontSize || 12) + 2}" font-family="${cs.fontFamily || 'sans-serif'}" font-size="${cs.fontSize || 12}" fill="${cs.color || '#000'}">${this.escapeXml(cell.content)}</text>`;
        }
        cellX += colWidths[c];
      }
      cellY += rowHeights[r];
    }

    return svg;
  }

  /**
   * SVG 최적화
   */
  private optimizeSVG(svgContent: string): string {
    // 불필요한 공백 제거
    return svgContent.replace(/\s+/g, ' ').trim();
  }

  /**
   * XML 특수 문자 이스케이프
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
