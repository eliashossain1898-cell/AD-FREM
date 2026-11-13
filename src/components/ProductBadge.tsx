import React from 'react';
import { Sparkles, Tag, Zap } from 'lucide-react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CATEGORY_FONT_MAP } from '../lib/fonts';
import type { AdCategory } from '../types/ad';

export interface ProductBadgeProps {
  productTitle: string;
  originalPrice: string;
  offerPrice: string;
  discountLabel: string;
  category: AdCategory;
  accentColor?: string;
}

/**
 * Animated pricing & discount badge overlay with category marketing icon,
 * strike-through regular price, and high-contrast offer price.
 */
export const ProductBadge: React.FC<ProductBadgeProps> = ({
  productTitle,
  originalPrice,
  offerPrice,
  discountLabel,
  category,
  accentColor = '#F59E0B',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = CATEGORY_FONT_MAP[category];

  const pop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 170, mass: 0.75 },
  });

  const translateX = interpolate(pop, [0, 1], [-80, 0]);
  const CategoryIcon =
    category === 'luxury' ? Sparkles : category === 'beauty' ? Tag : Zap;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingTop: 140,
        paddingLeft: 56,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          backgroundColor: 'rgba(9, 9, 11, 0.84)',
          border: `2px solid ${accentColor}`,
          borderRadius: 24,
          padding: '22px 30px',
          boxShadow: '0 24px 56px rgba(0, 0, 0, 0.7)',
          opacity: pop,
          transform: `translateX(${translateX}px) scale(${0.92 + pop * 0.08})`,
          maxWidth: 560,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <CategoryIcon size={28} color={accentColor} strokeWidth={2.5} />
          <span
            style={{
              fontFamily: fonts.englishDisplay,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: accentColor,
            }}
          >
            {discountLabel}
          </span>
        </div>

        <div
          style={{
            fontFamily: fonts.captionsBangla,
            fontSize: 34,
            fontWeight: 700,
            color: '#F4F4F5',
            lineHeight: 1.25,
          }}
        >
          {productTitle}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 20,
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontFamily: fonts.priceDisplay,
              fontSize: 64,
              fontWeight: 800,
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}
          >
            {offerPrice}
          </span>
          {originalPrice ? (
            <span
              style={{
                fontFamily: fonts.priceDisplay,
                fontSize: 34,
                fontWeight: 600,
                color: '#A1A1AA',
                textDecoration: 'line-through',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {originalPrice}
            </span>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};
