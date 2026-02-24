/**
 * UndoRedo Component - 실행 취소/다시 실행 버튼
 */

import {
  ArrowCounterClockwise,
  ArrowClockwise,
} from 'phosphor-react';

interface UndoRedoProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function UndoRedo({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: UndoRedoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
      <button
        onClick={onUndo}
        disabled={!canUndo}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          border: 'none',
          backgroundColor: 'transparent',
          color: canUndo ? '#333333' : '#999999',
          cursor: canUndo ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.15s ease-in-out'
        }}
        onMouseEnter={(e) => {
          if (canUndo) {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="실행 취소"
      >
        <ArrowCounterClockwise size={16} weight="regular" />
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          border: 'none',
          backgroundColor: 'transparent',
          color: canRedo ? '#333333' : '#999999',
          cursor: canRedo ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.15s ease-in-out'
        }}
        onMouseEnter={(e) => {
          if (canRedo) {
            e.currentTarget.style.backgroundColor = '#E0E0E0';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="다시 실행"
      >
        <ArrowClockwise size={16} weight="regular" />
      </button>
    </div>
  );
}
