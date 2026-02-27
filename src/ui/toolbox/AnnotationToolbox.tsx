/**
 * AnnotationToolbox Component - 주석 도구 패널
 */

import {
  Selection, TextT, HighlighterCircle, Rectangle, Circle,
  ArrowUpRight, Pen, Minus, StarFour, BoundingBox,
} from 'phosphor-react';
import { useTranslation } from '../../i18n';
import type { ToolType } from '../../core/model/types';

interface AnnotationToolboxProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

const toolDefs: { id: ToolType; icon: React.ElementType; i18nKey: string; shortcut?: string }[] = [
  { id: 'select', icon: Selection, i18nKey: 'tools.select', shortcut: 'V' },
  { id: 'text', icon: TextT, i18nKey: 'tools.text', shortcut: 'T' },
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
      {toolDefs.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;
        const label = t(tool.i18nKey);

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
