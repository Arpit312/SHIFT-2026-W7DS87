'use client';

import { Suspense, useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/layout/role-guard';
import { ROLES } from '@/lib/constants';
import {
  Camera,
  Upload,
  X,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChargeSathiChat } from '@/components/chat/charge-sathi-lazy';

// ── Types from the Flask screener API ────────────────────────────────────────

interface HazardResult {
  type: string;
  label: string;
  severity: 'high' | 'medium' | 'low' | 'unknown';
  confidence: number; // 0-100 already scaled by Flask app
  evidence: string;
}

interface ImageResult {
  filename: string;
  status: string;
  status_label: string;
  status_color: 'green' | 'yellow' | 'orange' | 'red';
  quality: string;
  summary: string;
  hazards: HazardResult[];
  limitations: string[];
}

interface HardwareItem {
  category: string;
  reason: string;
}

interface ScreeningResult {
  group_status: string;
  status_label: string;
  status_color: 'green' | 'yellow' | 'orange' | 'red';
  status_emoji: string;
  status_description: string;
  image_count: number;
  blocked: boolean;
  images: ImageResult[];
  hardware_items: HardwareItem[];
  limitations: string[];
  requires_electrician: boolean;
}

// ── The screener calls the standalone Flask AI server ─────────────────────────
// Run: cd proj && PORT=8001 python app.py
const SCREENER_BASE = process.env.NEXT_PUBLIC_SCREENER_BASE_URL ?? 'http://localhost:8001';

async function callScreener(files: File[]): Promise<ScreeningResult> {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  const res = await fetch(`${SCREENER_BASE}/screen`, { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? `Screener error ${res.status}`);
  return data as ScreeningResult;
}

// ── Colour helpers ────────────────────────────────────────────────────────────

function sevClass(sev: string) {
  switch (sev) {
    case 'high':   return 'bg-danger/15 text-danger border-danger/30';
    case 'medium': return 'bg-warning/15 text-warning border-warning/30';
    case 'low':    return 'bg-success/15 text-success border-success/30';
    default:       return 'bg-elevated text-text-muted border-cn-border';
  }
}

function statusColorClass(color: string) {
  switch (color) {
    case 'green':  return 'border-success/40 bg-success/10';
    case 'yellow': return 'border-warning/40 bg-warning/10';
    case 'orange': return 'border-brand-orange/40 bg-brand-orange/10';
    case 'red':    return 'border-danger/40 bg-danger/10';
    default:       return 'border-cn-border bg-surface';
  }
}

function StatusIcon({ color }: { color: string }) {
  switch (color) {
    case 'green':  return <CheckCircle2 className="w-8 h-8 text-success" />;
    case 'yellow': return <Info className="w-8 h-8 text-warning" />;
    case 'orange': return <AlertTriangle className="w-8 h-8 text-brand-orange" />;
    case 'red':    return <XCircle className="w-8 h-8 text-danger" />;
    default:       return <ShieldAlert className="w-8 h-8 text-text-muted" />;
  }
}

// ── Image result card ─────────────────────────────────────────────────────────

function ImageResultCard({ img }: { img: ImageResult }) {
  const [expanded, setExpanded] = useState(true);
  const realHazards = img.hazards.filter((h) => h.type !== 'none_visible');

  return (
    <div className="border border-cn-border rounded-lg overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-elevated transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Camera className="w-4 h-4 text-text-muted shrink-0" />
          <span className="text-sm font-medium truncate">{img.filename}</span>
          <Badge
            variant={
              img.status_color === 'green' ? 'success'
              : img.status_color === 'red' ? 'danger'
              : img.status_color === 'yellow' ? 'warning'
              : 'info'
            }
          >
            {img.status_label}
          </Badge>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-text-muted shrink-0 ml-2" />
          : <ChevronDown className="w-4 h-4 text-text-muted shrink-0 ml-2" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-cn-border pt-3">
          <p className="text-sm text-text-muted leading-relaxed">{img.summary}</p>

          {realHazards.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Detected Hazards
              </p>
              {realHazards.map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border text-sm',
                    sevClass(h.severity),
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{h.label}</p>
                    <p className="mt-1 text-xs opacity-80 leading-relaxed">{h.evidence}</p>
                  </div>
                  <div className="shrink-0 text-right text-xs">
                    <p className="font-medium capitalize">{h.severity}</p>
                    <p className="opacity-70">{h.confidence}% conf.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  files: File[];
  onAdd: (added: File[]) => void;
  onRemove: (idx: number) => void;
  disabled?: boolean;
}

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

function DropZone({ files, onAdd, onRemove, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) =>
      ALLOWED_EXTS.some((ext) => f.name.toLowerCase().endsWith(ext)),
    );
    if (valid.length) onAdd(valid);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload parking photos"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors select-none',
          disabled
            ? 'opacity-50 cursor-not-allowed border-cn-border'
            : dragging
              ? 'border-brand-orange bg-brand-orange/5'
              : 'border-cn-border hover:border-brand-orange/60 hover:bg-elevated',
        )}
      >
        <Upload className="w-8 h-8 text-text-muted mx-auto mb-3" />
        <p className="font-medium text-text-primary">Drag &amp; drop photos here</p>
        <p className="text-sm text-text-muted mt-1">
          or <span className="text-brand-orange underline">browse files</span>
        </p>
        <p className="text-xs text-text-muted mt-2">JPG · PNG · WEBP · Multiple images supported</p>
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={f.name}
                  className="w-20 h-20 object-cover rounded-lg border border-cn-border"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                  disabled={disabled}
                  className="absolute -top-1.5 -right-1.5 bg-danger text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${f.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ParkingScreenerInner() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  // Chat is opened by the floating widget; we just need to open it when user clicks Ask ChargeSathi
  const [chatOpen, setChatOpen] = useState(false);

  const addFiles = useCallback((added: File[]) => {
    setFiles((prev) => [...prev, ...added]);
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleScreen = async () => {
    if (!files.length) return;
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    try {
      const data = await callScreener(files);
      setResult(data);
      setStatus('done');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not reach the AI screener. Make sure the Flask server is running (cd proj && python app.py).';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setErrorMsg('');
    setStatus('idle');
    setChatOpen(false);
  };

  const busy = status === 'loading';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-heading text-text-primary">
          Parking Space Screener
        </h1>
        <p className="text-text-muted mt-1">
          Upload photos of your parking area for AI-assisted visible-risk screening. Not a safety
          certification or installation approval.
        </p>
      </div>

      {/* Notice */}
      <div className="flex items-start gap-3 p-4 rounded-lg border border-info/30 bg-info/5 text-sm">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-info" />
        <p className="text-text-muted">
          This tool checks only for <strong className="text-text-primary">visible hazards</strong>{' '}
          in your photos. It cannot assess hidden wiring, earthing, circuit capacity, or breaker
          ratings. An electrician must verify all findings before any installation work begins.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Parking Photos</CardTitle>
          <CardDescription>
            Include clear, well-lit photos of the wall, floor, and surroundings of your proposed
            charger location. Multiple photos improve accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <DropZone files={files} onAdd={addFiles} onRemove={removeFile} disabled={busy} />

          <div className="flex gap-3 justify-end">
            {(files.length > 0 || status !== 'idle') && (
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={busy}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Reset
              </Button>
            )}
            <Button
              onClick={handleScreen}
              disabled={files.length === 0 || busy}
              loading={busy}
              icon={!busy ? <Camera className="w-4 h-4" /> : undefined}
            >
              {busy
                ? 'Analysing…'
                : `Check My Parking Space${files.length > 1 ? ` (${files.length} photos)` : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-danger/40 bg-danger/10">
          <XCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-danger text-sm">Screening failed</p>
            <p className="text-sm text-danger/80 mt-0.5 break-words">{errorMsg}</p>
            <p className="text-xs text-text-muted mt-2">
              Make sure the AI screener server is running:{' '}
              <code className="bg-elevated px-1 rounded text-text-primary">
                cd proj &amp;&amp; python app.py
              </code>
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleScreen}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {result && status === 'done' && (
        <div className="space-y-5">
          {/* Verdict banner */}
          <div
            className={cn(
              'flex flex-col sm:flex-row items-start gap-5 p-6 rounded-xl border',
              statusColorClass(result.status_color),
            )}
          >
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <StatusIcon color={result.status_color} />
              <div className="min-w-0">
                <h2 className="text-xl font-bold">
                  {result.status_emoji} {result.status_label}
                </h2>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  {result.status_description}
                </p>
                {result.blocked && (
                  <p className="mt-2 text-sm font-semibold text-danger">
                    ⛔ Blocked from installation progress until findings are resolved.
                  </p>
                )}
                <p className="mt-2 text-xs text-text-muted">
                  ⚠ Electrician verification is always required before any installation.
                </p>
              </div>
            </div>

            {/* Ask ChargeSathi CTA */}
            <div className="shrink-0 self-start sm:self-center">
              <Button
                onClick={() => setChatOpen(true)}
                variant="secondary"
                icon={<MessageCircle className="w-4 h-4" />}
              >
                Ask ChargeSathi
              </Button>
              <p className="text-xs text-text-muted mt-1 text-center">
                Why was this flagged?
              </p>
            </div>
          </div>

          {/* Per-image */}
          <Card>
            <CardHeader>
              <CardTitle>Image-by-Image Analysis</CardTitle>
              <CardDescription>
                {result.image_count} photo{result.image_count !== 1 ? 's' : ''} analysed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {result.images.map((img, i) => (
                <ImageResultCard key={i} img={img} />
              ))}
            </CardContent>
          </Card>

          {/* Hardware checklist */}
          {result.hardware_items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preliminary Hardware Checklist</CardTitle>
                <CardDescription>
                  Categories to verify with your electrician. Not an exhaustive specification.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-cn-border">
                  {result.hardware_items.map((item, i) => (
                    <div key={i} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                      <CheckCircle2 className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold">{item.category}</p>
                        <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Limitations */}
          {result.limitations.length > 0 && (
            <Card className="border-dashed bg-surface/50">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                  Limitations of This Screening
                </p>
                <ul className="space-y-1.5">
                  {result.limitations.map((lim, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warning" />
                      {lim}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Bottom Ask ChargeSathi */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 rounded-xl border border-cn-border bg-surface">
            <div>
              <p className="font-semibold text-text-primary">Have questions about these findings?</p>
              <p className="text-sm text-text-muted mt-0.5">
                ChargeSathi can explain the risks, corrective actions, and what an electrician needs to check.
              </p>
            </div>
            <Button
              onClick={() => setChatOpen(true)}
              icon={<MessageCircle className="w-4 h-4" />}
            >
              Ask ChargeSathi: Why was this flagged?
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-text-muted py-2 border-t border-cn-border">
            This AI screening is based solely on visible evidence in the provided photos. It is{' '}
            <strong>not a safety certification, electrical design, or installation approval</strong>.
            An electrician must verify all findings before any work begins.
          </p>
        </div>
      )}

      {/* ChargeSathi chat (floating widget, opened when user clicks the button) */}
      {chatOpen && (
        <Suspense fallback={null}>
          <ChargeSathiChat initialOpen={true} />
        </Suspense>
      )}
    </div>
  );
}

export default function ParkingScreenerPage() {
  return (
    <RoleGuard allowedRoles={[ROLES.EV_OWNER]}>
      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <ParkingScreenerInner />
      </Suspense>
    </RoleGuard>
  );
}
