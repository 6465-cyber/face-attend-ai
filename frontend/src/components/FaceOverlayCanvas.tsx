import React, { useEffect, useRef } from 'react';
import { RecognitionResult } from '../types';

interface FaceOverlayCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  result: RecognitionResult | null;
  isScanning: boolean;
}

export const FaceOverlayCanvas: React.FC<FaceOverlayCanvasProps> = ({
  videoRef,
  result,
  isScanning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawings
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    canvas.width = vw;
    canvas.height = vh;

    // If a face box is detected
    if (result?.box && result.box.length === 4) {
      const [x, y, w, h] = result.box;
      const isMatch = result.match_found;
      const primaryColor = isMatch ? '#10b981' : '#f59e0b'; // Emerald for match, Amber for unregistered/search

      // Draw bounding box
      ctx.lineWidth = 3;
      ctx.strokeStyle = primaryColor;
      ctx.shadowColor = primaryColor;
      ctx.shadowBlur = 12;

      // Draw futuristic corner brackets
      const cornerLen = Math.min(25, w * 0.25);
      
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLen);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLen, y);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLen);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLen, y + h);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLen, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLen);
      ctx.stroke();

      // Subtle fill
      ctx.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)';
      ctx.fillRect(x, y, w, h);

      // Student name banner / tag
      const labelText = isMatch && result.student
        ? `${result.student.full_name} (${result.confidence_percentage})`
        : 'Face Detected (Scanning...)';

      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const bannerHeight = 26;
      const bannerY = Math.max(0, y - bannerHeight - 6);

      ctx.shadowBlur = 0;
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.roundRect(x, bannerY, textWidth + 16, bannerHeight, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x + 8, bannerY + 18);
    }
  }, [videoRef, result]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
      />
      {/* Laser Scanning Animation Bar */}
      {isScanning && (
        <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-scan pointer-events-none" />
      )}
    </div>
  );
};
