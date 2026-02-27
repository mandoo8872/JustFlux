/**
 * TableGridPicker — Word 스타일 10×8 바둑판 그리드 피커
 * 마우스 오버로 행/열 수 선택, 클릭으로 확정
 */

import { useState, useCallback } from 'react';

interface TableGridPickerProps {
    onSelect: (rows: number, cols: number) => void;
    onClose: () => void;
}

const MAX_ROWS = 8;
const MAX_COLS = 10;
const CELL_SIZE = 18;
const GAP = 2;

export function TableGridPicker({ onSelect, onClose }: TableGridPickerProps) {
    const [hoverRow, setHoverRow] = useState(0);
    const [hoverCol, setHoverCol] = useState(0);

    const handleCellHover = useCallback((row: number, col: number) => {
        setHoverRow(row);
        setHoverCol(col);
    }, []);

    const handleClick = useCallback(() => {
        if (hoverRow > 0 && hoverCol > 0) {
            onSelect(hoverRow, hoverCol);
            onClose();
        }
    }, [hoverRow, hoverCol, onSelect, onClose]);

    const totalWidth = MAX_COLS * (CELL_SIZE + GAP) + GAP + 16;

    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 9999,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                width: totalWidth,
                userSelect: 'none',
            }}
            ref={(el) => {
                if (el) {
                    // Position relative to the button (parent)
                    const parent = el.parentElement;
                    if (parent) {
                        const parentRect = parent.getBoundingClientRect();
                        el.style.left = `${parentRect.right + 8}px`;
                        el.style.top = `${parentRect.top}px`;
                        // Ensure it doesn't overflow the viewport
                        const elRect = el.getBoundingClientRect();
                        if (elRect.right > window.innerWidth) {
                            el.style.left = `${parentRect.left - elRect.width - 8}px`;
                        }
                        if (elRect.bottom > window.innerHeight) {
                            el.style.top = `${window.innerHeight - elRect.height - 8}px`;
                        }
                    }
                }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => { setHoverRow(0); setHoverCol(0); }}
        >
            {/* Label */}
            <div style={{
                fontSize: 11,
                color: '#64748B',
                marginBottom: 6,
                fontWeight: 600,
                textAlign: 'center',
            }}>
                {hoverRow > 0 && hoverCol > 0
                    ? `${hoverRow} × ${hoverCol} 표`
                    : '행 × 열 선택'}
            </div>

            {/* Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${MAX_COLS}, ${CELL_SIZE}px)`,
                    gap: GAP,
                }}
            >
                {Array.from({ length: MAX_ROWS * MAX_COLS }, (_, idx) => {
                    const row = Math.floor(idx / MAX_COLS) + 1;
                    const col = (idx % MAX_COLS) + 1;
                    const isHighlighted = row <= hoverRow && col <= hoverCol;

                    return (
                        <div
                            key={idx}
                            onMouseEnter={() => handleCellHover(row, col)}
                            onClick={handleClick}
                            style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                backgroundColor: isHighlighted ? '#3B82F6' : '#F1F5F9',
                                border: `1px solid ${isHighlighted ? '#2563EB' : '#CBD5E1'}`,
                                borderRadius: 2,
                                cursor: 'pointer',
                                transition: 'background-color 0.08s, border-color 0.08s',
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}
