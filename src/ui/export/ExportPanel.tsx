/**
 * ExportPanel Component - 내보내기 패널
 *
 * 추출된 모듈:
 *  - useExportHandler: 내보내기 비즈니스 로직 (페이지 범위 파싱, 실행, 다운로드)
 *  - ExportProgressIndicator: 진행률 + 성공 표시
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FilePdf, FileImage } from 'phosphor-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { Document } from '../../core/model/types';
import { useExportHandler } from '../hooks/useExportHandler';
import { ExportProgressIndicator } from './ExportProgressIndicator';

interface ExportPanelProps {
  document: Document;
  pdfProxy: PDFDocumentProxy;
  currentPageIndex: number;
  onClose: () => void;
  insertedPdfProxies?: Map<string, PDFDocumentProxy>;
}

export function ExportPanel({ document, pdfProxy, currentPageIndex, onClose, insertedPdfProxies }: ExportPanelProps) {
  const [format, setFormat] = useState<'pdf' | 'png' | 'jpeg'>('pdf');
  const [pageRange, setPageRange] = useState<'all' | 'current' | 'custom'>('all');
  const [customPageRange, setCustomPageRange] = useState('');
  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(90);
  const [useZip, setUseZip] = useState(true);

  const { isExporting, progress, success, pages, handleExport } = useExportHandler({
    document,
    pdfProxy,
    currentPageIndex,
    onClose,
    insertedPdfProxies,
  });

  const onExportClick = () => handleExport(format, pageRange, customPageRange, dpi, quality, useZip);

  const tabButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '6px 8px',
    borderRadius: '2px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    backgroundColor: isSelected ? '#E0E0E0' : 'transparent',
    color: '#333333',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: '#333333',
    marginBottom: '8px',
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 999999, backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#F5F5F5', borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #D0D0D0',
          width: '100%', maxWidth: '420px', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '8px 12px', backgroundColor: '#F5F5F5',
          borderBottom: '1px solid #D0D0D0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '40px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePdf size={16} weight="regular" color="#333333" />
            <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#333333', margin: 0 }}>내보내기</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', border: 'none',
              backgroundColor: 'transparent', color: '#333333', cursor: 'pointer',
            }}
          >
            <X size={16} weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px', backgroundColor: 'white' }}>
          {/* Format Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>파일 형식</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { value: 'pdf' as const, icon: FilePdf, label: 'PDF' },
                { value: 'png' as const, icon: FileImage, label: 'PNG' },
                { value: 'jpeg' as const, icon: FileImage, label: 'JPEG' },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    disabled={isExporting}
                    style={{ ...tabButtonStyle(format === opt.value), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Icon size={14} weight="regular" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Page Range */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>페이지 범위</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {[
                { value: 'all' as const, label: `전체 (${pages.length}p)` },
                { value: 'current' as const, label: `현재 (${currentPageIndex + 1}p)` },
                { value: 'custom' as const, label: '직접 설정' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPageRange(opt.value)}
                  disabled={isExporting}
                  style={tabButtonStyle(pageRange === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {pageRange === 'custom' && (
              <input
                type="text"
                value={customPageRange}
                onChange={(e) => setCustomPageRange(e.target.value)}
                placeholder="예: 1-5, 1,3,5, 1-3,5-7"
                disabled={isExporting}
                style={{
                  width: '100%', padding: '6px 8px', fontSize: '12px',
                  borderRadius: '2px', border: '1px solid #D0D0D0',
                  backgroundColor: 'white', color: '#333333', outline: 'none',
                }}
              />
            )}
          </div>

          {/* ZIP Download Option */}
          {(format === 'png' || format === 'jpeg') && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 500, color: '#333333', cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={useZip}
                  onChange={(e) => setUseZip(e.target.checked)}
                  disabled={isExporting || pageRange === 'current'}
                  style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                />
                <span>복수 페이지 ZIP 파일로 다운로드</span>
              </label>
            </div>
          )}

          {/* Quality */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>품질</label>
            {format === 'jpeg' ? (
              <div style={{ backgroundColor: '#F5F5F5', borderRadius: '2px', padding: '8px' }}>
                <input
                  type="range" min="10" max="100" value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={isExporting}
                  style={{ width: '100%', height: '4px', borderRadius: '2px', appearance: 'none', backgroundColor: '#D0D0D0', outline: 'none', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#666666' }}>
                  <span>낮음</span>
                  <span style={{ fontWeight: 500, color: '#333333' }}>{quality}%</span>
                  <span>높음</span>
                </div>
              </div>
            ) : (
              <select
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
                disabled={isExporting}
                style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '2px', border: '1px solid #D0D0D0', backgroundColor: 'white', color: '#333333', cursor: 'pointer', outline: 'none' }}
              >
                <option value="72">표준 (72 DPI)</option>
                <option value="150">보통 (150 DPI)</option>
                <option value="300">고품질 (300 DPI)</option>
                <option value="600">최고품질 (600 DPI)</option>
              </select>
            )}
          </div>

          <ExportProgressIndicator isExporting={isExporting} progress={progress} success={success} />
        </div>

        {/* Actions */}
        <div style={{
          padding: '8px 12px', backgroundColor: '#F5F5F5',
          borderTop: '1px solid #D0D0D0', display: 'flex', gap: '4px', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '2px', border: 'none', backgroundColor: 'transparent', color: '#333333', cursor: 'pointer' }}
          >
            취소
          </button>
          <button
            onClick={onExportClick}
            disabled={isExporting || success}
            style={{
              padding: '6px 12px', fontSize: '12px', fontWeight: 500, borderRadius: '2px',
              border: 'none', backgroundColor: '#333333', color: 'white',
              cursor: isExporting || success ? 'not-allowed' : 'pointer',
              opacity: isExporting || success ? 0.5 : 1,
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
