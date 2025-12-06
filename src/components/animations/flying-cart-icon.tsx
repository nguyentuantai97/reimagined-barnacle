'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FlyingCartIconProps {
  startElement?: HTMLElement | null;
  startPosition?: { x: number; y: number } | null;
  endElement: HTMLElement | null;
  onComplete: () => void;
  imageUrl?: string;
}

export function FlyingCartIcon({ startElement, startPosition, endElement, onComplete }: FlyingCartIconProps) {
  const [mounted, setMounted] = useState(false);
  const [icons, setIcons] = useState<Array<{ id: number; startX: number; startY: number; endX: number; endY: number }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if ((!startElement && !startPosition) || !endElement || !mounted) return;

    // Get start position from element or prop
    let startX: number, startY: number;
    if (startPosition) {
      startX = startPosition.x;
      startY = startPosition.y;
    } else if (startElement) {
      const startRect = startElement.getBoundingClientRect();
      startX = startRect.left + startRect.width / 2;
      startY = startRect.top + startRect.height / 2;
    } else {
      return;
    }

    const endRect = endElement.getBoundingClientRect();
    const endX = endRect.left + endRect.width / 2;
    const endY = endRect.top + endRect.height / 2;

    // Create 3 flying icons with slight delays and random offsets
    const newIcons = [0, 1, 2].map((i) => ({
      id: Date.now() + i,
      startX: startX + (Math.random() - 0.5) * 20,
      startY: startY + (Math.random() - 0.5) * 20,
      endX,
      endY,
    }));

    setIcons(newIcons);

    // Remove icons and trigger completion after animation
    const timer = setTimeout(() => {
      setIcons([]);
      onComplete();
    }, 900); // Updated to match new 0.8s animation duration + delays

    return () => clearTimeout(timer);
  }, [startElement, startPosition, endElement, mounted, onComplete]);

  if (!mounted) return null;

  return createPortal(
    <>
      {icons.map((icon, index) => (
        <div
          key={icon.id}
          className="fixed pointer-events-none z-[9999]"
          style={{
            left: icon.startX,
            top: icon.startY,
            animationDelay: `${index * 80}ms`,
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-2xl animate-fly-to-cart"
            style={{
              '--start-x': '0px',
              '--start-y': '0px',
              '--end-x': `${icon.endX - icon.startX}px`,
              '--end-y': `${icon.endY - icon.startY}px`,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.5)',
              fontSize: '1.5rem',
            } as React.CSSProperties}
          >
            🧋
          </div>
        </div>
      ))}
    </>,
    document.body
  );
}
