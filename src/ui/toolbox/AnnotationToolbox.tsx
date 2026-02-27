/**
 * AnnotationToolbox Component - 주석 도구 패널
 */

import {
  Selection,
  TextT,
  HighlighterCircle,
  Rectangle,
  Circle,
  ArrowUpRight,
  Pen,
  Minus,
  StarFour,
  BoundingBox,
} from 'phosphor-react';
import type { ToolType } from '../../core/model/types';

interface AnnotationToolboxProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
}

interface ToolButton {
  id: ToolType;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
}

const mainTools: ToolButton[] = [
  { id: 'select', icon: Selection, label: '선택', shortcut: 'V' },
  { id: 'text', icon: TextT, label: '텍스트', shortcut: 'T' },
  { id: 'highlighter', icon: HighlighterCircle, label: '형광펜', shortcut: 'R' },
  { id: 'rectangle', icon: Rectangle, label: '사각형', shortcut: 'O' },
  { id: 'roundedRect', icon: BoundingBox, label: '둥근 사각형', shortcut: 'U' },
  { id: 'ellipse', icon: Circle, label: '원형', shortcut: 'C' },
  { id: 'arrow', icon: ArrowUpRight, label: '화살표', shortcut: 'A' },
  { id: 'line', icon: Minus, label: '직선', shortcut: 'L' },
  { id: 'star', icon: StarFour, label: '별', shortcut: 'S' },
  { id: 'brush', icon: Pen, label: '펜', shortcut: 'B' },
];

export function AnnotationToolbox({ activeTool, onToolChange }: AnnotationToolboxProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-1)' }}>
      {mainTools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            className={`btn-icon btn-tool ${isActive ? 'active' : ''}`}
            onClick={() => onToolChange(tool.id)}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
            aria-label={tool.label}
            aria-pressed={isActive}
          >
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
          </button>
        );
      })}
    </div>
  );
}
