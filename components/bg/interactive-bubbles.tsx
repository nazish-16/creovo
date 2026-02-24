"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface Bubble {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  color: string;
  originalSize: number;
  targetSize: number;
}

const InteractiveBubbles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const bubblesRef = useRef<Bubble[]>([]);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const bubbleCount = 25;
    
    const colors = theme === "dark" 
      ? ["rgba(59, 130, 246, 0.22)"] 
      : ["rgba(37, 99, 235, 0.12)"];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (bubblesRef.current.length === 0) {
        for (let i = 0; i < bubbleCount; i++) {
          const size = Math.random() * 80 + 40;
          bubblesRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: size,
            originalSize: size,
            targetSize: size,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
    };

    const animate = (time: number) => {
      // Calculate delta time for consistent speed on all refresh rates (e.g. 144Hz)
      const deltaTime = lastTime ? (time - lastTime) / 16.67 : 1;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble) => {
        // Apply velocity with delta time correction
        bubble.x += bubble.vx * deltaTime;
        bubble.y += bubble.vy * deltaTime;

        // Wrap around bounds
        if (bubble.x < -bubble.size) bubble.x = canvas.width + bubble.size;
        if (bubble.x > canvas.width + bubble.size) bubble.x = -bubble.size;
        if (bubble.y < -bubble.size) bubble.y = canvas.height + bubble.size;
        if (bubble.y > canvas.height + bubble.size) bubble.y = -bubble.size;

        // Mouse interaction
        const dx = mouseRef.current.x - bubble.x;
        const dy = mouseRef.current.y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 300) {
          bubble.targetSize = bubble.originalSize * 1.6;
          // Subtle drift towards cursor
          bubble.x += (dx * 0.002) * deltaTime;
          bubble.y += (dy * 0.002) * deltaTime;
        } else {
          bubble.targetSize = bubble.originalSize;
        }

        // Smooth size transition
        bubble.size += (bubble.targetSize - bubble.size) * 0.05 * deltaTime;

        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, Math.max(0.1, bubble.size), 0, Math.PI * 2);
        ctx.fillStyle = bubble.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = bubble.color;
        ctx.fill();
        ctx.closePath();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    init();
    animationFrameId = requestAnimationFrame(animate);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-70"
      style={{ 
        filter: "blur(70px)",
        transform: "scale(1.15)",
      }}
    />
  );
};

export default InteractiveBubbles;
