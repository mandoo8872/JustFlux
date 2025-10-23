/**
 * ResizeHandles Component - 리사이즈 핸들
 * 8방향 리사이즈 지원
 */

import { useState, useEffect } from 'react';

interface ResizeHandlesProps {
  width: number;
  height: number;
  onResize: (width: number, height: number) => void;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export function ResizeHandles({ width, height, onResize }: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<HandlePosition | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    });
  };

  useEffect(() => {
    if (!isResizing || !resizeHandle || !resizeStart) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;

      // Horizontal resize
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, resizeStart.width + dx);
      } else if (resizeHandle.includes('w')) {
        newWidth = Math.max(50, resizeStart.width - dx);
      }

      // Vertical resize
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(30, resizeStart.height + dy);
      } else if (resizeHandle.includes('n')) {
        newHeight = Math.max(30, resizeStart.height - dy);
      }

      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setResizeStart(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, resizeStart, onResize]);

  const handles: { position: HandlePosition; cursor: string; style: React.CSSProperties }[] = [
    { position: 'nw', cursor: 'nw-resize', style: { left: -4, top: -4 } },
    { position: 'n', cursor: 'n-resize', style: { left: '50%', top: -4, transform: 'translateX(-50%)' } },
    { position: 'ne', cursor: 'ne-resize', style: { right: -4, top: -4 } },
    { position: 'w', cursor: 'w-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'e', cursor: 'e-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
    { position: 'sw', cursor: 'sw-resize', style: { left: -4, bottom: -4 } },
    { position: 's', cursor: 's-resize', style: { left: '50%', bottom: -4, transform: 'translateX(-50%)' } },
    { position: 'se', cursor: 'se-resize', style: { right: -4, bottom: -4 } },
  ];

  return (
    <>
      {handles.map(({ position, cursor, style }) => (
        <div
          key={position}
          className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full shadow-md hover:scale-125 transition-transform z-10"
          style={{
            ...style,
            cursor,
          }}
          onMouseDown={(e) => handleMouseDown(e, position)}
        />
      ))}
    </>
  );
}




