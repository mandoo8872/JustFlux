/**
 * FileActions Component - 파일 액션 버튼들
 * 파일 열기, 내보내기
 */

import React, { useRef } from 'react';
import {
  FileArrowUp,
  File,
} from 'phosphor-react';
import { useTranslation } from '../../i18n';

interface FileActionsProps {
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}

export function FileActions({
  onFileSelect,
  onExport,
}: FileActionsProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLabelElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0px' }}>
      <label
        tabIndex={0}
        role="button"
        onKeyDown={handleKeyDown}
        aria-label={t('header.openFile')}
        title={t('header.openFile')}
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
      >
        <FileArrowUp size={16} weight="regular" />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt,.png,.jpg,.jpeg,.gif,.webp,application/pdf,text/plain,text/markdown,image/*"
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
        title={t('header.export')}
        aria-label={t('header.export')}
      >
        <File size={16} weight="regular" />
      </button>
    </div>
  );
}
