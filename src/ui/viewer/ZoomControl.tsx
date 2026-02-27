/**
 * ZoomControl Component - 확대/축소 컨트롤
 */

import { MagnifyingGlassMinus, MagnifyingGlassPlus, ArrowsOut } from 'phosphor-react';
import { useTranslation } from '../../i18n';

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
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
      <button
        className="btn-icon btn-tool"
        onClick={() => onZoomChange(Math.min(zoom + ZOOM_STEP, ZOOM_MAX))}
        disabled={zoom >= ZOOM_MAX}
        title={t('zoom.in')}
        aria-label={t('zoom.in')}
      >
        <MagnifyingGlassPlus size={20} weight="regular" />
      </button>

      <div className="zoom-display">
        {Math.round(zoom * 100)}%
      </div>

      <button
        className="btn-icon btn-tool"
        onClick={() => onZoomChange(Math.max(zoom - ZOOM_STEP, ZOOM_MIN))}
        disabled={zoom <= ZOOM_MIN}
        title={t('zoom.out')}
        aria-label={t('zoom.out')}
      >
        <MagnifyingGlassMinus size={20} weight="regular" />
      </button>

      <button
        className="btn-icon btn-tool"
        onClick={() => onFitMode('page')}
        title={t('zoom.fitPage')}
        aria-label={t('zoom.fitPage')}
      >
        <ArrowsOut size={20} weight="regular" />
      </button>
    </div>
  );
}
