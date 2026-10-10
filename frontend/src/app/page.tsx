'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Zap, ShieldAlert, LineChart, CheckCircle2, ChevronRight, Lock, FileText } from 'lucide-react';

// Dynamically import Three.js scene with ssr: false
const HeroScene = dynamic(() => import('@/components/landing/hero-scene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 z-0 bg-background/50" />,
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-brand-orange selection:text-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-cn-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-orange">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-heading font-bold text-xl tracking-tight text-text-primary">ChargeNOC</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-text-muted hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-48">
          <HeroScene />
          
          <div className="container relative z-10 mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex items-center rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange mb-8">
              <Zap className="mr-2 h-4 w-4" />
              For Indian Apartment Societies
            </div>
            
            <h1 className="mx-auto max-w-4xl font-heading text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-7xl mb-6 text-balance">
              Give Your RWA a Reason <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-gold">
                to Say Yes.
              </span>
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-text-muted mb-10 leading-relaxed">
              ChargeNOC helps residents request EV charging permission, and helps Resident Welfare Associations (RWAs) make safe, evidence-based decisions without installing new hardware.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto" icon={<ChevronRight className="w-4 h-4 ml-2" />}>
                  Start Charging Request
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  RWA Admin Login
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Fading bottom edge */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </section>

        {/* The Three RWA Concerns Section */}
        <section className="py-24 bg-surface">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl font-bold text-text-primary mb-4">Addressing Core RWA Concerns</h2>
              <p className="text-text-muted max-w-2xl mx-auto">We provide the documented evidence RWAs need to confidently approve EV charging installations.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-8 rounded-2xl border border-cn-border">
                <div className="w-12 h-12 bg-danger/10 rounded-lg flex items-center justify-center mb-6">
                  <ShieldAlert className="w-6 h-6 text-danger" />
                </div>
                <h3 className="text-xl font-bold mb-3">Fire & Wiring Safety</h3>
                <p className="text-text-muted">ChargeNOC&apos;s AI screening and required photo evidence ensure installations meet basic safety standards before an electrician is even dispatched.</p>
              </div>
              
              <div className="bg-background p-8 rounded-2xl border border-cn-border">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mb-6">
                  <LineChart className="w-6 h-6 text-info" />
                </div>
                <h3 className="text-xl font-bold mb-3">Electrical Load</h3>
                <p className="text-text-muted">By capturing charger specifications upfront, the RWA can track cumulative society load and safely schedule charging times.</p>
              </div>
              
              <div className="bg-background p-8 rounded-2xl border border-cn-border">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6 text-success" />
                </div>
                <h3 className="text-xl font-bold mb-3">Electricity Billing</h3>
                <p className="text-text-muted">Provides a transparent reconciliation framework for sub-meters, ensuring society electricity is fairly billed to the EV owner.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="font-heading text-3xl font-bold text-text-primary mb-8">How ChargeNOC Works</h2>
                <div className="space-y-8">
                  {[
                    { title: '1. EV Owner Requests', desc: 'Owner submits vehicle details, socket ratings, and photos of the installation area.' },
                    { title: '2. AI Preliminary Screening', desc: 'Our vision model analyzes photos for hazards, clear labels, and proper earthing indicators.' },
                    { title: '3. Professional Verification', desc: 'If required, an assigned electrician verifies the setup and uploads a sign-off report.' },
                    { title: '4. RWA Decision', desc: 'RWA reviews the complete, documented packet and records an official decision.' }
                  ].map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <CheckCircle2 className="w-6 h-6 text-brand-orange" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-text-primary">{step.title}</h4>
                        <p className="mt-1 text-text-muted">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-gold/20 rounded-3xl blur-3xl" />
                <div className="relative bg-surface border border-cn-border rounded-2xl p-6 shadow-2xl">
                  {/* Mockup UI */}
                  <div className="border-b border-cn-border pb-4 mb-4 flex items-center justify-between">
                    <span className="font-semibold text-lg">Haan Packet</span>
                    <span className="text-xs bg-brand-orange/20 text-brand-orange px-2 py-1 rounded">Generated</span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-elevated rounded w-3/4" />
                    <div className="h-4 bg-elevated rounded w-1/2" />
                    <div className="h-4 bg-elevated rounded w-5/6" />
                    <div className="h-32 bg-elevated rounded mt-6 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-text-muted" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Limits Section */}
        <section className="py-20 bg-elevated border-y border-cn-border">
          <div className="container mx-auto px-4 lg:px-8 text-center max-w-3xl">
            <Lock className="w-10 h-10 text-text-muted mx-auto mb-6" />
            <h2 className="font-heading text-2xl font-bold text-text-primary mb-4">Our Commitment to Transparency</h2>
            <p className="text-text-muted mb-4">
              ChargeNOC provides <strong className="text-text-primary">preliminary screening</strong>, not electrical certification. 
            </p>
            <p className="text-text-muted mb-4">
              The generated &quot;Haan Packet&quot; records a request and an RWA decision. It is <strong className="text-text-primary">not a legal NOC</strong> or a safety certificate.
            </p>
            <p className="text-text-muted">
              We do not physically control chargers or electrical supply. We provide the workflow and documentation required for safe human decision-making.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background py-12 border-t border-cn-border">
        <div className="container mx-auto px-4 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-text-muted">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-heading font-semibold">ChargeNOC</span>
          </div>
          <div className="text-sm text-text-muted">
            &copy; {2024} ChargeNOC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
