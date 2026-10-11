'use client';

import { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { ChargeSathiChat } from './charge-sathi-lazy';

interface AskChargeSathiButtonProps {
  assessmentId: number | string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button that opens ChargeSathi with assessment context.
 * Used on Photo Check Report page.
 */
export function AskChargeSathiButton({
  assessmentId,
  variant = 'secondary',
  size = 'md',
}: AskChargeSathiButtonProps) {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowChat(true)}
        variant={variant}
        size={size}
        icon={<MessageCircle className="w-4 h-4" />}
      >
        Ask ChargeSathi
      </Button>
      
      {showChat && (
        <Suspense fallback={null}>
          <ChargeSathiChat assessmentId={assessmentId} />
        </Suspense>
      )}
    </>
  );
}
