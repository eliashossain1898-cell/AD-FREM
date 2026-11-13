import React from 'react';
import { ding, vineBoom, whip, whoosh } from '@remotion/sfx';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CATEGORY_FONT_MAP } from '../lib/fonts';
import type { AdCategory, HookSfxPreset } from '../types/ad';

export interface HookBannerProps {
  headline: string;
  subline?: string;
  category: AdCategory;
  accentColor?: string;
  sfxPreset?: HookSfxPreset;
  playSfx?: boolean;
}

const SFX_MAP: Record<HookSfxPreset, string> = {
  whoosh,
  whip,
  ding,
  vineBoom,
};

/**
 * 3-second (90 frames @ 30fps) scroll-stopping animated Bangla headline
 * with crisp high-contrast stroke, drop-shadow, spring entrance, and @remotion/sfx.
 */
export const HookBanner: React.FC<HookBannerProps> = ({
  headline,
  subline,
  category,
  accentColor = '#F59E0B',
  sfxPreset = 'whoosh',
  playSfx = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = CATEGORY_FONT_MAP[category];

  // 3-second hook window: entrance 0..15f, hold, smooth exit 74..90f
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 180, mass: 0.8 },
  });

  const exitOpacity = interpolate(frame, [74, 88], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const translateY = interpolate(enterProgress, [0, 1], [-56, 0]);
  const scale = interpolate(enterProgress, [0, 1], [0.88, 1]);
  const barWidth = interpolate(frame, [6, 26], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const sfxSrc = SFX_MAP[sfxPreset] ?? whoosh;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 180,
        paddingLeft: 72,
        paddingRight: 72,
        pointerEvents: 'none',
      }}
    >
      {playSfx && <Audio src={sfxSrc} volume={0.55} />}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          opacity: enterProgress * exitOpacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          maxWidth: 940,
        }}
      >
        {subline ? (
          <div
            style={{
              fontFamily: fonts.englishDisplay,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: accentColor,
              marginBottom: 20,
              textShadow: '0 4px 18px rgba(0,0,0,0.85)',
            }}
          >
            {subline}
          </div>
        ) : null}

        <h1
          style={{
            fontFamily: fonts.headlineBangla,
            fontSize: 82,
            lineHeight: 1.18,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            WebkitTextStroke: '3px rgba(9, 9, 11, 0.92)',
            paintOrder: 'stroke fill',
            textShadow:
              '0 10px 32px rgba(0, 0, 0, 0.85), 0 3px 0 rgba(9, 9, 11, 0.95)',
          }}
        >
          {headline}
        </h1>

        <div
          style={{
            marginTop: 28,
            height: 6,
            width: `${barWidth * 2.4}px`,
            borderRadius: 999,
            backgroundColor: accentColor,
            boxShadow: `0 0 24px ${accentColor}`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
