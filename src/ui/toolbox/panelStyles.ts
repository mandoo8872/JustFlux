/**
 * 패널 공통 스타일 & 상수
 */

import React from 'react';

export const COLORS = [
    '#000000', '#FFFFFF', '#CCCCCC', '#FF0000', '#FFA500', '#FFFF00',
    '#00FF00', '#0000FF', '#4B0082', '#FF00FF', '#00FFFF', '#FFD700',
];

export const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

export const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#666666',
    fontWeight: 500,
    marginBottom: '2px',
};

export const inputStyle: React.CSSProperties = {
    backgroundColor: '#F5F5F5',
    border: '1px solid #D0D0D0',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#333333',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
};

export const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #D0D0D0',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '12px',
    flex: 1,
    backgroundColor: '#FFFFFF',
    color: '#333333',
};

export const colorButtonStyle = (color: string, isActive: boolean): React.CSSProperties => ({
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    backgroundColor: color === 'transparent' ? 'transparent' : color,
    backgroundImage: color === 'transparent'
        ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
        : 'none',
    backgroundSize: color === 'transparent' ? '8px 8px' : 'auto',
    backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
    border: isActive ? '2px solid #3B82F6' : '1px solid #D0D0D0',
    cursor: 'pointer',
    position: 'relative' as const,
});

export const panelStyle: React.CSSProperties = {
    backgroundColor: '#FFFFFF',
    color: '#333333',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    fontSize: '13px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    border: '1px solid #E5E5E5',
};
