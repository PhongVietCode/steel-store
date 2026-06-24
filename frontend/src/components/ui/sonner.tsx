import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast: 'bg-white border-neutral-200 text-neutral-900 shadow-sm',
          description: 'text-neutral-600',
        },
      }}
    />
  );
}
