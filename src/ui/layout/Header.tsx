/**
 * Header Component - 상단 헤더
 * 문서 이름, 페이지 수, Undo/Redo, 파일 액션, 테마 토글 표시
 */

import React from 'react';
import { Moon, Sun, Desktop } from 'phosphor-react';
import { FileActions } from './FileActions';
import { UndoRedo } from './UndoRedo';
import { useThemeStore } from '../../state/stores/ThemeStore';
import type { Document as JFDocument } from '../../core/model/types';

interface HeaderProps {
  document: JFDocument | null;
  totalPages: number;
  canUndo: boolean;
  canRedo: boolean;
  smoothRendering: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onToggleSmooth: () => void;
}

const THEME_META: Record<string, { icon: typeof Sun; label: string; emoji: string }> = {
  system: { icon: Desktop, label: '시스템', emoji: '🖥️' },
  light: { icon: Sun, label: '라이트', emoji: '☀️' },
  dark: { icon: Moon, label: '다크', emoji: '🌙' },
};

export function Header({
  document,
  totalPages,
  canUndo,
  canRedo,
  smoothRendering,
  onFileSelect,
  onUndo,
  onRedo,
  onExport,
  onToggleSmooth,
}: HeaderProps) {
  const { preference, cycleTheme } = useThemeStore();
  const meta = THEME_META[preference];
  const ThemeIcon = meta.icon;

  return (
    <header className="header-bar">
      {/* Left: Document name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, overflow: 'hidden' }}>
        {document ? (
          <>
            <span style={{
              fontSize: 'var(--font-size-base)',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--font-weight-medium)' as any,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {document.name}
            </span>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-tertiary)',
              flexShrink: 0,
            }}>
              ({totalPages} 페이지)
            </span>
          </>
        ) : (
          <span style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic',
          }}>
            JustFlux
          </span>
        )}
      </div>

      {/* Center-Right: Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginRight: 'var(--space-2)' }}>
        {/* Smooth toggle */}
        <button
          className={`btn-toggle ${smoothRendering ? 'btn-toggle--on' : 'btn-toggle--off'}`}
          onClick={onToggleSmooth}
          title={smoothRendering ? 'Smooth 렌더링 ON' : 'Smooth 렌더링 OFF'}
          aria-label={smoothRendering ? 'Smooth 렌더링 비활성화' : 'Smooth 렌더링 활성화'}
        >
          <span style={{ fontSize: '10px' }}>{smoothRendering ? '🔵' : '⚪'}</span>
          Smooth
        </button>

        {/* Theme toggle */}
        <button
          className={`btn-toggle ${preference === 'dark' ? 'btn-toggle--on' : 'btn-toggle--off'}`}
          onClick={cycleTheme}
          title={`테마: ${meta.label} (클릭하여 변경)`}
          aria-label={`현재 테마: ${meta.label}. 클릭하여 다음 테마로 전환`}
        >
          <ThemeIcon size={14} weight="bold" />
          {meta.label}
        </button>
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
