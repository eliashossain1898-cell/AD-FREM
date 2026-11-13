import React, { useMemo } from 'react';
import { createTikTokStyleCaptions, type Caption } from '@remotion/captions';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CATEGORY_FONT_MAP } from '../lib/fonts';
import type { AdCategory } from '../types/ad';

export interface SyncedCaptionsProps {
  captions: Caption[];
  category: AdCategory;
  accentColor?: string;
  combineTokensWithinMilliseconds?: number;
  bottomOffset?: number;
}

/**
 * Dynamic frame-accurate Bangla subtitles driven by generate_voice.py timestamps
 * and @remotion/captions createTikTokStyleCaptions().
 */
export const SyncedCaptions: React.FC<SyncedCaptionsProps> = ({
  captions,
  category,
  accentColor = '#F59E0B',
  combineTokensWithinMilliseconds = 1400,
  bottomOffset = 280,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = CATEGORY_FONT_MAP[category];

  const { pages } = useMemo(() => {
    if (!captions || captions.length === 0) {
      return { pages: [] };
    }
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds,
    });
  }, [captions, combineTokensWithinMilliseconds]);

  const currentTimeMs = (frame / fps) * 1000;

  const activePage = pages.find((page, index) => {
    const nextPage = pages[index + 1];
    const pageEndMs = nextPage
      ? Math.min(page.startMs + page.durationMs, nextPage.startMs)
      : page.startMs + page.durationMs + 250;
    return currentTimeMs >= page.startMs && currentTimeMs <= pageEndMs;
  });

  if (!activePage) {
    return null;
  }

  const localFrame = Math.max(0, Math.round(((currentTimeMs - activePage.startMs) / 1000) * fps));
  const pop = spring({
    frame: localFrame,
    fps,
    config: { damping: 18, stiffness: 220, mass: 0.6 },
  });
  const yShift = interpolate(pop, [0, 1], [14, 0]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomOffset,
        paddingLeft: 64,
        paddingRight: 64,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(9, 9, 11, 0.78)',
          border: '1.5px solid rgba(255, 255, 255, 0.16)',
          borderRadius: 24,
          padding: '22px 34px',
          maxWidth: 940,
          textAlign: 'center',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
          transform: `translateY(${yShift}px) scale(${0.96 + pop * 0.04})`,
          opacity: pop,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: fonts.captionsBangla,
            fontSize: 52,
            lineHeight: 1.38,
            fontWeight: 700,
            color: '#F4F4F5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'keep-all',
          }}
        >
          {activePage.tokens.map((token, idx) => {
            const isActive =
              currentTimeMs >= token.fromMs && currentTimeMs <= token.toMs;
            const isSpoken = currentTimeMs > token.toMs;
            return (
              <span
                key={`${token.fromMs}-${idx}`}
                style={{
                  color: isActive
                    ? accentColor
                    : isSpoken
                      ? '#FFFFFF'
                      : 'rgba(244, 244, 245, 0.62)',
                  textShadow: isActive
                    ? `0 0 24px ${accentColor}88`
                    : '0 2px 10px rgba(0, 0, 0, 0.85)',
                }}
              >
                {token.text}
              </span>
            );
          })}
        </p>
      </div>
    </AbsoluteFill>
  );
};
