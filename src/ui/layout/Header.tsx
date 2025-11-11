/**
 * Header Component - Adobe PDF Reader 스타일 상단 헤더
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
  onAddPage: () => void;
  onClose: () => void;
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
  onAddPage,
  onClose,
}: HeaderProps) {
  return (
    <header style={{ 
      backgroundColor: '#F5F5F5', 
      borderBottom: '1px solid #D0D0D0',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '8px',
      paddingRight: '8px',
      zIndex: 100
    }}>
      {/* Left: App Name & Document Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        {document && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '13px', 
              color: '#333333',
              fontWeight: 500
            }}>
              {document.name}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: '#666666',
              marginLeft: '4px'
            }}>
              ({totalPages} 페이지)
            </span>
          </div>
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
          onAddPage={onAddPage}
          onClose={onClose}
        />
      </div>
    </header>
  );
}
