import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'white' | 'header';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
}

export function Logo({
  className,
  showText = true,
  variant = 'full',
  size = 'md',
}: LogoProps) {
  const sizes = {
    sm: { width: 32, height: 32, text: 'text-lg' },
    md: { width: 44, height: 44, text: 'text-xl' },
    lg: { width: 56, height: 56, text: 'text-2xl' },
    xl: { width: 80, height: 80, text: 'text-3xl' },
    hero: { width: 180, height: 180, text: 'text-4xl' },
  };

  const { width, height, text } = sizes[size];

  // Header variant - Logo nền nâu chữ AN trắng
  if (variant === 'header') {
    const headerSizes = {
      sm: { width: 36, height: 36 },
      md: { width: 40, height: 40 },
      lg: { width: 48, height: 48 },
      xl: { width: 56, height: 56 },
      hero: { width: 180, height: 180 },
    };
    const hSize = headerSizes[size];

    return (
      <Image
        src="/logo-an-brown.png"
        alt="AN Milk Tea & Tea"
        width={hSize.width}
        height={hSize.height}
        className={cn('object-contain rounded-lg', className)}
        priority
      />
    );
  }

  // Logo trắng (nền trong suốt) - dùng cho nền tối
  if (variant === 'white') {
    return (
      <Image
        src="/logo_an-removebg-while.png"
        alt="AN Milk Tea & Tea"
        width={width}
        height={height}
        className={cn('object-contain', className)}
        priority
      />
    );
  }

  // Logo đầy đủ - nền nâu chữ AN trắng
  if (variant === 'full') {
    return (
      <Image
        src="/logo-an-brown.png"
        alt="AN Milk Tea & Tea"
        width={width}
        height={height}
        className={cn('object-contain rounded-lg', className)}
        priority
      />
    );
  }

  // Icon only - logo trắng
  return (
    <Image
      src="/logo_an-removebg-while.png"
      alt="AN"
      width={width}
      height={height}
      className={cn('object-contain', className)}
      priority
    />
  );
}
