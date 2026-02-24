/**
 * ResizeHandles Component - 리사이즈 핸들
 * 8방향 리사이즈 지원
 */

import { useState, useEffect } from 'react';

interface ResizeHandlesProps {
  width: number;
  height: number;
  // onResize now receives incremental changes (delta) instead of absolute values
  onResize: (dWidth: number, dHeight: number, dX: number, dY: number) => void;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export function ResizeHandles({ width: _w, height: _h, onResize }: ResizeHandlesProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<HandlePosition | null>(null);

  // We store the last mouse position to calculate incremental movement
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number } | null>(null);

  // Store initial dimensions for aspect ratio calculation
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);

  const handleMouseDown = (e: React.PointerEvent, handle: HandlePosition) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setIsResizing(true);
    setResizeHandle(handle);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    setInitialSize({ width: _w, height: _h }); // Store initial size for aspect ratio
  };

  useEffect(() => {
    if (!isResizing || !resizeHandle || !lastMousePos) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      let dWidth = 0;
      let dHeight = 0;
      let dX = 0;
      let dY = 0;

      // Logic: 
      // Right/Bottom (East/South) handles increase size, no position change.
      // Left/Top (West/North) handles increase size AND change position (move left/up).

      if (resizeHandle.includes('e')) {
        dWidth = dx;
      } else if (resizeHandle.includes('w')) {
        dWidth = -dx;
        dX = dx;
      }

      if (resizeHandle.includes('s')) {
        dHeight = dy;
      } else if (resizeHandle.includes('n')) {
        dHeight = -dy;
        dY = dy;
      }

      // Shift key: maintain aspect ratio
      if (e.shiftKey && initialSize && initialSize.width > 0 && initialSize.height > 0) {
        const aspectRatio = initialSize.width / initialSize.height;

        // For corner handles, use the dominant axis
        if (resizeHandle === 'nw' || resizeHandle === 'ne' || resizeHandle === 'sw' || resizeHandle === 'se') {
          // Determine which delta is dominant
          if (Math.abs(dWidth) >= Math.abs(dHeight * aspectRatio)) {
            // Width is dominant
            const newDHeight = dWidth / aspectRatio;
            if (resizeHandle.includes('n')) {
              dY = -newDHeight + dHeight; // Adjust position for north handles
            }
            dHeight = newDHeight;
          } else {
            // Height is dominant
            const newDWidth = dHeight * aspectRatio;
            if (resizeHandle.includes('w')) {
              dX = -newDWidth + dWidth; // Adjust position for west handles
            }
            dWidth = newDWidth;
          }
        }
      }

      if (dWidth !== 0 || dHeight !== 0 || dX !== 0 || dY !== 0) {
        onResize(dWidth, dHeight, dX, dY);
        setLastMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeHandle(null);
      setLastMousePos(null);
      setInitialSize(null);
    };

    window.addEventListener('pointermove', handleMouseMove);
    window.addEventListener('pointerup', handleMouseUp);

    return () => {
      window.removeEventListener('pointermove', handleMouseMove);
      window.removeEventListener('pointerup', handleMouseUp);
    };
  }, [isResizing, resizeHandle, lastMousePos, initialSize, onResize]);

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
          style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            backgroundColor: '#3B82F6',
            border: '2px solid white',
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
            zIndex: 10,
            transition: 'transform 0.15s ease-in-out',
            ...style,
            cursor,
          }}
          onPointerDown={(e) => handleMouseDown(e, position)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ))}
    </>
  );
}
