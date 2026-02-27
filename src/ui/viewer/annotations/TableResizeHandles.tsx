/**
 * TableResizeHandles — 행/열 경계 드래그 핸들
 * 선택 상태에서만 표시. 열 경계(col-resize) + 행 경계(row-resize).
 */

import React from 'react';

interface TableResizeHandlesProps {
    colWidths: number[];
    rowHeights: number[];
    scale: number;
    onColResize: (colIndex: number, delta: number) => void;
    onRowResize: (rowIndex: number, delta: number) => void;
}

export function TableResizeHandles({
    colWidths,
    rowHeights,
    scale,
    onColResize,
    onRowResize,
}: TableResizeHandlesProps) {
    const totalWidth = colWidths.reduce((s, w) => s + w, 0) * scale;
    const totalHeight = rowHeights.reduce((s, h) => s + h, 0) * scale;

    const handleColDrag = (e: React.PointerEvent, colIndex: number) => {
        e.stopPropagation();
        e.preventDefault();

        const startX = e.clientX;

        const handleMove = (moveEvent: PointerEvent) => {
            const delta = (moveEvent.clientX - startX) / scale;
            onColResize(colIndex, delta);
        };

        const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    const handleRowDrag = (e: React.PointerEvent, rowIndex: number) => {
        e.stopPropagation();
        e.preventDefault();

        const startY = e.clientY;

        const handleMove = (moveEvent: PointerEvent) => {
            const delta = (moveEvent.clientY - startY) / scale;
            onRowResize(rowIndex, delta);
        };

        const handleUp = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };

        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp);
    };

    // Cumulative positions
    let colX = 0;
    let rowY = 0;

    return (
        <>
            {/* Column resize handles (vertical lines between columns) */}
            {colWidths.slice(0, -1).map((w, i) => {
                colX += w * scale;
                return (
                    <div
                        key={`col-${i}`}
                        onPointerDown={(e) => handleColDrag(e, i)}
                        style={{
                            position: 'absolute',
                            left: colX - 3,
                            top: -2,
                            width: 6,
                            height: totalHeight + 4,
                            cursor: 'col-resize',
                            pointerEvents: 'auto',
                            zIndex: 20,
                        }}
                    >
                        {/* Visible indicator */}
                        <div style={{
                            position: 'absolute',
                            left: 2,
                            top: 0,
                            width: 2,
                            height: '100%',
                            backgroundColor: '#3B82F6',
                            opacity: 0.5,
                            borderRadius: 1,
                        }} />
                    </div>
                );
            })}

            {/* Row resize handles (horizontal lines between rows) */}
            {rowHeights.slice(0, -1).map((h, i) => {
                rowY += h * scale;
                return (
                    <div
                        key={`row-${i}`}
                        onPointerDown={(e) => handleRowDrag(e, i)}
                        style={{
                            position: 'absolute',
                            left: -2,
                            top: rowY - 3,
                            width: totalWidth + 4,
                            height: 6,
                            cursor: 'row-resize',
                            pointerEvents: 'auto',
                            zIndex: 20,
                        }}
                    >
                        <div style={{
                            position: 'absolute',
                            top: 2,
                            left: 0,
                            height: 2,
                            width: '100%',
                            backgroundColor: '#3B82F6',
                            opacity: 0.5,
                            borderRadius: 1,
                        }} />
                    </div>
                );
            })}
        </>
    );
}
