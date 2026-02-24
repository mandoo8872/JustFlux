/**
 * Header Component - 상단 헤더
 * 문서 이름, 페이지 수, Undo/Redo, 파일 액션 표시
 */

import React from 'react';
import { FileActions } from './FileActions';
import { UndoRedo } from './UndoRedo';
import type { Document as JFDocument } from '../../core/model/types';

interface HeaderProps {
  document: JFDocument | null;
  totalPages: number;
  canUndo: boolean;
  canRedo: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
}

export function Header({
  document,
  totalPages,
  canUndo,
  canRedo,
  onFileSelect,
  onUndo,
  onRedo,
  onExport,
}: HeaderProps) {
  return (
    <header style={{
      backgroundColor: '#F5F5F5',
      borderBottom: '1px solid #D0D0D0',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '12px',
      paddingRight: '8px',
      zIndex: 100
    }}>
      {/* Left: Document name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
        {document ? (
          <>
            <span style={{
              fontSize: '13px',
              color: '#333333',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {document.name}
            </span>
            <span style={{
              fontSize: '12px',
              color: '#999999',
              flexShrink: 0,
            }}>
              ({totalPages} 페이지)
            </span>
          </>
        ) : (
          <span style={{
            fontSize: '13px',
            color: '#999999',
            fontStyle: 'italic',
          }}>
            JustFlux
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <UndoRedo
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={onUndo}
          onRedo={onRedo}
        />
        <FileActions
          onFileSelect={onFileSelect}
          onExport={onExport}
        />
      </div>
    </header>
  );
}
