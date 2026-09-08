'use client';

import {
  ShieldCheck,
  Truck,
  Award,
  Zap,
  Star,
  Clock,
  CheckCircle2,
  Gift,
  Heart,
  Sparkles,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

interface BenefitItem {
  icon: string;
  title: string;
  description: string;
}

interface SpecificationItem {
  name: string;
  value: string;
}

interface CampaignBenefitsProps {
  benefits?: BenefitItem[];
  specifications?: SpecificationItem[];
}

const iconMap: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  truck: Truck,
  award: Award,
  zap: Zap,
  star: Star,
  clock: Clock,
  check: CheckCircle2,
  gift: Gift,
  heart: Heart,
  sparkles: Sparkles,
};

export default function CampaignBenefits({
  benefits = [],
  specifications = [],
}: CampaignBenefitsProps) {
  if (benefits.length === 0 && specifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12 py-8">
      {/* Value Proposition Benefits */}
      {benefits.length > 0 && (
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-block rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              Why Choose This Offer
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Guaranteed Satisfaction & Premium Perks
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => {
              const IconComponent = iconMap[b.icon.toLowerCase()] || ShieldCheck;
              return (
                <div
                  key={i}
                  className="group relative flex flex-col items-start rounded-2xl border border-border/70 bg-surface/60 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-surface hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Specifications Table */}
      {specifications.length > 0 && (
        <div className="rounded-2xl border border-border/80 bg-surface/70 p-6 sm:p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Product Specifications</h3>
            <span className="text-xs font-semibold text-muted-foreground">Authentic Specs</span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-2 sm:divide-y-0 sm:gap-x-8 sm:gap-y-3">
            {specifications.map((spec, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2.5 sm:border-b sm:border-border/40"
              >
                <span className="text-xs sm:text-sm font-semibold text-muted-foreground pr-2">
                  {spec.name}
                </span>
                <span className="text-right text-xs sm:text-sm font-bold text-foreground">
                  {spec.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
