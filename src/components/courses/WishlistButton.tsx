import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui';
import { toggleWishlist } from '@/features/wishlist/wishlistSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsWishlisted } from '@/store/selectors';
import { cn } from '@/utils/cn';

export function WishlistButton({ courseId, courseTitle, className, withLabel }: { courseId: string; courseTitle: string; className?: string; withLabel?: boolean }) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const wished = useAppSelector(selectIsWishlisted(courseId));

  const onClick = (): void => {
    dispatch(toggleWishlist(courseId));
    toast.info(wished ? 'Removed from wishlist' : 'Saved to wishlist', courseTitle);
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      aria-pressed={wished}
      aria-label={wished ? `Remove ${courseTitle} from wishlist` : `Add ${courseTitle} to wishlist`}
      className={cn('inline-flex items-center justify-center gap-2 transition', className)}
    >
      <motion.span key={String(wished)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 14 }} className="flex">
        <Heart className={cn('h-5 w-5', wished ? 'fill-rose-500 text-rose-500' : 'text-muted')} aria-hidden />
      </motion.span>
      {withLabel && <span className="text-sm font-medium">{wished ? 'Saved' : 'Save'}</span>}
    </motion.button>
  );
}
