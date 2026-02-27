/**
 * AnnotationToolbox Component - 주석 도구 패널
 */

import { useState } from 'react';
import {
  Selection, TextT, HighlighterCircle, Rectangle, Circle,
  ArrowUpRight, Pen, Minus, StarFour, BoundingBox, GridFour,
} from 'phosphor-react';
import { useTranslation } from '../../i18n';
import type { ToolType } from '../../core/model/types';
import { TableGridPicker } from './TableGridPicker';

interface AnnotationToolboxProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const toolDefs: { id: ToolType; icon: React.ElementType; i18nKey: string; shortcut?: string }[] = [
  { id: 'select', icon: Selection, i18nKey: 'tools.select', shortcut: 'V' },
  { id: 'text', icon: TextT, i18nKey: 'tools.text', shortcut: 'T' },
  { id: 'table', icon: GridFour, i18nKey: 'tools.table', shortcut: 'G' },
  { id: 'highlighter', icon: HighlighterCircle, i18nKey: 'tools.highlighter', shortcut: 'R' },
  { id: 'rectangle', icon: Rectangle, i18nKey: 'tools.rectangle', shortcut: 'O' },
  { id: 'roundedRect', icon: BoundingBox, i18nKey: 'tools.roundedRect', shortcut: 'U' },
  { id: 'ellipse', icon: Circle, i18nKey: 'tools.ellipse', shortcut: 'C' },
  { id: 'arrow', icon: ArrowUpRight, i18nKey: 'tools.arrow', shortcut: 'A' },
  { id: 'line', icon: Minus, i18nKey: 'tools.line', shortcut: 'L' },
  { id: 'star', icon: StarFour, i18nKey: 'tools.star', shortcut: 'S' },
  { id: 'brush', icon: Pen, i18nKey: 'tools.brush', shortcut: 'B' },
];

export function AnnotationToolbox({ activeTool, onToolChange }: AnnotationToolboxProps) {
  const { t } = useTranslation();
  const [showGridPicker, setShowGridPicker] = useState(false);

  const handleTableSelect = (rows: number, cols: number) => {
    // Store pending config for AnnotationFactory to read
    (globalThis as any).__pendingTableConfig = { rows, cols };
    onToolChange('table');
    setShowGridPicker(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
      {toolDefs.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        const label = t(tool.i18nKey);

        if (tool.id === 'table') {
          return (
            <div key={tool.id} style={{ position: 'relative' }}>
              <button
                className={`btn-icon btn-tool ${isActive ? 'active' : ''}`}
                onClick={() => setShowGridPicker(!showGridPicker)}
                title={`${label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                aria-label={label}
                aria-pressed={isActive}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
              </button>
              {showGridPicker && (
                <TableGridPicker
                  onSelect={handleTableSelect}
                  onClose={() => setShowGridPicker(false)}
                />
              )}
            </div>
          );
        }

        return (
          <button
            key={tool.id}
            className={`btn-icon btn-tool ${isActive ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={`${label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            aria-label={label}
            aria-pressed={isActive}
          >
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
          </button>
        );
      })}
    </div>
  );
}
