/**
 * Header Component - 상단 헤더
 * 문서 이름, 페이지 수, Undo/Redo, 파일 액션, 테마 토글, 언어 토글
 */

import React from 'react';
import { Moon, Sun, Desktop, Translate } from 'phosphor-react';
import { FileActions } from './FileActions';
import { UndoRedo } from './UndoRedo';
import { useThemeStore } from '../../state/stores/ThemeStore';
import { useTranslation, useLocaleStore } from '../../i18n';
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

const THEME_ICONS = { system: Desktop, light: Sun, dark: Moon } as const;

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
  const { locale, toggleLocale } = useLocaleStore();
  const { t } = useTranslation();

  const ThemeIcon = THEME_ICONS[preference];
  const themeLabel = t(`theme.${preference}`);

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
              ({totalPages} {t('header.pages')})
            </span>
          </>
        ) : (
          <span style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-tertiary)',
            fontStyle: 'italic',
          }}>
            {t('app.name')}
          </span>
        )}
      </div>

      {/* Center-Right: Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginRight: 'var(--space-2)' }}>
        {/* Smooth toggle */}
        <button
          className={`btn-toggle ${smoothRendering ? 'btn-toggle--on' : 'btn-toggle--off'}`}
          onClick={onToggleSmooth}
          title={smoothRendering ? t('header.smoothOn') : t('header.smoothOff')}
          aria-label={smoothRendering ? t('header.smoothOn') : t('header.smoothOff')}
        >
          <span style={{ fontSize: '10px' }}>{smoothRendering ? '🔵' : '⚪'}</span>
          {t('header.smooth')}
        </button>

        {/* Theme toggle */}
        <button
          className={`btn-toggle ${preference === 'dark' ? 'btn-toggle--on' : 'btn-toggle--off'}`}
          onClick={cycleTheme}
          title={t('theme.toggle', { mode: themeLabel })}
          aria-label={t('theme.ariaLabel', { mode: themeLabel })}
        >
          <ThemeIcon size={14} weight="bold" />
          {themeLabel}
        </button>

        {/* Language toggle */}
        <button
          className={`btn-toggle ${locale === 'en' ? 'btn-toggle--on' : 'btn-toggle--off'}`}
          onClick={toggleLocale}
          title={t('locale.toggle')}
          aria-label={t('locale.ariaLabel', { lang: t(`locale.${locale}`) })}
        >
          <Translate size={14} weight="bold" />
          {locale === 'ko' ? '한' : 'EN'}
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
