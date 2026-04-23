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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      <label
        className="btn-icon btn-tool"
        style={{ width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        title={t('header.openFile')}
        aria-label={t('header.openFile')}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <FileArrowUp size={16} weight="bold" />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.md,.txt,.png,.jpg,.jpeg,.gif,.webp,application/pdf,text/plain,text/markdown,image/*"
          onChange={onFileSelect}
          style={{ display: 'none' }}
          tabIndex={-1}
        />
      </label>

      <button
        className="btn-icon btn-tool"
        style={{ width: '28px', height: '28px' }}
        onClick={onExport}
        title={t('header.export')}
        aria-label={t('header.export')}
      >
        <File size={16} weight="bold" />
      </button>
    </div>
  );
}
