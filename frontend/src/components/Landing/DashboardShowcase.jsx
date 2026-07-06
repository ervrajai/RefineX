import React, { Children, cloneElement, forwardRef, isValidElement, useEffect, useMemo, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

// 1. The Data for your 4 stages
const showcasePanels = [
  { id: 1, title: "Dashboard", text: "RefineX+Dashboard+Preview" },
  { id: 2, title: "Data Cleaning", text: "Data+Cleaning+Workspace" },
  { id: 3, title: "Model Training", text: "Model+Training+Environment" },
  { id: 4, title: "Visualization", text: "Interactive+Visualizations" }
];

// 2. The MacOS Card Wrapper
export const Card = forwardRef(({ customClass, children, ...rest }, ref) => (
  <div
    ref={ref}
    {...rest}
    className={`absolute top-1/2 left-1/2 w-[90%] md:w-[80%] max-w-4xl aspect-[16/9] rounded-xl border border-lightBorder/50 dark:border-brand/30 bg-[#ffffff]/50 dark:bg-[#000000]/50 backdrop-blur-sm p-1.5 md:p-2 shadow-2xl [transform-style:preserve-3d] [will-change:transform] [backface-visibility:hidden] ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
  >
    <div className="bg-white dark:bg-black rounded-lg w-full h-full flex flex-col border border-lightBorder dark:border-gray-800 overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(103,58,183,0.15)]">
      <div className="w-full h-6 md:h-8 bg-gray-50 dark:bg-black flex items-center px-3 md:px-4 gap-1.5 md:gap-2 border-b border-lightBorder dark:border-gray-800 z-10 shrink-0">
        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400"></div>
        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"></div>
        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400"></div>
      </div>
      <div className="w-full flex-1 relative bg-[#1e1e1e]">
        {children}
      </div>
    </div>
  </div>
));
Card.displayName = 'Card';

// 3. GSAP Logic Helpers
const makeSlot = (i, distX, distY, total) => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 2.5, // Pushed slightly further back for stronger 3D depth
  zIndex: total - i
});

const placeNow = (el, slot, skew) =>
  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true
  });

// 4. The CardSwap Animation Engine with Snappy Buttons
const CardSwap = ({
  cardDistance = 35,
  verticalDistance = 30,
  delay = 4500, 
  pauseOnHover = true,
  onCardClick,
  skewAmount = 0,
  children
}) => {
  // SPED UP CONFIG: Dropped from 0.8s to 0.5s for a much snappier, responsive feel
  const config = {
    ease: 'power3.inOut', // Changed to power3 for a snappier acceleration
    durDrop: 0.5,
    durMove: 0.5,
    durReturn: 0.5,
    promoteOverlap: 0.5,
    returnDelay: 0.1
  };

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo(() => childArr.map(() => React.createRef()), [childArr.length]);
  const order = useRef(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef(null);
  const intervalRef = useRef();
  const container = useRef(null);

  // SNAP FORWARD
  const swapNext = useCallback(() => {
    if (order.current.length < 2) return;
    
    // THE FIX: If an animation is playing, instantly finish it so we can start the next one immediately.
    if (tlRef.current && tlRef.current.isActive()) {
      tlRef.current.progress(1);
    }

    const [front, ...rest] = order.current;
    const elFront = refs[front].current;
    const tl = gsap.timeline();
    tlRef.current = tl;

    tl.to(elFront, { y: '+=300', opacity: 0, duration: config.durDrop, ease: config.ease });
    tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
    
    rest.forEach((idx, i) => {
      const el = refs[idx].current;
      const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);
      tl.set(el, { zIndex: slot.zIndex }, 'promote');
      tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, `promote+=${i * 0.08}`);
    });

    const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
    tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);
    tl.call(() => gsap.set(elFront, { zIndex: backSlot.zIndex }), undefined, 'return');
    tl.to(elFront, { x: backSlot.x, y: backSlot.y, z: backSlot.z, opacity: 1, duration: config.durReturn, ease: config.ease }, 'return');
    
    tl.call(() => { order.current = [...rest, front]; });
  }, [cardDistance, verticalDistance, config, refs]);

  // SNAP BACKWARD
  const swapPrev = useCallback(() => {
    if (order.current.length < 2) return;

    // THE FIX: Instantly finish playing animation if user double clicks
    if (tlRef.current && tlRef.current.isActive()) {
      tlRef.current.progress(1);
    }

    const last = order.current[order.current.length - 1];
    const rest = order.current.slice(0, -1);
    const elLast = refs[last].current;
    const tl = gsap.timeline();
    tlRef.current = tl;

    const frontSlot = makeSlot(0, cardDistance, verticalDistance, refs.length);
    
    rest.forEach((idx, i) => {
      const el = refs[idx].current;
      const slot = makeSlot(i + 1, cardDistance, verticalDistance, refs.length);
      tl.to(el, { x: slot.x, y: slot.y, z: slot.z, duration: config.durMove, ease: config.ease }, 0);
      tl.set(el, { zIndex: slot.zIndex }, 0);
    });

    gsap.set(elLast, { x: frontSlot.x, y: frontSlot.y + 300, z: frontSlot.z, opacity: 0, zIndex: frontSlot.zIndex });
    tl.to(elLast, { y: frontSlot.y, opacity: 1, duration: config.durReturn, ease: config.ease }, config.durMove * 0.2);
    
    tl.call(() => { order.current = [last, ...rest]; });
  }, [cardDistance, verticalDistance, config, refs]);

  // Auto-play and hover logic
  const startTimer = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(swapNext, delay);
  }, [delay, swapNext]);

  useEffect(() => {
    const total = refs.length;
    refs.forEach((r, i) => placeNow(r.current, makeSlot(i, cardDistance, verticalDistance, total), skewAmount));

    const timeout = setTimeout(startTimer, delay / 2);

    if (pauseOnHover) {
      const node = container.current;
      const pause = () => { tlRef.current?.pause(); clearInterval(intervalRef.current); };
      const resume = () => { tlRef.current?.play(); startTimer(); };
      
      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);
      return () => {
        clearTimeout(timeout);
        clearInterval(intervalRef.current);
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
      };
    }

    return () => { clearTimeout(timeout); clearInterval(intervalRef.current); };
  }, [cardDistance, verticalDistance, delay, pauseOnHover, skewAmount, refs, startTimer]);

  const handleNextClick = () => { swapNext(); startTimer(); };
  const handlePrevClick = () => { swapPrev(); startTimer(); };

  const rendered = childArr.map((child, i) =>
    isValidElement(child)
      ? cloneElement(child, {
          key: i,
          ref: refs[i],
          onClick: e => { child.props.onClick?.(e); onCardClick?.(i); }
        })
      : child
  );

  return (
    <div className="relative w-full h-[50vh] min-h-[400px] md:h-[70vh] md:min-h-[600px] max-w-7xl mx-auto flex items-center justify-center group">
      
      {/* Left Navigation Button */}
      <button 
        onClick={handlePrevClick}
        className="absolute left-0 z-50 p-3 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-lightBorder/50 dark:border-white/10 text-gray-800 dark:text-gray-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-[#673ab7] hover:text-white dark:hover:bg-[#673ab7] active:scale-90"
      >
        <FiChevronLeft className="w-6 h-6" />
      </button>

      <div ref={container} className="relative w-full h-full perspective-[1200px] overflow-visible">
        {rendered}
      </div>

      {/* Right Navigation Button */}
      <button 
        onClick={handleNextClick}
        className="absolute right-0 z-50 p-3 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-md border border-lightBorder/50 dark:border-white/10 text-gray-800 dark:text-gray-200 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:bg-[#673ab7] hover:text-white dark:hover:bg-[#673ab7] active:scale-90"
      >
        <FiChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
};

// 5. The Main Export Component
export default function DashboardShowcase() {
  return (
    <section id="workflow" className="py-20 md:py-28 bg-white dark:bg-black w-full overflow-hidden">
      <div id="dashboard" className="w-full max-w-7xl mx-auto z-20 relative px-6 md:px-16">
        
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white mb-4 tracking-tight">
            The Complete Data Lifecycle
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Hover to pause, or use the arrows to explore the interface.
          </p>
        </div>

        <CardSwap>
          {showcasePanels.map((panel) => (
            <Card key={panel.id}>
              <img
                src={`https://placehold.co/1200x675/1e1e1e/673ab7?text=${panel.text}`}
                alt={panel.title}
                className="w-full h-full object-cover"
              />
            </Card>
          ))}
        </CardSwap>

      </div>
    </section>
  );
}