/**
 * AnnotationStylePanel Component - 주석 스타일링 패널
 */

import { useState } from 'react';
import {
  TextT,
  Circle,
  Minus
} from 'phosphor-react';
import type { AnnotationStyle } from '../../core/model/types';

interface AnnotationStylePanelProps {
  selectedAnnotations: any[];
  onStyleChange: (style: Partial<AnnotationStyle>) => void;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
  '#A52A2A', '#808080', '#FFFFFF', '#000080', '#008000'
];

const STROKE_WIDTHS = [1, 2, 3, 4, 5, 6, 8, 10];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32];

export function AnnotationStylePanel({
  selectedAnnotations,
  onStyleChange
}: AnnotationStylePanelProps) {
  const [activeTab, setActiveTab] = useState<'stroke' | 'fill' | 'text'>('stroke');

  if (selectedAnnotations.length === 0) {
    return null;
  }

  const handleColorChange = (color: string) => {
    if (activeTab === 'stroke') {
      onStyleChange({ stroke: color });
    } else if (activeTab === 'fill') {
      onStyleChange({ fill: color });
    }
  };

  const handleStrokeWidthChange = (width: number) => {
    onStyleChange({ strokeWidth: width });
  };

  const handleFontSizeChange = (size: number) => {
    onStyleChange({ fontSize: size });
  };

  const handleFontFamilyChange = (family: string) => {
    onStyleChange({ fontFamily: family });
  };

  return (
    <div style={{
      width: '280px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#374151'
        }}>
          스타일 설정
        </h3>
        <p style={{
          margin: '4px 0 0 0',
          fontSize: '12px',
          color: '#6B7280'
        }}>
          {selectedAnnotations.length}개 주석 선택됨
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB'
      }}>
        {[
          { id: 'stroke', label: '선', icon: Minus },
          { id: 'fill', label: '채우기', icon: Circle },
          { id: 'text', label: '텍스트', icon: TextT }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'stroke' | 'fill' | 'text')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              backgroundColor: activeTab === id ? '#3B82F6' : 'transparent',
              color: activeTab === id ? 'white' : '#6B7280',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.2s'
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {activeTab === 'stroke' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                선 색상
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px'
              }}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '2px solid #E5E7EB',
                      backgroundColor: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                선 굵기
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px'
              }}>
                {STROKE_WIDTHS.map((width) => (
                  <button
                    key={width}
                    onClick={() => handleStrokeWidthChange(width)}
                    style={{
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {width}px
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fill' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                채우기 색상
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px'
              }}>
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '2px solid #E5E7EB',
                      backgroundColor: color,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={() => handleColorChange('transparent')}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px dashed #E5E7EB',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#6B7280',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                투명
              </button>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                폰트 크기
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px'
              }}>
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleFontSizeChange(size)}
                    style={{
                      padding: '6px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                폰트 패밀리
              </label>
              <select
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  fontSize: '12px',
                  backgroundColor: 'white'
                }}
              >
                <option value="sans-serif">Sans-serif</option>
                <option value="serif">Serif</option>
                <option value="monospace">Monospace</option>
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
