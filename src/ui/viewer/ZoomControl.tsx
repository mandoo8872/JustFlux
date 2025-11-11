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
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-in-out',
    color: '#333333'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px'
    }}>
      {/* Zoom In (+) */}
      <button
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_MAX}
        style={{
          ...buttonBaseStyle,
          width: '36px',
          height: '36px',
          opacity: zoom >= ZOOM_MAX ? 0.3 : 1,
          cursor: zoom >= ZOOM_MAX ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
        }}
        title="확대"
        onMouseEnter={(e) => {
          if (zoom < ZOOM_MAX) {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <MagnifyingGlassPlus size={20} weight="regular" />
      </button>

      {/* Zoom Level Display */}
      <div style={{
        width: '36px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        color: '#333333',
        fontWeight: 500
      }}>
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out (-) */}
      <button
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_MIN}
        style={{
          ...buttonBaseStyle,
          width: '36px',
          height: '36px',
          opacity: zoom <= ZOOM_MIN ? 0.3 : 1,
          cursor: zoom <= ZOOM_MIN ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
        }}
        title="축소"
        onMouseEnter={(e) => {
          if (zoom > ZOOM_MIN) {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <MagnifyingGlassMinus size={20} weight="regular" />
      </button>

      {/* Fit Page (*) */}
      <button
        onClick={() => onFitMode('page')}
        style={{
          ...buttonBaseStyle,
          width: '36px',
          height: '36px',
          borderRadius: '4px',
        }}
        title="페이지 맞춤"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E0E0E0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <ArrowsOut size={20} weight="regular" />
      </button>
    </div>
  );
}
