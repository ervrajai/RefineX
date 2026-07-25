import React, { useEffect, useRef } from "react";

function hexToRgb(hex) {
  let cleanHex = hex.replace("#", "");

  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const hexInt = parseInt(cleanHex, 16);
  const red = (hexInt >> 16) & 255;
  const green = (hexInt >> 8) & 255;
  const blue = hexInt & 255;
  return [red, green, blue];
}

const Particles = ({
  className = "",
  quantity = 80,
  staticity = 30,
  ease = 30,
  size = 2.0,
  refresh = false,
  color = "#A855F7", // Bright solid purple for high visibility on dark mode
  vx = 0,
  vy = 0,
}) => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const context = useRef(null);
  const circles = useRef([]);
  const animationFrameId = useRef(null);
  const mouse = useRef({ x: -1000, y: -1000 });
  const canvasSize = useRef({ w: 0, h: 0 });
  const isMobileRef = useRef(false);

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }

    const handleMouseMove = (event) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.current.x = event.clientX - rect.left;
        mouse.current.y = event.clientY - rect.top;
      }
    };

    const handleMouseLeave = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    const handleTouchMove = (event) => {
      if (canvasRef.current && event.touches.length > 0) {
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.current.x = event.touches[0].clientX - rect.left;
        mouse.current.y = event.touches[0].clientY - rect.top;
      }
    };

    const handleTouchEnd = () => {
      mouse.current.x = -1000;
      mouse.current.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("resize", initCanvas);

    initCanvas();
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("resize", initCanvas);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [color, refresh]);

  const initCanvas = () => {
    resizeCanvas();
    drawParticles();
  };

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      circles.current.length = 0;
      const dpr = window.devicePixelRatio || 1;
      
      const width = canvasContainerRef.current.offsetWidth;
      const height = canvasContainerRef.current.offsetHeight;

      canvasSize.current.w = width;
      canvasSize.current.h = height;
      
      // Detect mobile screen width (< 768px)
      isMobileRef.current = width < 768;

      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;

      context.current.scale(dpr, dpr);
    }
  };

  const circleParams = () => {
    const x = Math.floor(Math.random() * canvasSize.current.w);
    const y = Math.floor(Math.random() * canvasSize.current.h);
    const pSize = Math.random() * 1.2 + (isMobileRef.current ? size * 0.8 : size);
    const dx = (Math.random() - 0.5) * 0.5;
    const dy = (Math.random() - 0.5) * 0.5;
    const magnetism = 0.1 + Math.random() * 3;

    return {
      x,
      y,
      translateX: 0,
      translateY: 0,
      size: pSize,
      dx,
      dy,
      magnetism,
    };
  };

  const rgb = hexToRgb(color);

  const drawCircle = (circle) => {
    if (context.current) {
      const { x, y, translateX, translateY, size } = circle;
      context.current.beginPath();
      context.current.arc(x + translateX, y + translateY, size, 0, 2 * Math.PI);
      
      // Solid bright color with high contrast for dark mode
      context.current.fillStyle = `rgb(${rgb.join(", ")})`;
      context.current.fill();
    }
  };

  const drawLines = () => {
    if (!context.current) return;
    
    // Tighter connection radius on mobile to avoid overcrowding
    const maxDistance = isMobileRef.current ? 80 : 130;
    const mouseConnectDistance = isMobileRef.current ? 90 : 140;

    for (let i = 0; i < circles.current.length; i++) {
      const c1 = circles.current[i];
      const p1x = c1.x + c1.translateX;
      const p1y = c1.y + c1.translateY;

      // Connect nodes to touch/mouse input
      if (mouse.current.x !== -1000 && mouse.current.y !== -1000) {
        const mdx = p1x - mouse.current.x;
        const mdy = p1y - mouse.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < mouseConnectDistance) {
          context.current.beginPath();
          context.current.moveTo(p1x, p1y);
          context.current.lineTo(mouse.current.x, mouse.current.y);
          context.current.strokeStyle = `rgba(${rgb.join(", ")}, 0.85)`;
          context.current.lineWidth = 1;
          context.current.stroke();
        }
      }

      // Connect particle to particle with a crisp solid line
      for (let j = i + 1; j < circles.current.length; j++) {
        const c2 = circles.current[j];
        const p2x = c2.x + c2.translateX;
        const p2y = c2.y + c2.translateY;

        const dx = p1x - p2x;
        const dy = p1y - p2y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          context.current.beginPath();
          context.current.moveTo(p1x, p1y);
          context.current.lineTo(p2x, p2y);
          context.current.strokeStyle = `rgba(${rgb.join(", ")}, 0.65)`;
          context.current.lineWidth = 1;
          context.current.stroke();
        }
      }
    }
  };

  const clearContext = () => {
    if (context.current) {
      context.current.clearRect(0, 0, canvasSize.current.w, canvasSize.current.h);
    }
  };

  const drawParticles = () => {
    clearContext();
    // Reduce node count on mobile (cap at max 25 nodes)
    const effectiveQuantity = isMobileRef.current
      ? Math.min(25, Math.floor(quantity * 0.35))
      : quantity;

    for (let i = 0; i < effectiveQuantity; i++) {
      const circle = circleParams();
      circles.current.push(circle);
      drawCircle(circle);
    }
  };

  const animate = () => {
    clearContext();

    circles.current.forEach((circle) => {
      // Movement
      circle.x += circle.dx + vx;
      circle.y += circle.dy + vy;

      // Interaction physics
      const mouseX = mouse.current.x;
      const mouseY = mouse.current.y;
      const triggerRadius = isMobileRef.current ? 80 : 140;

      if (mouseX !== -1000 && mouseY !== -1000) {
        const dx = mouseX - circle.x;
        const dy = mouseY - circle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < triggerRadius) {
          const targetX = (dx / (staticity / circle.magnetism)) * -1;
          const targetY = (dy / (staticity / circle.magnetism)) * -1;
          circle.translateX += (targetX - circle.translateX) / ease;
          circle.translateY += (targetY - circle.translateY) / ease;
        } else {
          circle.translateX += (0 - circle.translateX) / ease;
          circle.translateY += (0 - circle.translateY) / ease;
        }
      } else {
        circle.translateX += (0 - circle.translateX) / ease;
        circle.translateY += (0 - circle.translateY) / ease;
      }

      // Edge wrap logic
      if (circle.x < 0) circle.x = canvasSize.current.w;
      if (circle.x > canvasSize.current.w) circle.x = 0;
      if (circle.y < 0) circle.y = canvasSize.current.h;
      if (circle.y > canvasSize.current.h) circle.y = 0;

      drawCircle(circle);
    });

    drawLines();
    animationFrameId.current = window.requestAnimationFrame(animate);
  };

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      ref={canvasContainerRef}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export { Particles };