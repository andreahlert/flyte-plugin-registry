"use client";

import React, { startTransition, useEffect, useRef, useState } from "react";

interface Icon {
  x: number;
  y: number;
  z: number;
  scale: number;
  opacity: number;
  id: number;
}

interface IconCloudProps {
  images: string[];
  size?: number;
  autoRotate?: boolean;
}

export function IconCloud({ images, size = 400, autoRotate = false }: IconCloudProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iconPositions, setIconPositions] = useState<Icon[]>([]);
  const mousePosRef = useRef({ x: size / 2, y: size / 2 });
  const isHoveringRef = useRef(false);
  const animationFrameRef = useRef<number>(0);
  const rotationRef = useRef({ x: 0, y: 0 });
  const iconCanvasesRef = useRef<HTMLCanvasElement[]>([]);
  const imagesLoadedRef = useRef<boolean[]>([]);

  useEffect(() => {
    if (!images.length) return;
    imagesLoadedRef.current = new Array(images.length).fill(false);
    const newIconCanvases = images.map((src, index) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 48;
      offscreen.height = 48;
      const offCtx = offscreen.getContext("2d");
      if (offCtx) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => {
          offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
          offCtx.beginPath();
          offCtx.arc(24, 24, 22, 0, Math.PI * 2);
          offCtx.closePath();
          offCtx.clip();
          offCtx.fillStyle = "white";
          offCtx.fill();
          offCtx.drawImage(img, 4, 4, 40, 40);
          imagesLoadedRef.current[index] = true;
        };
      }
      return offscreen;
    });
    iconCanvasesRef.current = newIconCanvases;
  }, [images]);

  useEffect(() => {
    const numIcons = images.length || 20;
    const newIcons: Icon[] = [];
    const offset = 2 / numIcons;
    const increment = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;
      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;
      newIcons.push({
        x: x * (size * 0.28),
        y: y * (size * 0.28),
        z: z * (size * 0.28),
        scale: 1,
        opacity: 1,
        id: i,
      });
    }
    startTransition(() => setIconPositions(newIcons));
  }, [images, size]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  };

  const handleMouseEnter = () => { isHoveringRef.current = true; };
  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    mousePosRef.current = { x: size / 2, y: size / 2 };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      if (autoRotate && !isHoveringRef.current) {
        rotationRef.current = {
          x: rotationRef.current.x + 0.002,
          y: rotationRef.current.y + 0.004,
        };
      } else {
        const dx = mousePosRef.current.x - centerX;
        const dy = mousePosRef.current.y - centerY;
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 0.002 + (distance / maxDistance) * 0.006;
        rotationRef.current = {
          x: rotationRef.current.x + (dy / canvas.height) * speed,
          y: rotationRef.current.y + (dx / canvas.width) * speed,
        };
      }

      const sorted = [...iconPositions].map((icon) => {
        const cosX = Math.cos(rotationRef.current.x);
        const sinX = Math.sin(rotationRef.current.x);
        const cosY = Math.cos(rotationRef.current.y);
        const sinY = Math.sin(rotationRef.current.y);
        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;
        const finalZ = icon.y * (-sinX) + rotatedZ * cosX;
        return { ...icon, screenX: centerX + rotatedX, screenY: centerY + rotatedY, depth: finalZ };
      });

      sorted.sort((a, b) => a.depth - b.depth);

      sorted.forEach((icon) => {
        const scale = (icon.depth + 200) / 300;
        const opacity = Math.max(0.15, Math.min(1, (icon.depth + 150) / 200));
        ctx.save();
        ctx.translate(icon.screenX, icon.screenY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;
        if (iconCanvasesRef.current[icon.id] && imagesLoadedRef.current[icon.id]) {
          ctx.drawImage(iconCanvasesRef.current[icon.id], -24, -24, 48, 48);
        }
        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [iconPositions, autoRotate, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="rounded-lg cursor-grab active:cursor-grabbing"
      style={{ width: size, height: size, maxWidth: "100%" }}
      aria-label="Interactive 3D Icon Cloud"
      role="img"
    />
  );
}
