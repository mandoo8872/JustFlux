/**
 * UndoRedo Component - 실행 취소/다시 실행 버튼
 * ArrowUUpLeft / ArrowUUpRight 아이콘으로 회전 버튼과 시각적 구분
 */

import { ArrowUUpLeft, ArrowUUpRight } from 'phosphor-react';
import { useTranslation } from '../../i18n';

interface UndoRedoProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedo({ canUndo, canRedo, onUndo, onRedo }: UndoRedoProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <button
        className="btn-icon btn-tool"
        onClick={onUndo}
        disabled={!canUndo}
        title={t('header.undo')}
        aria-label={t('header.undo')}
        style={{ width: '28px', height: '28px', opacity: canUndo ? 1 : 0.35 }}
      >
        <ArrowUUpLeft size={16} weight="bold" />
      </button>

      <button
        className="btn-icon btn-tool"
        onClick={onRedo}
        disabled={!canRedo}
        title={t('header.redo')}
        aria-label={t('header.redo')}
        style={{ width: '28px', height: '28px', opacity: canRedo ? 1 : 0.35 }}
      >
        <ArrowUUpRight size={16} weight="bold" />
      </button>
    </div>
  );
}
