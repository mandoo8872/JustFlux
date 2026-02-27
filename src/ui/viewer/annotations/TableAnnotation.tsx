/**
 * TableAnnotation Component — 표 주석 렌더링 + 인라인 편집
 *
 * - 비선택 시: SVG로 테두리+텍스트 (가벼움)
 * - 선택 시: HTML contentEditable 셀 오버레이 + 리사이즈 핸들
 * - 다중 셀 선택: Ctrl+Click / 드래그
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { TableAnnotation as TableAnnotationType } from '../../../types/annotation';
import { TableResizeHandles } from './TableResizeHandles';
import { ResizeHandles } from './ResizeHandles';

interface TableAnnotationProps {
    annotation: TableAnnotationType;
    isSelected: boolean;
    isHovered?: boolean;
    scale: number;
    onSelect: () => void;
    onUpdate: (updates: Partial<TableAnnotationType>) => void;
    onDelete: () => void;
    onHover?: () => void;
    onHoverEnd?: () => void;
    onDragStart?: (annotation: TableAnnotationType, startPos: { x: number; y: number }) => void;
}

export function TableAnnotationComponent({
    annotation,
    isSelected,
    scale,
    onSelect,
    onUpdate,
    onHover,
    onHoverEnd,
    onDragStart,
}: TableAnnotationProps) {
    const [localHovered, setLocalHovered] = useState(false);
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
    const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    const { bbox, rows, cols, colWidths, rowHeights, cells, borderWidth, borderColor } = annotation;

    const scaledBBox = {
        x: bbox.x * scale,
        y: bbox.y * scale,
        width: bbox.width * scale,
        height: bbox.height * scale,
    };

    const handleMouseEnter = () => { setLocalHovered(true); onHover?.(); };
    const handleMouseLeave = () => { setLocalHovered(false); onHoverEnd?.(); };
    const isHovered = localHovered;

    // ── Cell editing ──

    const handleCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();

        if (e.ctrlKey || e.metaKey) {
            // Multi-select toggle
            const key = `${row}-${col}`;
            setSelectedCells(prev => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            });
            setEditingCell(null);
        } else {
            setEditingCell({ row, col });
            setSelectedCells(new Set([`${row}-${col}`]));
        }
    }, [onSelect]);

    const handleCellBlur = useCallback((row: number, col: number, content: string) => {
        if (cells[row]?.[col]?.content !== content) {
            const newCells = cells.map((r, ri) =>
                r.map((c, ci) =>
                    ri === row && ci === col ? { ...c, content } : c
                )
            );
            onUpdate({ cells: newCells });
        }
    }, [cells, onUpdate]);

    const handleCellKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const nextCol = e.shiftKey ? col - 1 : col + 1;
            if (nextCol >= 0 && nextCol < cols) {
                setEditingCell({ row, col: nextCol });
            } else if (!e.shiftKey && row + 1 < rows) {
                setEditingCell({ row: row + 1, col: 0 });
            } else if (e.shiftKey && row - 1 >= 0) {
                setEditingCell({ row: row - 1, col: cols - 1 });
            }
        } else if (e.key === 'Escape') {
            setEditingCell(null);
        }
    }, [cols, rows]);

    // Auto-focus editing cell
    useEffect(() => {
        if (editingCell) {
            const key = `${editingCell.row}-${editingCell.col}`;
            const el = cellRefs.current.get(key);
            if (el) {
                el.focus();
                // Move cursor to end
                const range = document.createRange();
                range.selectNodeContents(el);
                range.collapse(false);
                const sel = window.getSelection();
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }
    }, [editingCell]);

    // ── Resize handlers ──

    const handleColResize = useCallback((colIndex: number, delta: number) => {
        const newWidths = [...colWidths];
        const minW = 20;
        const leftNew = Math.max(minW, newWidths[colIndex] + delta);
        const rightNew = Math.max(minW, newWidths[colIndex + 1] - delta);
        newWidths[colIndex] = leftNew;
        newWidths[colIndex + 1] = rightNew;
        onUpdate({ colWidths: newWidths });
    }, [colWidths, onUpdate]);

    const handleRowResize = useCallback((rowIndex: number, delta: number) => {
        const newHeights = [...rowHeights];
        const minH = 16;
        const topNew = Math.max(minH, newHeights[rowIndex] + delta);
        const botNew = Math.max(minH, newHeights[rowIndex + 1] - delta);
        newHeights[rowIndex] = topNew;
        newHeights[rowIndex + 1] = botNew;
        onUpdate({ rowHeights: newHeights });
    }, [rowHeights, onUpdate]);

    // ── Table bbox resize ──
    const handleResize = useCallback((dWidth: number, dHeight: number, dX: number, dY: number) => {
        const dW = dWidth / scale;
        const dH = dHeight / scale;
        const newWidth = Math.max(cols * 20, bbox.width + dW);
        const newHeight = Math.max(rows * 16, bbox.height + dH);
        const wRatio = newWidth / bbox.width;
        const hRatio = newHeight / bbox.height;

        onUpdate({
            bbox: {
                x: bbox.x + dX / scale,
                y: bbox.y + dY / scale,
                width: newWidth,
                height: newHeight,
            },
            colWidths: colWidths.map(w => w * wRatio),
            rowHeights: rowHeights.map(h => h * hRatio),
        });
    }, [bbox, colWidths, rowHeights, cols, rows, scale, onUpdate]);

    // Deselect cells when annotation is deselected
    useEffect(() => {
        if (!isSelected) {
            setEditingCell(null);
            setSelectedCells(new Set());
        }
    }, [isSelected]);

    // ── Render cells ──

    const renderCells = () => {
        const result: React.ReactNode[] = [];
        let y = 0;

        for (let r = 0; r < rows; r++) {
            let x = 0;
            for (let c = 0; c < cols; c++) {
                const cell = cells[r]?.[c];
                if (!cell) { x += (colWidths[c] || 0) * scale; continue; }

                const cellW = colWidths[c] * scale;
                const cellH = rowHeights[r] * scale;
                const cellKey = `${r}-${c}`;
                const isCellSelected = selectedCells.has(cellKey);
                const isCellEditing = editingCell?.row === r && editingCell?.col === c;
                const cellStyle = cell.style;

                result.push(
                    <div
                        key={cellKey}
                        ref={el => { if (el) cellRefs.current.set(cellKey, el); }}
                        contentEditable={isCellEditing}
                        suppressContentEditableWarning
                        onClick={(e) => handleCellClick(r, c, e)}
                        onBlur={(e) => handleCellBlur(r, c, e.currentTarget.textContent || '')}
                        onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                        style={{
                            position: 'absolute',
                            left: x,
                            top: y,
                            width: cellW,
                            height: cellH,
                            padding: `${2 * scale}px ${4 * scale}px`,
                            boxSizing: 'border-box',
                            fontSize: cellStyle.fontSize * scale,
                            fontFamily: cellStyle.fontFamily,
                            fontWeight: cellStyle.fontWeight,
                            fontStyle: cellStyle.fontStyle,
                            textAlign: cellStyle.textAlign,
                            color: cellStyle.color,
                            backgroundColor: cellStyle.backgroundColor !== 'transparent'
                                ? cellStyle.backgroundColor
                                : undefined,
                            opacity: cellStyle.backgroundOpacity,
                            outline: isCellEditing ? '2px solid #3B82F6' : isCellSelected ? '2px solid #93C5FD' : 'none',
                            outlineOffset: -2,
                            cursor: isSelected ? 'text' : 'pointer',
                            overflow: 'hidden',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word',
                            lineHeight: 1.4,
                            pointerEvents: 'auto',
                        }}
                    >
                        {cell.content}
                    </div>
                );

                x += cellW;
            }
            y += rowHeights[r] * scale;
        }

        return result;
    };

    // ── SVG grid lines ──

    const renderGridLines = () => {
        const lines: React.ReactNode[] = [];
        const sw = borderWidth * scale;
        const totalW = scaledBBox.width;
        const totalH = scaledBBox.height;

        // Outer border
        lines.push(
            <rect key="outer" x={0} y={0} width={totalW} height={totalH}
                fill="none" stroke={borderColor} strokeWidth={sw} />
        );

        // Column lines
        let cx = 0;
        for (let c = 0; c < cols - 1; c++) {
            cx += colWidths[c] * scale;
            lines.push(
                <line key={`col-${c}`} x1={cx} y1={0} x2={cx} y2={totalH}
                    stroke={borderColor} strokeWidth={sw * 0.5} />
            );
        }

        // Row lines
        let ry = 0;
        for (let r = 0; r < rows - 1; r++) {
            ry += rowHeights[r] * scale;
            lines.push(
                <line key={`row-${r}`} x1={0} y1={ry} x2={totalW} y2={ry}
                    stroke={borderColor} strokeWidth={sw * 0.5} />
            );
        }

        return lines;
    };

    return (
        <div
            style={{
                position: 'absolute',
                left: scaledBBox.x,
                top: scaledBBox.y,
                width: scaledBBox.width,
                height: scaledBBox.height,
                cursor: isSelected ? 'default' : 'grab',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            onPointerDown={(e) => {
                if (!editingCell && onDragStart) {
                    e.stopPropagation();
                    onSelect();
                    onDragStart(annotation, { x: e.clientX, y: e.clientY });
                }
            }}
        >
            {/* SVG Grid */}
            <svg
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none', overflow: 'visible',
                }}
            >
                {renderGridLines()}
            </svg>

            {/* Cell overlay */}
            {renderCells()}

            {/* Hover indicator */}
            {isHovered && !isSelected && (
                <div style={{
                    position: 'absolute', inset: '-3px',
                    border: '2px dashed #93C5FD',
                    pointerEvents: 'none',
                }} />
            )}

            {/* Selection indicator */}
            {isSelected && (
                <div style={{
                    position: 'absolute', inset: 0,
                    boxShadow: '0 0 0 2px #3B82F6, 0 0 0 3px rgba(59, 130, 246, 0.3)',
                    pointerEvents: 'none',
                }} />
            )}

            {/* Resize handles for the whole table */}
            {isSelected && (
                <ResizeHandles
                    width={scaledBBox.width}
                    height={scaledBBox.height}
                    onResize={handleResize}
                />
            )}

            {/* Col/Row resize handles */}
            {isSelected && !editingCell && (
                <TableResizeHandles
                    colWidths={colWidths}
                    rowHeights={rowHeights}
                    scale={scale}
                    onColResize={handleColResize}
                    onRowResize={handleRowResize}
                />
            )}
        </div>
    );
}
