/**
 * FileActions Component - 파일 액션 버튼들
 * 파일 열기, 내보내기
 */

import React from 'react';
import {
  FileArrowUp,
  X,
  Plus,
  File,
} from 'phosphor-react';

interface FileActionsProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onAddPage: () => void;
  onClose: () => void;
}

export function FileActions({
  onFileSelect,
  onExport,
  onAddPage,
  onClose,
}: FileActionsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#333333',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease-in-out'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#E0E0E0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
      title="파일 열기"
      >
        <FileArrowUp size={16} weight="regular" />
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
      </label>

      <button
        onClick={onExport}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#333333',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease-in-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E0E0E0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        title="내보내기"
      >
        <File size={16} weight="regular" />
      </button>
    </div>
  );
}
