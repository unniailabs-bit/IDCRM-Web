'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch@1.1.3';

import { cn } from './utils';

function GreenSwitch({ className, style, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  const isChecked = props.checked || (props as any)['data-state'] === 'checked';
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      style={{
        ...style,
        backgroundColor: isChecked ? '#22c55e' : undefined, // Tailwind green-500
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { GreenSwitch };
