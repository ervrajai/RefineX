'use client';

import React, { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import ZoomParallax from '@/components/ui/ZoomParallax';

import centerLight from '@/assets/images/centerLight.png';
import centerLightMobile from '@/assets/images/centerLightMobile.png';
import centerDark from '@/assets/images/centerDark.png';
import centerDarkMobile from '@/assets/images/centerDarkMobile.png';
import topcenterLight from '@/assets/images/topcenterLight.png';
import topcenterDark from '@/assets/images/topcenterDark.png';
import topcenterLightMobile from '@/assets/images/topcenterLightMobile.png';
import topcenterDarkMobile from '@/assets/images/topcenterDarkMobile.png';
import midleftLight from '@/assets/images/midleftLight.png';
import midleftDark from '@/assets/images/midleftDark.png';
import midleftLightMobile from '@/assets/images/midleftLightMobile.png';
import midleftDarkMobile from '@/assets/images/midleftDarkMobile.png';
import midrightLight from '@/assets/images/midrightLight.png';
import midrightDark from '@/assets/images/midrightDark.png';
import midrightLightMobile from '@/assets/images/midrightLightMobile.png';
import midrightDarkMobile from '@/assets/images/midrightDarkMobile.png';
import bottomleftLight from '@/assets/images/bottomleftLight.png';
import bottomleftDark from '@/assets/images/bottomleftDark.png';
import bottomleftLightMobile from '@/assets/images/bottomleftLightMobile.png';
import bottomleftDarkMobile from '@/assets/images/bottomleftDarkMobile.png';
import bottomcenterLight from '@/assets/images/bottomcenterLight.png';
import bottomcenterDark from '@/assets/images/bottomcenterDark.png';
import bottomcenterLightMobile from '@/assets/images/bottomcenterLightMobile.png';
import bottomcenterDarkMobile from '@/assets/images/bottomcenterDarkMobile.png';
import bottomrightLight from '@/assets/images/bottomrightLight.png';
import bottomrightDark from '@/assets/images/bottomrightDark.png';
import bottomrightLightMobile from '@/assets/images/bottomrightLightMobile.png';
import bottomrightDarkMobile from '@/assets/images/bottomrightDarkMobile.png';
import feature1Light from '@/assets/images/feature1Light.png';
import feature1Dark from '@/assets/images/feature1Dark.png';
import feature2Light from '@/assets/images/feature2Light.png';
import feature2Dark from '@/assets/images/feature2Dark.png';
import feature3 from '@/assets/images/feature3.png';

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

  // =========================================================================
  // SHOWCASE PARALLAX GRID IMAGES (PHASE 1: 7 SPATIAL POSITIONS)
  // Supports separate image links for:
  //   - Desktop Light Mode (desktopLightSrc)
  //   - Mobile Light Mode  (mobileLightSrc)
  //   - Desktop Dark Mode  (desktopDarkSrc)
  //   - Mobile Dark Mode   (mobileDarkSrc)
  // =========================================================================
  const showcaseImages = [
    // -----------------------------------------------------------------------
    // [IMAGE 1 / 7]: CENTER MAIN HERO DASHBOARD IMAGE
    // Position: Center Stage (Initial focal point that zooms in on scroll)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: centerLight,
      mobileLightSrc: centerLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: centerDark,
      mobileDarkSrc: centerDarkMobile,

      alt: 'Center Main Hero Dashboard Showcase',
      label: 'Center Main Hero Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 2 / 7]: TOP CENTER SATELLITE IMAGE
    // Position: Top-Center Floating Card (-30vh top, 5vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: topcenterLight,
      mobileLightSrc: topcenterLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: topcenterDark,
      mobileDarkSrc: topcenterDarkMobile,

      alt: 'Top Right Floating Showcase Card',
      label: 'Top Right Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 3 / 7]: MIDDLE LEFT SATELLITE IMAGE
    // Position: Mid-Left Floating Card (-10vh top, -25vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: midleftLight,
      mobileLightSrc: midleftLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: midleftDark,
      mobileDarkSrc: midleftDarkMobile,

      alt: 'Middle Left Floating Showcase Card',
      label: 'Middle Left Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 4 / 7]: MIDDLE RIGHT SATELLITE IMAGE
    // Position: Mid-Right Floating Card (0vh top, 27.5vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: midrightLight,
      mobileLightSrc: midrightLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: midrightDark,
      mobileDarkSrc: midrightDarkMobile,

      alt: 'Middle Right Floating Showcase Card',
      label: 'Middle Right Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 5 / 7]: BOTTOM CENTER SATELLITE IMAGE
    // Position: Bottom-Center Floating Card (27.5vh top, 5vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: bottomcenterLight,
      mobileLightSrc: bottomcenterLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: bottomcenterDark,
      mobileDarkSrc: bottomcenterDarkMobile,

      alt: 'Bottom Right Floating Showcase Card',
      label: 'Bottom Right Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 6 / 7]: BOTTOM LEFT SATELLITE IMAGE
    // Position: Bottom-Left Floating Card (27.5vh top, -22.5vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: bottomleftLight,
      mobileLightSrc: bottomleftLightMobile, 

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: bottomleftDark,
      mobileDarkSrc: bottomleftDarkMobile,

      alt: 'Bottom Left Floating Showcase Card',
      label: 'Bottom Left Image',
    },

    // -----------------------------------------------------------------------
    // [IMAGE 7 / 7]:  BOTTOM RIGHT SATELLITE IMAGE
    // Position:  Bottom-Right Floating Card (22.5vh top, 25vw left)
    // -----------------------------------------------------------------------
    {
      // --- LIGHT MODE IMAGES ---
      desktopLightSrc: bottomrightLight,
      mobileLightSrc: bottomrightLightMobile,

      // --- DARK MODE IMAGES ---
      desktopDarkSrc: bottomrightDark,
      mobileDarkSrc: bottomrightDarkMobile,

      alt: 'Far Bottom Right Floating Showcase Card',
      label: 'Far Bottom Right Image',
    },
  ];

  // =========================================================================
  // SHOWCASE FEATURE CARDS IMAGES (PHASE 2: 70/30 SPLIT SHOWCASE CARDS)
  // Supports separate image links for Light Mode (lightSrc) and Dark Mode (darkSrc).
  // =========================================================================
  const showcaseFeatures = [
    // -----------------------------------------------------------------------
    // [FEATURE CARD 1]: AUTOMATED DATA CLEANING
    // Layout: Left 30% Text / Right 70% Screenshot
    // -----------------------------------------------------------------------
    {
      title: 'Automated Data Cleaning',
      desc: 'Instant detection and resolution of missing values, duplicate records, outliers, and type mismatches with zero code required.',
      
      lightSrc: feature1Light,
      darkSrc: feature1Dark,

      alt: 'Automated Data Cleaning Feature Showcase',
      label: 'Feature 01 Image (Data Cleaning)',
    },

    // -----------------------------------------------------------------------
    // [FEATURE CARD 2]: ONE-CLICK MACHINE LEARNING
    // Layout: Right 30% Text / Left 70% Screenshot
    // -----------------------------------------------------------------------
    {
      title: 'One-Click Machine Learning',
      desc: 'Train Regression and Random Forest models directly on your cleaned datasets and export production-ready model weights.',
      
      lightSrc: feature2Light,
      darkSrc: feature2Dark,

      alt: 'One-Click Machine Learning Feature Showcase',
      label: 'Feature 02 Image (ML Training)',
    },

    // -----------------------------------------------------------------------
    // [FEATURE CARD 3]: INTERACTIVE DATA VISUALIZATIONS
    // Layout: Left 30% Text / Right 70% Screenshot
    // -----------------------------------------------------------------------
    {
      title: 'Interactive Data Visualizations',
      desc: 'Generate interactive line charts, bar graphs, scatter plots, and pie distributions dynamically from your processed datasets.',
      
      lightSrc: feature3,
      darkSrc: feature3,

      alt: 'Interactive Data Visualizations Feature Showcase',
      label: 'Feature 03 Image (Visualizations)',
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

      {/* Render ZoomParallax with Theme & Responsive Image Configuration */}
      <ZoomParallax images={showcaseImages} features={showcaseFeatures} />

      <div className="h-[20vh] bg-white dark:bg-[#0F0F0F] transition-colors duration-300" />
    </section>
  );
}