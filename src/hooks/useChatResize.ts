import { useState, useCallback, useEffect } from 'react';
import { ChatSize, MIN_WIDTH, MAX_WIDTH, MIN_HEIGHT, MAX_HEIGHT_VH } from './useChatStorage';

export function useChatResize(
  initialSize: ChatSize,
  onSizeChange: (size: ChatSize) => void
) {
  const [isResizing, setIsResizing] = useState(false);
  const [size, setSize] = useState(initialSize);

  const isMobile = () => window.innerWidth < 768;

  const clampSize = (w: number, h: number): { w: number; h: number } => {
    const maxH = (window.innerHeight * MAX_HEIGHT_VH) / 100;
    return {
      w: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, w)),
      h: Math.max(MIN_HEIGHT, Math.min(maxH, h))
    };
  };

  const startResize = useCallback((e: React.PointerEvent) => {
    if (size.mode !== 'docked' || isMobile()) return;
    
    e.preventDefault();
    setIsResizing(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.w;
    const startHeight = size.h;

    const onMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newSize = clampSize(
        startWidth + deltaX,
        startHeight + deltaY
      );
      
      setSize({ ...size, ...newSize });
    };

    const onUp = () => {
      setIsResizing(false);
      onSizeChange(size);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, [size, onSizeChange]);

  const toggleMode = useCallback(() => {
    const newMode: 'docked' | 'fullscreen' = size.mode === 'docked' ? 'fullscreen' : 'docked';
    const newSize: ChatSize = { ...size, mode: newMode };
    setSize(newSize);
    onSizeChange(newSize);
  }, [size, onSizeChange]);

  useEffect(() => {
    setSize(initialSize);
  }, [initialSize]);

  return {
    size,
    isResizing,
    startResize,
    toggleMode,
  };
}
