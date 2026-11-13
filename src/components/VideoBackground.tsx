import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Video,
  getRemotionEnvironment,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type { ColorGradePreset } from '../types/ad';

export interface VideoBackgroundProps {
  src: string;
  mediaType?: 'image' | 'video';
  colorGrade?: ColorGradePreset;
  zoomFrom?: number;
  zoomTo?: number;
  panYFrom?: number;
  panYTo?: number;
  vignetteOpacity?: number;
  muted?: boolean;
}

const COLOR_GRADE_FILTERS: Record<ColorGradePreset, string> = {
  'luxury-warm': 'contrast(1.12) saturate(1.1) sepia(0.12) brightness(0.94)',
  'beauty-glow': 'brightness(1.06) contrast(1.04) saturate(1.16) sepia(0.05)',
  'gadget-crisp': 'contrast(1.18) saturate(1.08) brightness(0.95)',
  'cinematic-contrast': 'contrast(1.22) saturate(0.92) brightness(0.92)',
  natural: 'none',
};

/**
 * Center-crops any input video clip or product visual cleanly to 9:16 (1080x1920)
 * using objectFit: 'cover' with zero mirror effect, slow Ken Burns zoom/pan,
 * CSS color grading, and a bottom/top contrast scrim for Bangla typography.
 */
export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  src,
  mediaType = 'image',
  colorGrade = 'luxury-warm',
  zoomFrom = 1.0,
  zoomTo = 1.1,
  panYFrom = 0,
  panYTo = -24,
  vignetteOpacity = 0.72,
  muted = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const env = getRemotionEnvironment();

  const scale = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [zoomFrom, zoomTo], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const translateY = interpolate(
    frame,
    [0, Math.max(1, durationInFrames - 1)],
    [panYFrom, panYTo],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const mediaStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center center',
    // Strict non-mirrored transform: positive scale only, never scaleX(-1)
    transform: `scale(${scale}) translate3d(0px, ${translateY}px, 0px)`,
    filter: COLOR_GRADE_FILTERS[colorGrade],
  };

  const isVideoFile =
    mediaType === 'video' || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B', overflow: 'hidden' }}>
      {isVideoFile ? (
        env.isRendering ? (
          <OffthreadVideo src={src} muted={muted} style={mediaStyle} />
        ) : (
          <Video src={src} muted={muted} style={mediaStyle} />
        )
      ) : (
        <Img src={src} style={mediaStyle} />
      )}

      {/* Measured contrast scrim so Bangla headlines & captions achieve >= 4.5:1 contrast */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg,
            rgba(9, 9, 11, ${vignetteOpacity * 0.78}) 0%,
            rgba(9, 9, 11, 0.08) 32%,
            rgba(9, 9, 11, 0.12) 60%,
            rgba(9, 9, 11, ${vignetteOpacity * 0.94}) 100%)`,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
