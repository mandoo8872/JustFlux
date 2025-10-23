/**
 * Page Context Menu
 * Right-click menu for page operations
 */

import React, { useEffect, useRef } from 'react';
import {
  Copy,
  Trash,
  FilePlus,
  FileArrowUp,
  File,
} from 'phosphor-react';

export interface PageContextMenuProps {
  pageId: string;
  position: { x: number; y: number };
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddBlankPage: (afterPageId: string) => void;
  onAddPdfPage: (afterPageId: string) => void;
  onClose: () => void;
}

export function PageContextMenu({
  pageId,
  position,
  onDuplicate,
  onDelete,
  onAddBlankPage,
  onAddPdfPage,
  onClose,
}: PageContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDuplicate = () => {
    onDuplicate(pageId);
    onClose();
  };

  const handleDelete = () => {
    onDelete(pageId);
    onClose();
  };

  const handleAddBlank = () => {
    onAddBlankPage(pageId);
    onClose();
  };

  const handleAddPdf = () => {
    onAddPdfPage(pageId);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgb(229, 231, 235)',
        padding: '8px',
        minWidth: '200px',
      }}
    >
      {/* Duplicate Page */}
      <button
        onClick={handleDuplicate}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          fontSize: '14px',
          fontWeight: '500',
          color: 'rgb(31, 41, 55)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Copy size={18} weight="duotone" style={{ color: 'rgb(59, 130, 246)' }} />
        <span>페이지 복제</span>
      </button>

      {/* Separator */}
      <div style={{ height: '1px', backgroundColor: 'rgb(229, 231, 235)', margin: '4px 0' }} />

      {/* Add Blank Page */}
      <button
        onClick={handleAddBlank}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          fontSize: '14px',
          fontWeight: '500',
          color: 'rgb(31, 41, 55)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <File size={18} weight="duotone" style={{ color: 'rgb(34, 197, 94)' }} />
        <span>빈 페이지 추가</span>
      </button>

      {/* Add PDF Page */}
      <button
        onClick={handleAddPdf}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          fontSize: '14px',
          fontWeight: '500',
          color: 'rgb(31, 41, 55)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <FileArrowUp size={18} weight="duotone" style={{ color: 'rgb(168, 85, 247)' }} />
        <span>PDF 페이지 삽입</span>
      </button>

      {/* Separator */}
      <div style={{ height: '1px', backgroundColor: 'rgb(229, 231, 235)', margin: '4px 0' }} />

      {/* Delete Page */}
      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 12px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          fontSize: '14px',
          fontWeight: '500',
          color: 'rgb(220, 38, 38)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgb(254, 226, 226)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <Trash size={18} weight="duotone" style={{ color: 'rgb(220, 38, 38)' }} />
        <span>페이지 삭제</span>
      </button>
    </div>
  );
}

