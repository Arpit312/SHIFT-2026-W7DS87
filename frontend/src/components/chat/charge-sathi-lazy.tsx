'use client';

import { lazy } from 'react';

const ChargeSathiWidget = lazy(() =>
  import('./charge-sathi-widget').then((mod) => ({ default: mod.ChargeSathiWidget })),
);

export function ChargeSathiChat() {
  return <ChargeSathiWidget />;
}
