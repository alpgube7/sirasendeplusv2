import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
  barCount?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = '#818cf8',
  barCount = 36,
  className = 'h-12 w-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          // Dynamic pseudo frequency calculation
          const v1 = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const v2 = Math.cos(phase * 1.5 + i * 0.2) * 0.5 + 0.5;
          const v3 = Math.sin(phase * 0.8 + i * 0.5) * 0.5 + 0.5;
          const factor = (v1 * 0.5 + v2 * 0.3 + v3 * 0.2);
          barHeight = 4 + factor * (height - 8);
        } else {
          barHeight = 4 + Math.sin(phase * 0.5 + i * 0.2) * 2;
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, color);
        grad.addColorStop(1, '#c084fc');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }

      phase += isPlaying ? 0.08 : 0.02;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isPlaying, color, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={48}
      className={`${className} rounded-md`}
    />
  );
};
