/**
 * 패널 공통 스타일 & 상수 — Figma Inspector 스타일
 */

import React from 'react';

// ── 컬러 팔레트 ───────────────────────────────

export const COLORS = [
    '#000000', '#FFFFFF', '#999999', '#EF4444', '#F97316', '#EAB308',
    '#22C55E', '#3B82F6', '#6366F1', '#A855F7', '#EC4899', '#06B6D4',
];

// ── 패널 루트 ─────────────────────────────────

export const panelStyle: React.CSSProperties = {
    backgroundColor: '#FAFAFA',
    color: '#1A1A1A',
    borderRadius: '10px',
    width: '100%',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid #E0E0E0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

// ── 헤더 ───────────────────────────────────────

export const panelHeaderStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1E293B, #334155)',
    color: '#F1F5F9',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
};

// ── 본문 영역 ──────────────────────────────────

export const panelBodyStyle: React.CSSProperties = {
    padding: '6px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
};

// ── 섹션 (접이식) ──────────────────────────────

export const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '8px 14px',
};

export const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '4px 0',
};

export const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#64748B',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
};

// ── 구분선 ─────────────────────────────────────

export const dividerStyle: React.CSSProperties = {
    height: '1px',
    background: '#E5E7EB',
    margin: '2px 14px',
};

// ── 인풋 ───────────────────────────────────────

export const inputStyle: React.CSSProperties = {
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#1E293B',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
};

// ── 버튼 ───────────────────────────────────────

export const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '12px',
    flex: 1,
    backgroundColor: '#F8FAFC',
    color: '#334155',
    transition: 'all 0.15s',
};

export const iconButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    border: '1px solid #CBD5E1',
    cursor: 'pointer',
    backgroundColor: '#F8FAFC',
    color: '#475569',
    transition: 'all 0.15s',
};

export const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3B82F6',
    color: 'white',
    borderColor: '#2563EB',
};

// ── 컬러 스와치 ────────────────────────────────

export const colorButtonStyle = (color: string, isActive: boolean): React.CSSProperties => ({
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: color === 'transparent' ? 'transparent' : color,
    backgroundImage: color === 'transparent'
        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
        : 'none',
    backgroundSize: color === 'transparent' ? '6px 6px' : 'auto',
    backgroundPosition: color === 'transparent' ? '0 0, 0 3px, 3px -3px, -3px 0px' : 'auto',
    border: isActive ? '2.5px solid #3B82F6' : `2px solid ${color === '#FFFFFF' || color === 'transparent' ? '#D1D5DB' : 'transparent'}`,
    cursor: 'pointer',
    position: 'relative' as const,
    boxShadow: isActive ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
    transition: 'all 0.15s',
});

// ── 인라인 로우 ────────────────────────────────

export const inlineRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
};

export const valueDisplayStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    minWidth: '36px',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
};

// ── 슬라이더 스타일 ────────────────────────────

export const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '4px',
    appearance: 'none' as const,
    background: '#CBD5E1',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
};

// ── 액션 바 (하단) ─────────────────────────────

export const actionBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '4px',
    padding: '8px 14px',
    borderTop: '1px solid #E5E7EB',
    background: '#F8FAFC',
};
