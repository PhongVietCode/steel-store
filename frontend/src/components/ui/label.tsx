import * as LabelPrimitive from '@radix-ui/react-label';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { cn } from '@/lib/utils';

export const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted',
      className,
    )}
    {...props}
  />
));
Label.displayName = 'Label';
