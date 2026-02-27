/**
 * Page Context Menu — 우클릭 페이지 조작 메뉴
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy, Trash, FileArrowUp, File,
  ArrowClockwise, ArrowCounterClockwise,
} from 'phosphor-react';
import { useTranslation } from '../../i18n';

export interface PageContextMenuProps {
  pageId: string;
  position: { x: number; y: number };
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string) => void;
  onAddPdfPage: (afterPageId: string) => void;
  onRotateRight?: (pageId: string) => void;
  onRotateLeft?: (pageId: string) => void;
  onClose: () => void;
}

export function PageContextMenu({
  pageId, position, onDuplicate, onDelete,
  onAddBlankPage, onAddPdfPage, onRotateRight, onRotateLeft, onClose,
}: PageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const exec = (fn: (id: string) => void) => () => { fn(pageId); onClose(); };

  return createPortal(
    <div ref={menuRef} className="ctx-menu" style={{ left: `${position.x}px`, top: `${position.y}px` }} role="menu">
      <button className="ctx-menu__item" onClick={exec(onDuplicate)} role="menuitem" aria-label={t('contextMenu.duplicate')}>
        <Copy size={18} weight="duotone" style={{ color: 'var(--color-accent)' }} />
        <span>{t('contextMenu.duplicate')}</span>
      </button>

      <div className="ctx-menu__divider" />

      <button className="ctx-menu__item" onClick={exec(onAddBlankPage)} role="menuitem" aria-label={t('contextMenu.addBlank')}>
        <File size={18} weight="duotone" style={{ color: 'var(--color-success)' }} />
        <span>{t('contextMenu.addBlank')}</span>
      </button>

      <button className="ctx-menu__item" onClick={exec(onAddPdfPage)} role="menuitem" aria-label={t('contextMenu.addPdf')}>
        <FileArrowUp size={18} weight="duotone" style={{ color: '#A855F7' }} />
        <span>{t('contextMenu.addPdf')}</span>
      </button>

      <div className="ctx-menu__divider" />

      {onRotateRight && (
        <button className="ctx-menu__item" onClick={exec(onRotateRight)} role="menuitem" aria-label={t('contextMenu.rotateRight')}>
          <ArrowClockwise size={18} weight="duotone" style={{ color: '#0EA5E9' }} />
          <span>{t('contextMenu.rotateRight')}</span>
        </button>
      )}

      {onRotateLeft && (
        <button className="ctx-menu__item" onClick={exec(onRotateLeft)} role="menuitem" aria-label={t('contextMenu.rotateLeft')}>
          <ArrowCounterClockwise size={18} weight="duotone" style={{ color: '#0EA5E9' }} />
          <span>{t('contextMenu.rotateLeft')}</span>
        </button>
      )}

      <div className="ctx-menu__divider" />

      <button className="ctx-menu__item ctx-menu__item--danger" onClick={exec(onDelete)} role="menuitem" aria-label={t('contextMenu.delete')}>
        <Trash size={18} weight="duotone" />
        <span>{t('contextMenu.delete')}</span>
      </button>
    </div>,
    document.body
  );
}
