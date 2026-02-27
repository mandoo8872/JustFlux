/**
 * Page Context Menu — 우클릭 페이지 조작 메뉴
 * Agent 5: 디자인 시스템 기반 전면 리팩토링
 * - 모든 인라인 스타일 → CSS 클래스 + design tokens
 * - onMouseEnter/Leave 제거 → CSS :hover
 * - aria-label 추가
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Copy,
  Trash,
  FileArrowUp,
  File,
  ArrowClockwise,
  ArrowCounterClockwise,
} from 'phosphor-react';

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
  pageId,
  position,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPage,
  onRotateRight,
  onRotateLeft,
  onClose,
}: PageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const exec = (fn: (id: string) => void) => () => { fn(pageId); onClose(); };

  const menuContent = (
    <div
      ref={menuRef}
      className="ctx-menu"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      role="menu"
    >
      <button className="ctx-menu__item" onClick={exec(onDuplicate)} role="menuitem" aria-label="페이지 복제">
        <Copy size={18} weight="duotone" style={{ color: 'var(--color-accent)' }} />
        <span>페이지 복제</span>
      </button>

      <div className="ctx-menu__divider" />

      <button className="ctx-menu__item" onClick={exec(onAddBlankPage)} role="menuitem" aria-label="빈 페이지 추가">
        <File size={18} weight="duotone" style={{ color: 'var(--color-success)' }} />
        <span>빈 페이지 추가</span>
      </button>

      <button className="ctx-menu__item" onClick={exec(onAddPdfPage)} role="menuitem" aria-label="PDF 페이지 삽입">
        <FileArrowUp size={18} weight="duotone" style={{ color: '#A855F7' }} />
        <span>PDF 페이지 삽입</span>
      </button>

      <div className="ctx-menu__divider" />

      {onRotateRight && (
        <button className="ctx-menu__item" onClick={exec(onRotateRight)} role="menuitem" aria-label="우측으로 90도 회전">
          <ArrowClockwise size={18} weight="duotone" style={{ color: '#0EA5E9' }} />
          <span>우측으로 90° 회전</span>
        </button>
      )}

      {onRotateLeft && (
        <button className="ctx-menu__item" onClick={exec(onRotateLeft)} role="menuitem" aria-label="좌측으로 90도 회전">
          <ArrowCounterClockwise size={18} weight="duotone" style={{ color: '#0EA5E9' }} />
          <span>좌측으로 90° 회전</span>
        </button>
      )}

      <div className="ctx-menu__divider" />

      <button className="ctx-menu__item ctx-menu__item--danger" onClick={exec(onDelete)} role="menuitem" aria-label="페이지 삭제">
        <Trash size={18} weight="duotone" />
        <span>페이지 삭제</span>
      </button>
    </div>
  );

  return createPortal(menuContent, document.body);
}
