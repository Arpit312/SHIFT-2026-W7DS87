'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function LearnPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">Charging Safety Learn</h1>
        <p className="text-text-muted mt-1">General guidance for safe EV charging in apartment societies.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <CardTitle>Safe Charging Setup</CardTitle>
            </div>
            <CardDescription>Best practices for your installation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-text-primary leading-relaxed">
              Ensure your charger is installed by a certified professional. Use dedicated circuits where possible, and always confirm proper earthing. Avoid using extension cords or multi-plug adapters.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-orange" />
              <CardTitle>Warning Signs</CardTitle>
            </div>
            <CardDescription>When to call a professional.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc pl-4 space-y-2 text-sm text-text-primary">
              <li>Scorch marks or melting on the socket or plug.</li>
              <li>Frequent tripping of MCBs during charging.</li>
              <li>Frayed or exposed wires on the charging cable.</li>
              <li>Water ingress near outdoor sockets.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              <CardTitle>Battery Care Basics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-primary leading-relaxed max-w-3xl">
              Following your manufacturer&apos;s guidelines is the best way to maintain battery health. Generally, keeping the charge level between 20% and 80% for daily use can extend battery life. Avoid exposing the vehicle to extreme temperatures for prolonged periods when the battery state of charge is very low or very high.
            </p>
            <div className="mt-4 p-4 bg-surface border border-cn-border rounded-lg text-xs text-text-muted">
              <strong>Disclaimer:</strong> This content is general guidance and does not replace your vehicle manufacturer&apos;s instructions.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
