/**
 * Header Component - Adobe PDF Reader 스타일 상단 헤더
 * 다중 문서 탭 지원 (최대 5개)
 */

import React, { useEffect } from 'react';
import { X, Plus } from 'phosphor-react';
import { FileActions } from './FileActions';
import { UndoRedo } from './UndoRedo';
import type { Document as JFDocument } from '../../core/model/types';
import { useDocumentTabStore } from '../../state/stores/DocumentTabStore';

interface HeaderProps {
  document: JFDocument | null;
  totalPages: number;
  canUndo: boolean;
  canRedo: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onDocumentChange?: (document: JFDocument | null) => void;
  onNewBlankTab?: () => void;
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
  onDocumentChange,
  onNewBlankTab,
}: HeaderProps) {
  const { tabs, activeTabId, openDocument, closeTab, switchTab, maxTabs } = useDocumentTabStore();

  // Auto-add document to tabs when opened
  useEffect(() => {
    if (document) {
      const existingTab = tabs.find(tab => tab.document.id === document.id);
      if (!existingTab) {
        openDocument(document);
      }
    }
  }, [document?.id]);

  const handleTabClick = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab && tab.id !== activeTabId) {
      switchTab(tabId);
      onDocumentChange?.(tab.document);
    }
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
    // After closing, the store will switch to adjacent tab
    const { tabs: newTabs, activeTabId: newActiveId } = useDocumentTabStore.getState();
    const newActiveTab = newTabs.find(t => t.id === newActiveId);
    if (newActiveTab) {
      onDocumentChange?.(newActiveTab.document);
    } else {
      onDocumentChange?.(null);
    }
  };

  const handleAddTab = () => {
    if (tabs.length < maxTabs) {
      onNewBlankTab?.();
    }
  };

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
      {/* Left: Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden' }}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  paddingRight: '4px',
                  backgroundColor: isActive ? '#FFFFFF' : '#E5E5E5',
                  borderRadius: '6px 6px 0 0',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid #0078D4' : '2px solid transparent',
                  maxWidth: '160px',
                  minWidth: '80px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#D5D5D5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#E5E5E5';
                  }
                }}
              >
                <span style={{
                  fontSize: '12px',
                  color: isActive ? '#333333' : '#666666',
                  fontWeight: isActive ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {tab.name}
                </span>
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    color: '#999999',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#D0D0D0';
                    e.currentTarget.style.color = '#333333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#999999';
                  }}
                  title="탭 닫기"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            );
          })}

          {/* Add new tab button */}
          {tabs.length < maxTabs && (
            <button
              onClick={handleAddTab}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: '#666666',
                marginLeft: '4px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E0E0E0';
                e.currentTarget.style.color = '#333333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#666666';
              }}
              title="새 탭 추가"
            >
              <Plus size={16} weight="bold" />
            </button>
          )}
        </div>

        {/* Show page count for active document */}
        {tabs.length > 0 && (
          <span style={{
            fontSize: '12px',
            color: '#666666',
            marginLeft: '8px',
            flexShrink: 0,
          }}>
            ({totalPages} 페이지)
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
