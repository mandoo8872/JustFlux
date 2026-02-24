/**
 * EmailExporter - 이메일 내보내기 전용 서비스
 * 자동 이메일 전달 기능
 */

import type { Document } from '../../model/types';
import type { ExportOptions, ExportResult } from '../ExportManager';
import { eventBus } from '../../events/EventBus';
import { EVENTS } from '../../events/EventTypes';

export interface EmailOptions extends ExportOptions {
  recipients: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    name: string;
    data: Blob;
    mimeType: string;
  }>;
}

export class EmailExporter {
  /**
   * 이메일 내보내기 가능 여부 확인
   */
  canExport(format: string): boolean {
    return format === 'email';
  }

  /**
   * 이메일 내보내기
   */
  async export(document: Document, options: EmailOptions): Promise<ExportResult> {
    try {
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'email',
        progress: 10,
        message: '이메일 준비 중...'
      });

      // 1. 문서를 첨부 파일로 변환
      const attachments = await this.prepareAttachments(document, options);
      
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'email',
        progress: 50,
        message: '이메일 구성 중...'
      });

      // 2. 이메일 구성
      const emailData = this.composeEmail(options, attachments);
      
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'email',
        progress: 80,
        message: '이메일 전송 중...'
      });

      // 3. 이메일 전송
      const result = await this.sendEmail(emailData);
      
      eventBus.emit(EVENTS.EXPORT_PROGRESS, {
        format: 'email',
        progress: 100,
        message: '이메일 전송 완료'
      });

      return {
        success: result.success,
        data: result.data,
        format: 'email',
        timestamp: Date.now()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '이메일 전송 실패';
      
      eventBus.emit(EVENTS.EXPORT_FAILED, {
        format: 'email',
        error: errorMessage,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: errorMessage,
        format: 'email',
        timestamp: Date.now()
      };
    }
  }

  /**
   * 첨부 파일 준비
   */
  private async prepareAttachments(document: Document, options: EmailOptions): Promise<Array<{
    name: string;
    data: Blob;
    mimeType: string;
  }>> {
    const attachments: Array<{
      name: string;
      data: Blob;
      mimeType: string;
    }> = [];

    // 기존 첨부 파일 추가
    if (options.attachments) {
      attachments.push(...options.attachments);
    }

    // 문서를 PDF로 변환하여 첨부
    try {
      const pdfBlob = await this.convertDocumentToPDF(document, options);
      attachments.push({
        name: `${document.name}.pdf`,
        data: pdfBlob,
        mimeType: 'application/pdf'
      });
    } catch (error) {
      console.warn('Failed to convert document to PDF:', error);
    }

    // 각 페이지를 이미지로 변환하여 첨부 (선택사항)
    if (options.includeLayers) {
      try {
        const imageBlobs = await this.convertPagesToImages(document, options);
        imageBlobs.forEach((blob, index) => {
          attachments.push({
            name: `${document.name}_page_${index + 1}.png`,
            data: blob,
            mimeType: 'image/png'
          });
        });
      } catch (error) {
        console.warn('Failed to convert pages to images:', error);
      }
    }

    return attachments;
  }

  /**
   * 문서를 PDF로 변환
   */
  private async convertDocumentToPDF(_document: Document, _options: EmailOptions): Promise<Blob> {
    // PDF 변환 로직 (실제 구현에서는 PDF.js 또는 다른 라이브러리 사용)
    // 임시로 빈 PDF 생성
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(JustFlux Document) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
297
%%EOF`;

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  /**
   * 페이지들을 이미지로 변환
   */
  private async convertPagesToImages(document: Document, _options: EmailOptions): Promise<Blob[]> {
    const images: Blob[] = [];
    
    for (const page of document.pages) {
      // Canvas를 사용한 페이지 렌더링
      const canvas = window.document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) continue;

      canvas.width = page.width;
      canvas.height = page.height;
      
      // 페이지 배경
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 페이지 콘텐츠 렌더링 (실제 구현 필요)
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.fillText(`Page ${page.index + 1}`, 10, 20);
      
      // Canvas를 Blob으로 변환
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob: Blob | null) => {
          if (blob) resolve(blob);
        }, 'image/png');
      });
      
      images.push(blob);
    }
    
    return images;
  }

  /**
   * 이메일 구성
   */
  private composeEmail(options: EmailOptions, attachments: Array<{
    name: string;
    data: Blob;
    mimeType: string;
  }>): {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments: Array<{
      name: string;
      data: Blob;
      mimeType: string;
    }>;
  } {
    return {
      to: options.recipients,
      cc: options.cc,
      bcc: options.bcc,
      subject: options.subject,
      body: options.body,
      attachments
    };
  }

  /**
   * 이메일 전송
   */
  private async sendEmail(emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments: Array<{
      name: string;
      data: Blob;
      mimeType: string;
    }>;
  }): Promise<{ success: boolean; data?: any }> {
    try {
      // Web API를 사용한 이메일 전송
      if ('navigator' in window && 'share' in navigator) {
        // Web Share API 사용
        const shareData = {
          title: emailData.subject,
          text: emailData.body,
          files: emailData.attachments.map(att => new File([att.data], att.name, { type: att.mimeType }))
        };
        
        await navigator.share(shareData);
        return { success: true };
      } else {
        // mailto: 링크 사용 (첨부 파일 지원 안함)
        const mailtoUrl = this.createMailtoUrl(emailData);
        window.open(mailtoUrl, '_blank');
        return { success: true };
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false };
    }
  }

  /**
   * mailto: URL 생성
   */
  private createMailtoUrl(emailData: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
  }): string {
    const params = new URLSearchParams();
    
    params.set('to', emailData.to.join(','));
    if (emailData.cc) params.set('cc', emailData.cc.join(','));
    if (emailData.bcc) params.set('bcc', emailData.bcc.join(','));
    params.set('subject', emailData.subject);
    params.set('body', emailData.body);
    
    return `mailto:?${params.toString()}`;
  }
}
