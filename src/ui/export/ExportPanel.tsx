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
import { usePageStore } from '../../state/stores/PageStore';
import JSZip from 'jszip';

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
  const [useZip, setUseZip] = useState(true); // 기본값: 체크됨
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  
  // PageStore에서 실제 페이지 데이터 가져오기
  const { pages } = usePageStore();
  
  // 페이지 범위 파싱 함수 (예: "1-5", "1,3,5", "1-3,5-7")
  const parsePageRange = (range: string, totalPages: number): number[] => {
    if (!range.trim()) return [];
    
    const pages: number[] = [];
    const parts = range.split(',');
    
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(s => parseInt(s.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          const startIdx = Math.max(1, Math.min(start, totalPages)) - 1; // 0-based
          const endIdx = Math.max(1, Math.min(end, totalPages)) - 1; // 0-based
          for (let i = startIdx; i <= endIdx; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(trimmed, 10);
        if (!isNaN(pageNum)) {
          const idx = Math.max(1, Math.min(pageNum, totalPages)) - 1; // 0-based
          if (!pages.includes(idx)) pages.push(idx);
        }
      }
    }
    
    return pages.sort((a, b) => a - b);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);

      // 페이지 범위 결정
      let selectedPages: number[] | 'all';
      if (pageRange === 'all') {
        selectedPages = 'all';
      } else if (pageRange === 'current') {
        selectedPages = [currentPageIndex];
      } else {
        // custom
        const parsed = parsePageRange(customPageRange, pages.length);
        if (parsed.length === 0) {
          alert('올바른 페이지 범위를 입력해주세요. (예: 1-5, 1,3,5)');
          setIsExporting(false);
          return;
        }
        selectedPages = parsed;
      }

      const options: ExportOptions = {
        format,
        pages: selectedPages,
        dpi: dpi,
        quality: format === 'jpeg' ? quality / 100 : undefined,
        includeAnnotations: true,
        includeRasterLayers: true,
      };

      setProgress(10);
      const result = await exportDocument(pages, pdfProxy, options, insertedPdfProxies);
      setProgress(80);

      const extension = format === 'pdf' ? 'pdf' : format;
      
      // 파일명에서 확장자 제거 (이미 extension에 포함됨)
      const baseName = document.name.replace(/\.[^/.]+$/, '') || 'document';

      if (result instanceof Uint8Array) {
        // PDF 형식인 경우
        const filename = `${baseName}_exported.${extension}`;
        const mimeType = 'application/pdf';
        downloadUint8Array(result, filename, mimeType);
        setProgress(100);
      } else if (Array.isArray(result)) {
        // 여러 페이지 (PNG/JPEG)
        const isMultiplePages = result.length > 1;
        const shouldUseZip = isMultiplePages && useZip && (format === 'png' || format === 'jpeg');
        
        if (shouldUseZip) {
          // ZIP 파일로 묶어서 다운로드
          setProgress(85);
          const zip = new JSZip();
          
          result.forEach((blob, index) => {
            const pageNum = Array.isArray(selectedPages) 
              ? selectedPages[index] + 1 
              : index + 1;
            const filename = `page${pageNum.toString().padStart(3, '0')}.${extension}`;
            zip.file(filename, blob);
          });
          
          setProgress(95);
          const zipBlob = await zip.generateAsync({ type: 'blob' });
          const zipFilename = `${baseName}_pages.zip`;
          downloadBlob(zipBlob, zipFilename);
          setProgress(100);
        } else {
          // 개별 파일로 다운로드 (순차적으로)
          setProgress(85);
          for (let i = 0; i < result.length; i++) {
            const pageNum = Array.isArray(selectedPages) 
              ? selectedPages[i] + 1 
              : i + 1;
            const filename = `${baseName}_page${pageNum}.${extension}`;
            // 작은 딜레이를 두어 브라우저가 각 다운로드를 처리할 수 있도록 함
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            downloadBlob(result[i], filename);
            setProgress(85 + Math.floor((i + 1) / result.length * 15));
          }
          setProgress(100);
        }
      } else {
        // 단일 페이지 (PNG/JPEG)
        const pageNum = Array.isArray(selectedPages) 
          ? selectedPages[0] + 1 
          : currentPageIndex + 1;
        const filename = `${baseName}_page${pageNum}.${extension}`;
        downloadBlob(result, filename);
        setProgress(100);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert(`내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsExporting(false);
      setProgress(0);
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
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: '#F5F5F5',
          borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #D0D0D0',
          width: '100%',
          maxWidth: '420px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#F5F5F5',
          borderBottom: '1px solid #D0D0D0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '40px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FilePdf size={16} weight="regular" color="#333333" />
            <h2 style={{
              fontSize: '13px',
              fontWeight: 500,
              color: '#333333',
              margin: 0
            }}>내보내기</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#333333',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} weight="regular" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '12px', backgroundColor: 'white' }}>
          {/* Format Selection */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#333333',
              marginBottom: '8px'
            }}>파일 형식</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { value: 'pdf', icon: FilePdf, label: 'PDF' },
                { value: 'png', icon: FileImage, label: 'PNG' },
                { value: 'jpeg', icon: FileImage, label: 'JPEG' },
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
                      gap: '4px',
                      padding: '6px 8px',
                      borderRadius: '2px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease-in-out',
                      backgroundColor: isSelected ? '#E0E0E0' : 'transparent',
                      color: '#333333'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isExporting) {
                        e.currentTarget.style.backgroundColor = '#F0F0F0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
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
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#333333',
              marginBottom: '8px'
            }}>페이지 범위</label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {[
                { value: 'all', label: `전체 (${pages.length}p)` },
                { value: 'current', label: `현재 (${currentPageIndex + 1}p)` },
                { value: 'custom', label: '직접 설정' },
              ].map((opt) => {
                const isSelected = pageRange === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setPageRange(opt.value as any)}
                    disabled={isExporting}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '2px',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease-in-out',
                      backgroundColor: isSelected ? '#E0E0E0' : 'transparent',
                      color: '#333333'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isExporting) {
                        e.currentTarget.style.backgroundColor = '#F0F0F0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {pageRange === 'custom' && (
              <input
                type="text"
                value={customPageRange}
                onChange={(e) => setCustomPageRange(e.target.value)}
                placeholder="예: 1-5, 1,3,5, 1-3,5-7"
                disabled={isExporting}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '2px',
                  border: '1px solid #D0D0D0',
                  backgroundColor: 'white',
                  color: '#333333',
                  outline: 'none'
                }}
              />
            )}
          </div>

          {/* ZIP Download Option (이미지 복수 페이지일 때만) */}
          {(format === 'png' || format === 'jpeg') && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: 500,
                color: '#333333',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={useZip}
                  onChange={(e) => setUseZip(e.target.checked)}
                  disabled={isExporting || pageRange === 'current'}
                  style={{
                    width: '14px',
                    height: '14px',
                    cursor: 'pointer'
                  }}
                />
                <span>복수 페이지 ZIP 파일로 다운로드</span>
              </label>
            </div>
          )}

          {/* Quality */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 500,
              color: '#333333',
              marginBottom: '8px'
            }}>품질</label>
            {format === 'jpeg' ? (
              <div style={{ 
                backgroundColor: '#F5F5F5',
                borderRadius: '2px',
                padding: '8px'
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
                    height: '4px',
                    borderRadius: '2px',
                    appearance: 'none',
                    backgroundColor: '#D0D0D0',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#666666'
                }}>
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
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '12px',
                  borderRadius: '2px',
                  border: '1px solid #D0D0D0',
                  backgroundColor: 'white',
                  color: '#333333',
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
              backgroundColor: '#F5F5F5',
              borderRadius: '2px',
              padding: '8px',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#333333'
              }}>
                <span>내보내는 중...</span>
                <span style={{ color: '#666666' }}>{progress}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#D0D0D0',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#666666',
                    borderRadius: '2px',
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
              gap: '6px',
              padding: '8px',
              backgroundColor: '#F5F5F5',
              border: '1px solid #D0D0D0',
              borderRadius: '2px',
              marginBottom: '12px'
            }}>
              <Check size={14} weight="regular" color="#333333" />
              <p style={{
                margin: 0,
                fontSize: '12px',
                fontWeight: 500,
                color: '#333333'
              }}>내보내기 완료!</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#F5F5F5',
          borderTop: '1px solid #D0D0D0',
          display: 'flex',
          gap: '4px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '2px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#333333',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!isExporting) {
                e.currentTarget.style.backgroundColor = '#E0E0E0';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            취소
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || success}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              borderRadius: '2px',
              border: 'none',
              backgroundColor: '#333333',
              color: 'white',
              cursor: isExporting || success ? 'not-allowed' : 'pointer',
              opacity: isExporting || success ? 0.5 : 1,
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (!isExporting && !success) {
                e.currentTarget.style.backgroundColor = '#1a1a1a';
              }
            }}
            onMouseLeave={(e) => {
              if (!isExporting && !success) {
                e.currentTarget.style.backgroundColor = '#333333';
              }
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
