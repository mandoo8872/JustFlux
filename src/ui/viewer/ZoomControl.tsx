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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      {/* Zoom In */}
      <button
        className="btn-icon btn-tool"
        onClick={handleZoomIn}
        disabled={zoom >= ZOOM_MAX}
        title="확대"
        aria-label="확대"
      >
        <MagnifyingGlassPlus size={20} weight="regular" />
      </button>

      {/* Zoom Level */}
      <div className="zoom-display">
        {Math.round(zoom * 100)}%
      </div>

      {/* Zoom Out */}
      <button
        className="btn-icon btn-tool"
        onClick={handleZoomOut}
        disabled={zoom <= ZOOM_MIN}
        title="축소"
        aria-label="축소"
      >
        <MagnifyingGlassMinus size={20} weight="regular" />
      </button>

      {/* Fit Page */}
      <button
        className="btn-icon btn-tool"
        onClick={() => onFitMode('page')}
        title="페이지 맞춤"
        aria-label="페이지 맞춤"
      >
        <ArrowsOut size={20} weight="regular" />
      </button>
    </div>
  );
}
