import { Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatCurrency, netPrice } from '@/utils/format';

export function PriceTag({ price, discount, size = 'md', className }: { price: number; discount: number; size?: 'md' | 'lg'; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('font-bold text-fg', size === 'lg' ? 'text-3xl' : 'text-lg')}>{formatCurrency(netPrice(price, discount))}</span>
      {discount > 0 && (
        <>
          <span className="text-sm text-muted line-through" aria-label={`Original price ${formatCurrency(price)}`}>{formatCurrency(price)}</span>
          <Badge variant="success">{discount}% off</Badge>
        </>
      )}
    </div>
  );
}
