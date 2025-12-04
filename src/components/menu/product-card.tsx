'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Product } from '@/types';
import { formatPriceShort } from '@/lib/format';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow bg-card">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-accent">
            <span className="text-4xl">🧋</span>
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium px-3 py-1 bg-destructive rounded">
              Hết hàng
            </span>
          </div>
        )}
      </div>
      <CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-card-foreground mb-1 line-clamp-2 text-sm sm:text-base min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-base sm:text-lg font-bold text-primary">
            {formatPriceShort(product.price)}
          </span>
          <Button
            size="icon"
            onClick={() => onAddToCart(product)}
            disabled={!product.isAvailable}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
