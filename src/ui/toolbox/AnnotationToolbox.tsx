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
  Eraser,
  Minus,
  StarFour,
  Heart,
  LightningSlash,
  MagnifyingGlass,
  Crop,
  Copy,
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
  description: string;
  gradient: { from: string; to: string };
  shadowColor: string;
}

interface ToolGroup {
  name: string;
  tools: ToolButton[];
}

const toolGroups: ToolGroup[] = [
  {
    name: '기본',
    tools: [
      {
        id: 'select',
        icon: Selection,
        label: '선택',
        shortcut: 'V',
        description: '주석 선택 및 편집',
        gradient: { from: 'rgb(168, 85, 247)', to: 'rgb(147, 51, 234)' },
        shadowColor: 'rgba(168, 85, 247, 0.4)'
      },
      {
        id: 'text',
        icon: TextT,
        label: '텍스트',
        shortcut: 'T',
        description: '텍스트 주석 추가',
        gradient: { from: 'rgb(34, 197, 94)', to: 'rgb(22, 163, 74)' },
        shadowColor: 'rgba(34, 197, 94, 0.4)'
      },
      {
        id: 'highlight',
        icon: HighlighterCircle,
        label: '형광펜',
        shortcut: 'R',
        description: '하이라이트 표시',
        gradient: { from: 'rgb(251, 191, 36)', to: 'rgb(245, 158, 11)' },
        shadowColor: 'rgba(251, 191, 36, 0.4)'
      }
    ]
  },
  {
    name: '도형',
    tools: [
      {
        id: 'rectangle',
        icon: Rectangle,
        label: '사각형',
        shortcut: 'O',
        description: '사각형 그리기',
        gradient: { from: 'rgb(239, 68, 68)', to: 'rgb(220, 38, 38)' },
        shadowColor: 'rgba(239, 68, 68, 0.4)'
      },
      {
        id: 'roundedRect',
        icon: BoundingBox,
        label: '둥근 사각형',
        shortcut: 'U',
        description: '둥근 사각형 그리기',
        gradient: { from: 'rgb(249, 115, 22)', to: 'rgb(234, 88, 12)' },
        shadowColor: 'rgba(249, 115, 22, 0.4)'
      },
      {
        id: 'ellipse',
        icon: Circle,
        label: '원형',
        shortcut: 'C',
        description: '원형 그리기',
        gradient: { from: 'rgb(168, 85, 247)', to: 'rgb(147, 51, 234)' },
        shadowColor: 'rgba(168, 85, 247, 0.4)'
      },
      {
        id: 'arrow',
        icon: ArrowUpRight,
        label: '화살표',
        shortcut: 'A',
        description: '화살표 그리기',
        gradient: { from: 'rgb(14, 165, 233)', to: 'rgb(2, 132, 199)' },
        shadowColor: 'rgba(14, 165, 233, 0.4)'
      },
      {
        id: 'line',
        icon: Minus,
        label: '직선',
        shortcut: 'L',
        description: '직선 그리기',
        gradient: { from: 'rgb(16, 185, 129)', to: 'rgb(5, 150, 105)' },
        shadowColor: 'rgba(16, 185, 129, 0.4)'
      }
    ]
  },
  {
    name: '특수',
    tools: [
      {
        id: 'star',
        icon: StarFour,
        label: '별',
        shortcut: 'S',
        description: '별 모양 그리기',
        gradient: { from: 'rgb(251, 191, 36)', to: 'rgb(245, 158, 11)' },
        shadowColor: 'rgba(251, 191, 36, 0.4)'
      },
      {
        id: 'heart',
        icon: Heart,
        label: '하트',
        shortcut: 'H',
        description: '하트 모양 그리기',
        gradient: { from: 'rgb(236, 72, 153)', to: 'rgb(219, 39, 119)' },
        shadowColor: 'rgba(236, 72, 153, 0.4)'
      },
      {
        id: 'lightning',
        icon: LightningSlash,
        label: '번개',
        shortcut: 'Z',
        description: '번개 모양 그리기',
        gradient: { from: 'rgb(251, 191, 36)', to: 'rgb(245, 158, 11)' },
        shadowColor: 'rgba(251, 191, 36, 0.4)'
      },
      {
        id: 'brush',
        icon: Pen,
        label: '펜',
        shortcut: 'B',
        description: '자유 그리기',
        gradient: { from: 'rgb(99, 102, 241)', to: 'rgb(79, 70, 229)' },
        shadowColor: 'rgba(99, 102, 241, 0.4)'
      }
    ]
  },
  {
    name: '편집',
    tools: [
      {
        id: 'eraser',
        icon: Eraser,
        label: '지우개',
        shortcut: 'E',
        description: '주석 삭제',
        gradient: { from: 'rgb(107, 114, 128)', to: 'rgb(75, 85, 99)' },
        shadowColor: 'rgba(107, 114, 128, 0.4)'
      },
      {
        id: 'zoom',
        icon: MagnifyingGlass,
        label: '확대',
        shortcut: 'M',
        description: '줌 인/아웃',
        gradient: { from: 'rgb(139, 92, 246)', to: 'rgb(124, 58, 237)' },
        shadowColor: 'rgba(139, 92, 246, 0.4)'
      },
      {
        id: 'crop',
        icon: Crop,
        label: '자르기',
        shortcut: 'X',
        description: '영역 자르기',
        gradient: { from: 'rgb(34, 197, 94)', to: 'rgb(22, 163, 74)' },
        shadowColor: 'rgba(34, 197, 94, 0.4)'
      },
      {
        id: 'copy',
        icon: Copy,
        label: '복사',
        shortcut: 'Ctrl+C',
        description: '주석 복사',
        gradient: { from: 'rgb(59, 130, 246)', to: 'rgb(37, 99, 235)' },
        shadowColor: 'rgba(59, 130, 246, 0.4)'
      }
    ]
  }
];

export function AnnotationToolbox({ activeTool, onToolChange }: AnnotationToolboxProps) {
  const handleToolChange = (tool: ToolType) => {
    onToolChange(tool);
  };

  // Adobe 스타일: 주요 도구만 가로로 배치
  const mainTools = [
    toolGroups[0].tools[0], // select
    toolGroups[0].tools[1], // text
    toolGroups[0].tools[2], // highlight
    toolGroups[1].tools[0], // rectangle
    toolGroups[1].tools[1], // roundedRect
    toolGroups[1].tools[2], // ellipse
    toolGroups[1].tools[3], // arrow
    toolGroups[2].tools[3], // brush (pen)
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px'
    }}>
      {mainTools.map((tool) => {
        const Icon = tool.icon;
        const isActive = activeTool === tool.id;

        return (
          <button
            key={tool.id}
            onClick={() => handleToolChange(tool.id)}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease-in-out',
              background: isActive ? '#0078D4' : 'transparent',
              color: isActive ? 'white' : '#333333',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#E0E0E0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            title={tool.label}
          >
            <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
          </button>
        );
      })}
    </div>
  );
}

