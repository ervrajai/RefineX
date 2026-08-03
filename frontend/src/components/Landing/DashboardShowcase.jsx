'use client';

import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import ZoomParallax from '@/components/ui/ZoomParallax';

export default function DashboardShowcase() {
  useEffect(() => {
    const lenis = new Lenis();

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy?.();
    };
  }, []);

  const images = [
    {
      src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Modern architecture building',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Urban cityscape at sunset',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Abstract geometric pattern',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Mountain landscape',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Minimalist design elements',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Ocean waves and beach',
    },
    {
      src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Forest trees and sunlight',
    },
  ];

  return (
    <section id="dashboard" className="min-h-screen w-full relative bg-white dark:bg-[#0F0F0F] text-black dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center pt-16 pb-8">
        <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
          Refine Your Data & Accelerate Your AI
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
          The intelligent workspace that bridges the gap between raw datasets and machine learning. Clean, analyze, and predict with zero friction.
        </p>
      </div>

      <ZoomParallax images={images} />

      <div className="h-[20vh] bg-white dark:bg-[#0F0F0F] transition-colors duration-300" />
    </section>
  );
}