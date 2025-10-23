/**
 * AnnotationToolbox Component - 주석 도구 패널
 */

import {
  Selection,
  Hand,
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
        id: 'pan', 
        icon: Hand, 
        label: '이동', 
        shortcut: 'H',
        description: '캔버스 드래그 이동',
        gradient: { from: 'rgb(59, 130, 246)', to: 'rgb(37, 99, 235)' },
        shadowColor: 'rgba(59, 130, 246, 0.4)'
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
        id: 'rect', 
        icon: Rectangle, 
        label: '사각형', 
        shortcut: 'O',
        description: '사각형 그리기',
        gradient: { from: 'rgb(239, 68, 68)', to: 'rgb(220, 38, 38)' },
        shadowColor: 'rgba(239, 68, 68, 0.4)'
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
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      width: '100px', // 플로팅 컨테이너 너비
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(24px)',
      borderRadius: '16px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid rgba(216, 180, 254, 0.5)',
      padding: '12px',
      transition: 'box-shadow 0.2s ease-in-out'
    }}>
      {/* 이동 핸들 */}
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: 'rgb(216, 180, 254)',
        borderRadius: '2px',
        marginBottom: '8px',
        cursor: 'grab',
        opacity: 0.6,
        transition: 'opacity 0.2s ease-in-out'
      }} 
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      title="드래그하여 이동"
      />
      
      {toolGroups.map((group, groupIndex) => (
        <div key={group.name} style={{ marginBottom: groupIndex < toolGroups.length - 1 ? '12px' : '0' }}>
          {/* 그룹 헤더 */}
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            color: 'rgb(107, 114, 128)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '6px',
            textAlign: 'center'
          }}>
            {group.name}
          </div>
          
          {/* 그룹 도구들 - 두 줄 배치 */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4px',
            width: '100%'
          }}>
            {group.tools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;

              return (
                <button
                  key={tool.id}
                  onClick={() => onToolChange(tool.id)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease-in-out',
                    background: isActive 
                      ? `linear-gradient(to bottom right, ${tool.gradient.from}, ${tool.gradient.to})` 
                      : 'transparent',
                    color: isActive ? 'white' : 'rgb(75, 85, 99)',
                    boxShadow: isActive 
                      ? `0 4px 8px -2px ${tool.shadowColor}, 0 2px 4px -1px rgba(0, 0, 0, 0.05)` 
                      : 'none',
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                  title={`${tool.label} - ${tool.description}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
                >
                  <Icon size={16} weight={isActive ? 'fill' : 'duotone'} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

