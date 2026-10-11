'use client';

import { lazy } from 'react';

const ChargeSathiWidget = lazy(() =>
  import('./charge-sathi-widget').then((mod) => ({ default: mod.ChargeSathiWidget })),
);

export function ChargeSathiChat({ assessmentId, initialOpen }: { assessmentId?: number | string; initialOpen?: boolean }) {
  return <ChargeSathiWidget assessmentId={assessmentId} initialOpen={initialOpen} />;
}
