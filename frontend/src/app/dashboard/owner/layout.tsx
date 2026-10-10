import { Suspense } from 'react';
import { ChargeSathiChat } from '@/components/chat/charge-sathi-lazy';

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <ChargeSathiChat />
      </Suspense>
    </>
  );
}
