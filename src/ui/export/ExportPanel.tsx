/**
 * ExportPanel Component - 내보내기 패널
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FilePdf, FileImage, Check } from 'phosphor-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Document, ExportOptions } from '../../core/model/types';
import { exportDocument } from '../../core/io/exportEngine';
import { downloadBlob, downloadUint8Array } from '../../utils/fileDownload';

interface ExportPanelProps {
  document: Document;
  pdfProxy: PDFDocumentProxy;
  currentPageIndex: number;
  onClose: () => void;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function ExportPanel({ document, pdfProxy, currentPageIndex, onClose, insertedPdfProxies }: ExportPanelProps) {
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [pageRange, setPageRange] = useState<'all' | 'current'>('all');
  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(90);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);

      const options: ExportOptions = {
        format,
        pages: pageRange === 'all' ? 'all' : [currentPageIndex],
        dpi: dpi,
        quality: format === 'jpeg' ? quality / 100 : undefined,
        includeAnnotations: true,
        includeRasterLayers: true,
      };

      setProgress(30);
      const result = await exportDocument(document, pdfProxy, options, insertedPdfProxies);
      setProgress(90);

      const extension = format === 'pdf' ? 'pdf' : format;

      if (result instanceof Uint8Array) {
        const filename = `${document.name}_exported.${extension}`;
        const mimeType = 'application/pdf';
        downloadUint8Array(result, filename, mimeType);
      } else if (Array.isArray(result)) {
        result.forEach((blob, index) => {
          const pageNum = pageRange === 'all' ? index + 1 : currentPageIndex + 1;
          const filename = `${document.name}_page${pageNum}.${extension}`;
          downloadBlob(blob, filename);
        });
      } else {
        const filename = `${document.name}_page${currentPageIndex + 1}.${extension}`;
        downloadBlob(result, filename);
      }

      setProgress(100);
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsExporting(false);
    }
  };

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid #e5e7eb',
          width: '100%',
          maxWidth: '450px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px',
          backgroundColor: 'white',
          borderBottom: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FilePdf size={18} weight="bold" color="white" />
            </div>
            <h2 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#1f2937',
              margin: 0
            }}>내보내기</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} weight="bold" color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Format Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px'
            }}>파일 형식</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'pdf', icon: FilePdf, label: 'PDF', bg: '#a855f7', shadow: 'rgba(168, 85, 247, 0.3)' },
                { value: 'png', icon: FileImage, label: 'PNG', bg: '#3b82f6', shadow: 'rgba(59, 130, 246, 0.3)' },
                { value: 'jpeg', icon: FileImage, label: 'JPEG', bg: '#10b981', shadow: 'rgba(16, 185, 129, 0.3)' },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = format === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value as any)}
                    disabled={isExporting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isSelected ? opt.bg : '#f3f4f6',
                      color: isSelected ? 'white' : '#6b7280',
                      boxShadow: isSelected ? `0 4px 12px ${opt.shadow}` : 'none'
                    }}
                  >
                    <Icon size={18} weight="bold" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Range */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px'
            }}>페이지 범위</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 'all', label: `전체 (${document.pages.length}p)` },
                { value: 'current', label: `현재 (${currentPageIndex + 1}p)` },
              ].map((opt) => {
                const isSelected = pageRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPageRange(opt.value as any)}
                    disabled={isExporting}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      backgroundColor: isSelected ? '#1f2937' : '#f3f4f6',
                      color: isSelected ? 'white' : '#6b7280',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quality */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px'
            }}>품질</label>
            {format === 'jpeg' ? (
              <div style={{ 
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                padding: '12px'
              }}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={isExporting}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    appearance: 'none',
                    backgroundColor: '#e5e7eb',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '8px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <span>낮음</span>
                  <span style={{ fontWeight: 'bold', color: '#a855f7' }}>{quality}%</span>
                  <span>높음</span>
                </div>
              </div>
            ) : (
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                disabled={isExporting}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#1f2937',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="72">표준 (72 DPI)</option>
                <option value="150">보통 (150 DPI)</option>
                <option value="300">고품질 (300 DPI)</option>
                <option value="600">최고품질 (600 DPI)</option>
              </select>
            )}
          </div>

          {/* Progress */}
          {isExporting && (
            <div style={{
              backgroundColor: '#eff6ff',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#1f2937'
              }}>
                <span>내보내는 중...</span>
                <span style={{ color: '#3b82f6' }}>{progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#bfdbfe',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #a855f7)',
                    borderRadius: '4px',
                    transition: 'width 0.3s',
                    width: `${progress}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <Check size={18} weight="bold" color="#16a34a" />
              <p style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: '#15803d'
              }}>내보내기 완료!</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: 'white',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || success}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              color: 'white',
              cursor: isExporting || success ? 'not-allowed' : 'pointer',
              opacity: isExporting || success ? 0.5 : 1,
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            {isExporting ? '내보내는 중...' : success ? '완료!' : '내보내기'}
          </button>
        </div>
      </div>
    </div>
  );

  const modalRoot = window.document.getElementById('modal-root') || window.document.body;
  return createPortal(modalContent, modalRoot);
}
