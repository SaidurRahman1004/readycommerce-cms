'use client';

import { useEffect, useState, useMemo } from 'react';
import { Clock, Flame } from 'lucide-react';

interface CampaignCountdownProps {
  expiresAt?: string;
  serverTime?: string;
  title?: string;
  onExpire?: () => void;
  variant?: 'banner' | 'card' | 'compact';
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function CampaignCountdown({
  expiresAt,
  serverTime,
  title = 'Offer Ends In',
  onExpire,
  variant = 'card',
}: CampaignCountdownProps) {
  const [mounted, setMounted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });

  // Calculate target timestamp
  const targetMs = useMemo(() => {
    if (!expiresAt) return 0;
    return new Date(expiresAt).getTime();
  }, [expiresAt]);

  // Initial offset calculation using serverTime to eliminate client clock skew
  const clockOffsetMs = useMemo(() => {
    if (!serverTime) return 0;
    return new Date(serverTime).getTime() - Date.now();
  }, [serverTime]);

  useEffect(() => {
    setMounted(true);
    if (!targetMs) return;

    const calculateTime = () => {
      const now = Date.now() + clockOffsetMs;
      const difference = targetMs - now;

      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onExpire) {
          onExpire();
        }
        return false;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: difference });
      return true;
    };

    calculateTime();
    const interval = setInterval(() => {
      const active = calculateTime();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetMs, clockOffsetMs, onExpire]);

  if (!expiresAt || !targetMs) {
    return null;
  }

  // Hydration safety: render placeholder structure until mounted on client
  if (!mounted) {
    return (
      <div className={`rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 ${variant === 'compact' ? 'py-2 px-3' : ''}`}>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-600">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>{title}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <div className="h-10 w-12 rounded-xl bg-rose-500/10 animate-pulse" />
          <span className="text-rose-400 font-bold">:</span>
          <div className="h-10 w-12 rounded-xl bg-rose-500/10 animate-pulse" />
          <span className="text-rose-400 font-bold">:</span>
          <div className="h-10 w-12 rounded-xl bg-rose-500/10 animate-pulse" />
          <span className="text-rose-400 font-bold">:</span>
          <div className="h-10 w-12 rounded-xl bg-rose-500/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (timeRemaining.total <= 0) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center text-xs font-bold text-rose-600 dark:text-rose-400">
        ⌛ Offer Expired
      </div>
    );
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
        <Flame className="h-3.5 w-3.5 animate-pulse text-amber-300" />
        <span>Ends in:</span>
        <span className="tabular-nums font-mono">
          {timeRemaining.days > 0 && `${timeRemaining.days}d `}
          {formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-rose-500/5 p-4 sm:p-5 shadow-sm backdrop-blur-sm ${
        variant === 'banner' ? 'max-w-xl mx-auto' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
          <Flame className="h-4 w-4 animate-bounce text-amber-500" />
          <span>{title}</span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-700 dark:text-rose-300">
          ⚡ Hurry Up
        </span>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3 text-center">
        {/* Days */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-background/80 py-2 sm:py-3 shadow-inner">
          <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-foreground">
            {formatNumber(timeRemaining.days)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Days
          </span>
        </div>

        {/* Hours */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-background/80 py-2 sm:py-3 shadow-inner">
          <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-foreground">
            {formatNumber(timeRemaining.hours)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Hours
          </span>
        </div>

        {/* Minutes */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-background/80 py-2 sm:py-3 shadow-inner">
          <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-foreground">
            {formatNumber(timeRemaining.minutes)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Mins
          </span>
        </div>

        {/* Seconds */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-rose-500/20 bg-background/80 py-2 sm:py-3 shadow-inner">
          <span className="font-mono text-xl sm:text-2xl font-black tabular-nums text-rose-600 dark:text-rose-400 animate-pulse">
            {formatNumber(timeRemaining.seconds)}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
}
