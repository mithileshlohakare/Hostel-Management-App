'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-slate-950 shadow-sm hover:-translate-y-0.5 hover:brightness-110',
        outline: 'border border-border bg-slate-900/60 text-slate-200 hover:bg-slate-800',
        destructive: 'bg-rose-600 text-white hover:bg-rose-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant }), className)} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
