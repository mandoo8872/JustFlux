/**
 * ExportFormatSelector - 확장 가능한 내보내기 형식 선택
 * 새로운 형식 추가 시 기존 코드 수정 없음
 */

import React, { useState, useCallback } from 'react';
import { FilePdf, FileImage, Envelope, Cloud } from 'phosphor-react';

export type ExportFormat = 'pdf' | 'png' | 'jpeg' | 'svg' | 'webp' | 'email' | 'cloud';

interface ExportFormatOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ReactElement;
  extensions: string[];
  mimeType: string;
}

interface ExportFormatSelectorProps {
  selectedFormat: ExportFormat;
  onFormatChange: (format: ExportFormat) => void;
}

// 확장 가능한 형식 옵션들
const FORMAT_OPTIONS: ExportFormatOption[] = [
  {
    id: 'pdf',
    name: 'PDF',
    description: '벡터 기반 문서 형식',
    icon: <FilePdf size={24} />,
    extensions: ['.pdf'],
    mimeType: 'application/pdf'
  },
  {
    id: 'png',
    name: 'PNG',
    description: '무손실 이미지 형식',
    icon: <FileImage size={24} />,
    extensions: ['.png'],
    mimeType: 'image/png'
  },
  {
    id: 'jpeg',
    name: 'JPEG',
    description: '압축 이미지 형식',
    icon: <FileImage size={24} />,
    extensions: ['.jpg', '.jpeg'],
    mimeType: 'image/jpeg'
  },
  {
    id: 'svg',
    name: 'SVG',
    description: '벡터 이미지 형식',
    icon: <FileImage size={24} />,
    extensions: ['.svg'],
    mimeType: 'image/svg+xml'
  },
  {
    id: 'webp',
    name: 'WebP',
    description: '최신 이미지 형식',
    icon: <FileImage size={24} />,
    extensions: ['.webp'],
    mimeType: 'image/webp'
  },
  {
    id: 'email',
    name: '이메일',
    description: '이메일로 자동 전달',
    icon: <Envelope size={24} />,
    extensions: [],
    mimeType: 'message/rfc822'
  },
  {
    id: 'cloud',
    name: '클라우드',
    description: '클라우드 저장소에 업로드',
    icon: <Cloud size={24} />,
    extensions: [],
    mimeType: 'application/octet-stream'
  }
];

export function ExportFormatSelector({
  selectedFormat,
  onFormatChange
}: ExportFormatSelectorProps) {
  const [hoveredFormat, setHoveredFormat] = useState<ExportFormat | null>(null);

  const handleFormatSelect = useCallback((format: ExportFormat) => {
    onFormatChange(format);
  }, [onFormatChange]);

  const handleFormatHover = useCallback((format: ExportFormat | null) => {
    setHoveredFormat(format);
  }, []);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
        내보내기 형식
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
        {FORMAT_OPTIONS.map((option) => (
          <div
            key={option.id}
            style={{
              padding: '12px',
              border: selectedFormat === option.id 
                ? '2px solid #007bff' 
                : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: selectedFormat === option.id 
                ? '#f0f8ff' 
                : hoveredFormat === option.id 
                  ? '#f8f9fa' 
                  : '#fff',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onClick={() => handleFormatSelect(option.id)}
            onMouseEnter={() => handleFormatHover(option.id)}
            onMouseLeave={() => handleFormatHover(null)}
          >
            <div style={{ marginBottom: '8px', color: '#007bff' }}>
              {option.icon}
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
              {option.name}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {option.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 새로운 형식 등록 함수 (확장성)
export function registerExportFormat(format: ExportFormatOption): void {
  const existingIndex = FORMAT_OPTIONS.findIndex(option => option.id === format.id);
  if (existingIndex >= 0) {
    FORMAT_OPTIONS[existingIndex] = format;
  } else {
    FORMAT_OPTIONS.push(format);
  }
}

// 지원되는 형식 목록 가져오기
export function getSupportedFormats(): ExportFormat[] {
  return FORMAT_OPTIONS.map(option => option.id);
}

// 형식별 MIME 타입 가져오기
export function getMimeType(format: ExportFormat): string {
  const option = FORMAT_OPTIONS.find(opt => opt.id === format);
  return option?.mimeType || 'application/octet-stream';
}
