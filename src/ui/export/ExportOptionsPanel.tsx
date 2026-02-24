/**
 * ExportOptionsPanel - 확장 가능한 내보내기 옵션 패널
 * 형식별 옵션을 동적으로 렌더링
 */

import { useState, useCallback } from 'react';
import type { ExportFormat } from './ExportFormatSelector';

interface ExportOptions {
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

interface ExportOptionsPanelProps {
  format: ExportFormat;
  options: ExportOptions;
  onOptionsChange: (options: Partial<ExportOptions>) => void;
}

export function ExportOptionsPanel({
  format,
  options,
  onOptionsChange
}: ExportOptionsPanelProps) {
  const [localOptions, setLocalOptions] = useState<ExportOptions>(options);

  // 옵션 변경 핸들러
  const handleOptionChange = useCallback((key: keyof ExportOptions, value: any) => {
    const newOptions = { ...localOptions, [key]: value };
    setLocalOptions(newOptions);
    onOptionsChange(newOptions);
  }, [localOptions, onOptionsChange]);

  // 형식별 옵션 렌더링
  const renderFormatSpecificOptions = useCallback(() => {
    switch (format) {
      case 'pdf':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={localOptions.includeAnnotations}
                onChange={(e) => handleOptionChange('includeAnnotations', e.target.checked)}
              />
              주석 포함
            </label>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={localOptions.includeLayers}
                onChange={(e) => handleOptionChange('includeLayers', e.target.checked)}
              />
              레이어 포함
            </label>
          </div>
        );
      
      case 'png':
      case 'jpeg':
      case 'webp':
        return (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                DPI: {localOptions.dpi}
              </label>
              <input
                type="range"
                min="72"
                max="600"
                value={localOptions.dpi}
                onChange={(e) => handleOptionChange('dpi', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px' }}>
                품질: {localOptions.quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={localOptions.quality}
                onChange={(e) => handleOptionChange('quality', parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={localOptions.transparent}
                onChange={(e) => handleOptionChange('transparent', e.target.checked)}
              />
              투명 배경
            </label>
          </div>
        );
      
      case 'svg':
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              <input
                type="checkbox"
                checked={localOptions.includeAnnotations}
                onChange={(e) => handleOptionChange('includeAnnotations', e.target.checked)}
              />
              주석 포함
            </label>
          </div>
        );
      
      default:
        return null;
    }
  }, [format, localOptions, handleOptionChange]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
        내보내기 옵션
      </h3>
      
      {/* 페이지 범위 선택 */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          페이지 범위
        </label>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="radio"
              name="pageRange"
              value="all"
              checked={localOptions.pageRange === 'all'}
              onChange={(e) => handleOptionChange('pageRange', e.target.value)}
            />
            전체 페이지
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="radio"
              name="pageRange"
              value="current"
              checked={localOptions.pageRange === 'current'}
              onChange={(e) => handleOptionChange('pageRange', e.target.value)}
            />
            현재 페이지
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="radio"
              name="pageRange"
              value="custom"
              checked={localOptions.pageRange === 'custom'}
              onChange={(e) => handleOptionChange('pageRange', e.target.value)}
            />
            사용자 지정
          </label>
        </div>
        
        {localOptions.pageRange === 'custom' && (
          <input
            type="text"
            placeholder="예: 1-3, 5, 7-10"
            value={localOptions.customPageRange}
            onChange={(e) => handleOptionChange('customPageRange', e.target.value)}
            style={{
              marginTop: '8px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              width: '100%'
            }}
          />
        )}
      </div>
      
      {/* 형식별 옵션 */}
      {renderFormatSpecificOptions()}
    </div>
  );
}
