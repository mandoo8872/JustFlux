/**
 * ZoomControl Component - 확대/축소 컨트롤
 */

import { MagnifyingGlassMinus, MagnifyingGlassPlus, ArrowsOut } from 'phosphor-react';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitMode: (mode: 'page' | 'width') => void;
  fitMode?: string;
}

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 4.0;
const ZOOM_STEP = 0.1;

export function ZoomControl({ zoom, onZoomChange, onFitMode }: ZoomControlProps) {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + ZOOM_STEP, ZOOM_MAX));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - ZOOM_STEP, ZOOM_MIN));
  };

  const buttonBaseStyle = {
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    border: 'none',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    color: '#6b7280'
  };

  const buttonHoverStyle = {
    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
    color: 'white',
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px'
    }}>
      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_MAX}
        style={{
          ...buttonBaseStyle,
          opacity: zoom >= ZOOM_MAX ? 0.3 : 1,
          cursor: zoom >= ZOOM_MAX ? 'not-allowed' : 'pointer'
        }}
        title="확대"
        onMouseEnter={(e) => {
          if (zoom < ZOOM_MAX) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, buttonBaseStyle);
        }}
      >
        <MagnifyingGlassPlus size={22} weight="duotone" />
      </button>

      {/* Fit Page */}
      <button
        onClick={() => onFitMode('page')}
        style={buttonBaseStyle}
        title="페이지 맞춤"
        onMouseEnter={(e) => Object.assign(e.currentTarget.style, buttonHoverStyle)}
        onMouseLeave={(e) => Object.assign(e.currentTarget.style, buttonBaseStyle)}
      >
        <ArrowsOut size={22} weight="duotone" />
      </button>

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_MIN}
        style={{
          ...buttonBaseStyle,
          opacity: zoom <= ZOOM_MIN ? 0.3 : 1,
          cursor: zoom <= ZOOM_MIN ? 'not-allowed' : 'pointer'
        }}
        title="축소"
        onMouseEnter={(e) => {
          if (zoom > ZOOM_MIN) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, buttonBaseStyle);
        }}
      >
        <MagnifyingGlassMinus size={22} weight="duotone" />
      </button>

      {/* Zoom Level Display */}
      <div style={{
        width: '44px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
        borderRadius: '10px',
        marginTop: '4px',
        border: '1px solid #e5e7eb'
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  );
}
