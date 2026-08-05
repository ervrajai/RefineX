'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';

// Helper hook to track dark mode class on documentElement
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Helper function to resolve image URL based on Theme (Light/Dark) and Viewport (Desktop/Mobile)
const resolveImageSrc = (imgObj, isMobile, isDark) => {
  if (!imgObj) return '/placeholder.svg';

  if (isDark) {
    if (isMobile && imgObj.mobileDarkSrc) return imgObj.mobileDarkSrc;
    if (imgObj.desktopDarkSrc) return imgObj.desktopDarkSrc;
    if (imgObj.darkSrc) return imgObj.darkSrc;
  } else {
    if (isMobile && imgObj.mobileLightSrc) return imgObj.mobileLightSrc;
    if (imgObj.desktopLightSrc) return imgObj.desktopLightSrc;
    if (imgObj.lightSrc) return imgObj.lightSrc;
  }

  // Generic Fallbacks
  if (isMobile && imgObj.mobileSrc) return imgObj.mobileSrc;
  if (imgObj.desktopSrc) return imgObj.desktopSrc;
  return imgObj.src || '/placeholder.svg';
};

export function ZoomParallax({ images = [], features = [] }) {
  const container = useRef(null);
  const isDark = useDarkMode();

  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end'],
  });

  // Default 7 Parallax Grid Images
  const defaultImages = [
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Main Dashboard Showcase',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Urban Cityscape',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Abstract Geometric Pattern',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Mountain Landscape',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=800&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Minimalist Elements',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Ocean Waves',
    },
    {
      desktopLightSrc: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&h=720&fit=crop&crop=entropy&auto=format&q=80',
      alt: 'Forest Sunlight',
    },
  ];

  // Default Phase 2 (70/30) Feature Cards
  const defaultFeatures = [
    {
      title: 'Automated Data Cleaning',
      desc: 'Instant detection and resolution of missing values, duplicate records, outliers, and type mismatches with zero code required.',
      desktopLightSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1280&h=720&fit=crop&q=80',
      alt: 'Data Cleaning Feature',
    },
    {
      title: 'Interactive Data Visualizations',
      desc: 'Generate interactive line charts, bar graphs, scatter plots, and pie distributions dynamically from your processed datasets.',
      desktopLightSrc: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1280&h=720&fit=crop&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1280&h=720&fit=crop&q=80',
      alt: 'Visualizations Feature',
    },
    {
      title: 'One-Click Machine Learning',
      desc: 'Train Regression and Random Forest models directly on your cleaned datasets and export production-ready model weights.',
      desktopLightSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&h=720&fit=crop&q=80',
      desktopDarkSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1280&h=720&fit=crop&q=80',
      alt: 'ML Training Feature',
    },
  ];

  const displayImages = images.length > 0 ? images : defaultImages;
  const displayFeatures = features.length > 0 ? features : defaultFeatures;

  // --- PHASE 1: ZOOM & PAUSE TRANSFORMS (0 -> 0.25 ZOOM, 0.25 -> 1.0 PAUSE) ---
  const scale4 = useTransform(scrollYProgress, [0, 0.25, 1], [1, 4, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 0.25, 1], [1, 5, 8]);
  const scale6 = useTransform(scrollYProgress, [0, 0.25, 1], [1, 6, 9]);
  const scale8 = useTransform(scrollYProgress, [0, 0.25, 1], [1, 8, 12]);
  const scale9 = useTransform(scrollYProgress, [0, 0.25, 1], [1, 9, 14]);

  const scales = [scale4, scale5, scale6, scale5, scale6, scale8, scale9];

  // Helper for satellite image styling offsets
  const getOffsetClass = (index) => {
    switch (index) {
      case 1:
        return '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]';
      case 2:
        return '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]';
      case 3:
        return '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]';
      case 4:
        return '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]';
      case 5:
        return '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]';
      case 6:
        return '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]';
      default:
        return '';
    }
  };

  // --- PHASE 2: 70/30 FEATURE SHOWCASE TRANSFORMS (PROGRESS 0.25 -> 1.0) ---
  const dimOverlayOpacity = useTransform(scrollYProgress, [0, 0.22, 0.26, 1], [0, 0, 1, 1]);

  const f1X = useTransform(scrollYProgress, [0, 0.25, 0.40, 0.45, 0.50], ['100vw', '100vw', '0vw', '0vw', '-100vw']);
  const f1Y = useTransform(scrollYProgress, [0, 0.25, 0.40, 0.45, 0.50], ['0px', '0px', '0px', '0px', '-40px']);
  const f1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.32, 0.45, 0.50], [0, 0, 1, 1, 0]);

  const f2X = useTransform(scrollYProgress, [0, 0.50, 0.65, 0.70, 0.75], ['-100vw', '-100vw', '0vw', '0vw', '100vw']);
  const f2Y = useTransform(scrollYProgress, [0, 0.50, 0.65, 0.70, 0.75], ['0px', '0px', '0px', '0px', '-40px']);
  const f2Opacity = useTransform(scrollYProgress, [0, 0.50, 0.57, 0.70, 0.75], [0, 0, 1, 1, 0]);

  const f3X = useTransform(scrollYProgress, [0, 0.75, 0.90, 1.0], ['100vw', '100vw', '0vw', '0vw']);
  const f3Opacity = useTransform(scrollYProgress, [0, 0.75, 0.82, 1.0], [0, 0, 1, 1]);

  return (
    <div ref={container} className="relative h-[500vh] bg-white dark:bg-[#0F0F0F] transition-colors duration-300">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* PARALLAX GRID: ALL 7 IMAGES (PHASE 1) */}
        {displayImages.map((imgObj, index) => {
          const scale = scales[index % scales.length];
          const offsetClass = getOffsetClass(index);
          const desktopImage = resolveImageSrc(imgObj, false, isDark);
          const mobileImage = resolveImageSrc(imgObj, true, isDark);

          return (
            <motion.div
              key={index}
              style={{ scale }}
              className={`absolute top-0 flex h-full w-full items-center justify-center pointer-events-none ${offsetClass}`}
            >
              <div className="relative h-[25vh] w-[25vw] rounded-2xl overflow-hidden shadow-xl dark:shadow-2xl bg-white dark:bg-[#212121] border border-slate-200/80 dark:border-zinc-800/80 transition-colors duration-300">
                <picture className="h-full w-full block">
                  <source media="(max-width: 768px)" srcSet={mobileImage} />
                  <img
                    src={desktopImage}
                    alt={imgObj.alt || `Parallax image ${index + 1}`}
                    className="h-full w-full object-cover object-top"
                  />
                </picture>
              </div>
            </motion.div>
          );
        })}

        {/* PHASE 2: BACKGROUND DIMMING OVERLAY */}
        <motion.div
          style={{ opacity: dimOverlayOpacity }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none z-10"
        />

        {/* PHASE 2: 70/30 FEATURE SHOWCASE CARDS */}
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 z-20 pointer-events-none">
          
          {/* FEATURE 1: Left 30% Text, Right 70% Image */}
          {displayFeatures[0] && (
            <motion.div
              style={{ x: f1X, y: f1Y, opacity: f1Opacity }}
              className="absolute pointer-events-auto w-[90vw] max-w-6xl bg-[#141418]/90 border border-zinc-800/80 shadow-2xl rounded-2xl p-6 md:p-8 backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Left 30% Text */}
                <div className="w-full md:w-[30%] flex flex-col justify-center text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                    Feature 01
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                    {displayFeatures[0].title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {displayFeatures[0].desc}
                  </p>
                </div>

                {/* Right 70% Image (Theme + Viewport Responsive) */}
                <div className="w-full md:w-[70%] h-64 md:h-[400px] relative rounded-xl overflow-hidden border border-zinc-800/60 shadow-lg">
                  <picture className="h-full w-full block">
                    <source media="(max-width: 768px)" srcSet={resolveImageSrc(displayFeatures[0], true, isDark)} />
                    <img
                      src={resolveImageSrc(displayFeatures[0], false, isDark)}
                      alt={displayFeatures[0].alt || 'Feature 1'}
                      className="w-full h-full object-cover object-top"
                    />
                  </picture>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEATURE 2: Right 30% Text, Left 70% Image */}
          {displayFeatures[1] && (
            <motion.div
              style={{ x: f2X, y: f2Y, opacity: f2Opacity }}
              className="absolute pointer-events-auto w-[90vw] max-w-6xl bg-[#141418]/90 border border-zinc-800/80 shadow-2xl rounded-2xl p-6 md:p-8 backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row-reverse items-center gap-6 md:gap-8">
                {/* Right 30% Text */}
                <div className="w-full md:w-[30%] flex flex-col justify-center text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                    Feature 02
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                    {displayFeatures[1].title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {displayFeatures[1].desc}
                  </p>
                </div>

                {/* Left 70% Image (Theme + Viewport Responsive) */}
                <div className="w-full md:w-[70%] h-64 md:h-[400px] relative rounded-xl overflow-hidden border border-zinc-800/60 shadow-lg">
                  <picture className="h-full w-full block">
                    <source media="(max-width: 768px)" srcSet={resolveImageSrc(displayFeatures[1], true, isDark)} />
                    <img
                      src={resolveImageSrc(displayFeatures[1], false, isDark)}
                      alt={displayFeatures[1].alt || 'Feature 2'}
                      className="w-full h-full object-cover object-top"
                    />
                  </picture>
                </div>
              </div>
            </motion.div>
          )}

          {/* FEATURE 3: Left 30% Text, Right 70% Image */}
          {displayFeatures[2] && (
            <motion.div
              style={{ x: f3X, opacity: f3Opacity }}
              className="absolute pointer-events-auto w-[90vw] max-w-6xl bg-[#141418]/90 border border-zinc-800/80 shadow-2xl rounded-2xl p-6 md:p-8 backdrop-blur-xl"
            >
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Left 30% Text */}
                <div className="w-full md:w-[30%] flex flex-col justify-center text-left">
                  <span className="text-xs font-bold uppercase tracking-wider text-violet-400 mb-2">
                    Feature 03
                  </span>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                    {displayFeatures[2].title}
                  </h3>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {displayFeatures[2].desc}
                  </p>
                </div>

                {/* Right 70% Image (Theme + Viewport Responsive) */}
                <div className="w-full md:w-[70%] h-64 md:h-[400px] relative rounded-xl overflow-hidden border border-zinc-800/60 shadow-lg">
                  <picture className="h-full w-full block">
                    <source media="(max-width: 768px)" srcSet={resolveImageSrc(displayFeatures[2], true, isDark)} />
                    <img
                      src={resolveImageSrc(displayFeatures[2], false, isDark)}
                      alt={displayFeatures[2].alt || 'Feature 3'}
                      className="w-full h-full object-cover object-top"
                    />
                  </picture>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ZoomParallax;
