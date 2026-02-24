/**
 * ExportManager - 확장 가능한 내보내기 관리 서비스
 * 다양한 형식의 내보내기를 통합 관리
 */

import type { ExportFormat } from '../../ui/export/ExportFormatSelector';
import type { Document } from '../model/types';
import { eventBus } from '../events/EventBus';
import { EVENTS } from '../events/EventTypes';

export interface ExportOptions {
  format: ExportFormat;
  pageRange: 'all' | 'current' | 'custom';
  customPageRange: string;
  dpi: number;
  quality: number;
  includeAnnotations: boolean;
  includeLayers: boolean;
  backgroundColor: string;
  transparent: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: Blob;
  error?: string;
  format: ExportFormat;
  timestamp: number;
}

export interface ExportService {
  canExport(format: ExportFormat): boolean;
  export(document: Document, options: ExportOptions): Promise<ExportResult>;
}

export class ExportManager {
  private services = new Map<ExportFormat, ExportService>();
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.loadExportServices();
  }

  /**
   * 내보내기 서비스 등록
   * 새로운 형식 추가 시 기존 코드 수정 없음
   */
  registerService(format: ExportFormat, service: ExportService): void {
    this.services.set(format, service);
  }

  /**
   * 내보내기 실행
   */
  async exportDocument(document: Document, options: ExportOptions): Promise<ExportResult> {
    const { format } = options;

    // 이벤트 발생
    eventBus.emit(EVENTS.EXPORT_STARTED, {
      format,
      options,
      timestamp: Date.now()
    });

    try {
      // 초기화 완료 대기 (race condition 방지)
      await this.initPromise;

      const service = this.services.get(format);
      if (!service) {
        throw new Error(`Export service not found for format: ${format}`);
      }

      if (!service.canExport(format)) {
        throw new Error(`Cannot export to format: ${format}`);
      }

      const result = await service.export(document, options);

      if (result.success) {
        eventBus.emit(EVENTS.EXPORT_COMPLETED, {
          format,
          result,
          timestamp: Date.now()
        });
      } else {
        eventBus.emit(EVENTS.EXPORT_FAILED, {
          format,
          error: result.error || 'Unknown error',
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      eventBus.emit(EVENTS.EXPORT_FAILED, {
        format,
        error: errorMessage,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: errorMessage,
        format,
        timestamp: Date.now()
      };
    }
  }

  /**
   * 지원되는 형식 목록
   */
  getSupportedFormats(): ExportFormat[] {
    return Array.from(this.services.keys());
  }

  /**
   * 형식별 서비스 확인
   */
  canExport(format: ExportFormat): boolean {
    const service = this.services.get(format);
    return service ? service.canExport(format) : false;
  }

  /**
   * 내보내기 서비스 동적 로드 (Promise 캐싱으로 1회만 실행)
   */
  private async loadExportServices(): Promise<void> {
    try {
      // PDF 내보내기 서비스
      const { PDFExporter } = await import('./export/PDFExporter');
      const pdfExporter = new PDFExporter();
      this.registerService('pdf', pdfExporter);

      // 이미지 내보내기 서비스 (PNG, JPEG, WebP)
      const { ImageExporter } = await import('./export/ImageExporter');
      const imageExporter = new ImageExporter();
      this.registerService('png', imageExporter);
      this.registerService('jpeg', imageExporter);
      this.registerService('webp', imageExporter);

      // SVG 내보내기 서비스
      const { SVGExporter } = await import('./export/SVGExporter');
      const svgExporter = new SVGExporter();
      this.registerService('svg', svgExporter);

      // 이메일 내보내기 서비스
      const { EmailExporter } = await import('./export/EmailExporter');
      const emailExporter = new EmailExporter();
      this.registerService('email', emailExporter);

      // 클라우드 내보내기 서비스
      const { CloudExporter } = await import('./export/CloudExporter');
      const cloudExporter = new CloudExporter();
      this.registerService('cloud', cloudExporter);

    } catch (error) {
      console.error('Failed to load export services:', error);

      // 폴백: 기본 서비스 등록
      this.registerFallbackServices();
    }
  }

  /**
   * 폴백 서비스 등록 (로딩 실패 시)
   */
  private registerFallbackServices(): void {
    // PDF 내보내기 서비스
    this.registerService('pdf', {
      canExport: (format) => format === 'pdf',
      export: async (_document, _options) => {
        return {
          success: false,
          error: 'PDF 내보내기 서비스를 로드할 수 없습니다.',
          format: 'pdf',
          timestamp: Date.now()
        };
      }
    });

    // 이미지 내보내기 서비스
    ['png', 'jpeg', 'webp'].forEach(format => {
      this.registerService(format as ExportFormat, {
        canExport: (f) => f === format,
        export: async (_document, _options) => {
          return {
            success: false,
            error: `${format.toUpperCase()} 내보내기 서비스를 로드할 수 없습니다.`,
            format: format as ExportFormat,
            timestamp: Date.now()
          };
        }
      });
    });

    // SVG 내보내기 서비스
    this.registerService('svg', {
      canExport: (format) => format === 'svg',
      export: async (_document, _options) => {
        return {
          success: false,
          error: 'SVG 내보내기 서비스를 로드할 수 없습니다.',
          format: 'svg',
          timestamp: Date.now()
        };
      }
    });
  }
}
