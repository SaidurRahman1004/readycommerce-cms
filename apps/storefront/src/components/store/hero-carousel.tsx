'use client';

import React, {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import {useTranslations} from 'next-intl';

const heroSlides = [
  {
    id: 'slide-1',
    image: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=1500&q=90',
    caption: 'hero.caption', // Translation key
    alt: 'hero.imageAlt'
  },
  {
    id: 'slide-2',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1500&q=90',
    caption: 'hero.caption',
    alt: 'hero.imageAlt'
  },
  {
    id: 'slide-3',
    image: 'https://images.unsplash.com/photo-1615397323238-709403b22e17?auto=format&fit=crop&w=1500&q=90',
    caption: 'hero.caption',
    alt: 'hero.imageAlt'
  }
];

export default function HeroCarousel() {
  const t = useTranslations('Storefront');
  const [slides, setSlides] = useState(heroSlides);
  useEffect(() => { const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; fetch(`${api}/cms/homepage`).then((response) => response.ok ? response.json() : null).then((body) => { const remote = body?.data?.slides?.filter((slide: { image?: string; isActive?: boolean }) => slide.image && slide.isActive !== false); if (remote?.length) setSlides(remote.map((slide: { image: string; title?: string }, index: number) => ({ id: `cms-${index}`, image: slide.image, caption: slide.title || 'hero.caption', alt: 'hero.imageAlt' }))); }).catch(() => undefined); }, []);
  
  // Initialize Embla with loop and autoplay
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);
  
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const initialSync = window.setTimeout(onSelect, 0);
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => { window.clearTimeout(initialSync); emblaApi.off('select', onSelect); emblaApi.off('reInit', onSelect); };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  return (
    <div className="relative h-full w-full bg-muted overflow-hidden group">
      {/* Viewport */}
      <div className="overflow-hidden h-full w-full rounded-[2.5rem]" ref={emblaRef}>
        {/* Container */}
        <div className="flex h-full w-full touch-pan-y">
          {/* Slides */}
          {slides.map((slide) => (
            <div key={slide.id} className="relative min-w-0 shrink-0 grow-0 basis-full h-full">
              <Image 
                src={slide.image} 
                alt={t(slide.alt)} 
                fill 
                priority 
                sizes="(max-width: 1023px) 100vw, 55vw" 
                className="object-cover object-center transition-transform duration-[6s] group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-white sm:bottom-8 sm:left-8 sm:right-8">
                <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                  {t(slide.caption) || slide.caption}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-white/10 text-xl backdrop-blur-md transition-colors hover:bg-white/20">
                  ↗
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Custom Dots Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => scrollTo(index)}
            className={`transition-all duration-300 rounded-full bg-white backdrop-blur-md ${
              index === selectedIndex ? 'w-8 h-2.5 bg-opacity-100 shadow-md' : 'w-2.5 h-2.5 bg-opacity-40 hover:bg-opacity-60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
