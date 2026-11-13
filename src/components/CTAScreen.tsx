import React from 'react';
import { ding } from '@remotion/sfx';
import { PhoneCall, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CATEGORY_FONT_MAP } from '../lib/fonts';
import type { AdCategory } from '../types/ad';

export interface CTAScreenProps {
  brandName: string;
  productTitle: string;
  offerPrice: string;
  originalPrice?: string;
  ctaHeading: string;
  ctaSubtext: string;
  ctaButtonText: string;
  orderPhone: string;
  cutoutSrc: string;
  category: AdCategory;
  accentColor?: string;
  playSfx?: boolean;
}

/**
 * End-screen "ORDER NOW / ক্যাশ অন ডেলিভারি" conversion card with real
 * rembg transparent PNG product cutout overlay, trust icons, and pricing.
 */
export const CTAScreen: React.FC<CTAScreenProps> = ({
  brandName,
  productTitle,
  offerPrice,
  originalPrice,
  ctaHeading,
  ctaSubtext,
  ctaButtonText,
  orderPhone,
  cutoutSrc,
  category,
  accentColor = '#F59E0B',
  playSfx = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fonts = CATEGORY_FONT_MAP[category];

  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 160, mass: 0.9 },
  });

  const cutoutSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.85 },
  });

  const buttonPulse =
    1 + 0.03 * Math.sin(interpolate(frame, [0, 90], [0, Math.PI * 6]));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'rgba(9, 9, 11, 0.92)',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 120,
        paddingBottom: 130,
        paddingLeft: 64,
        paddingRight: 64,
      }}
    >
      {playSfx && <Audio src={ding} volume={0.45} />}

      {/* Subtle studio radial glow behind product cutout */}
      <div
        style={{
          position: 'absolute',
          top: 220,
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}38 0%, rgba(9,9,11,0) 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Brand header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: cardSpring,
          transform: `translateY(${interpolate(cardSpring, [0, 1], [-24, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.englishDisplay,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: accentColor,
          }}
        >
          {brandName}
        </div>
        <div
          style={{
            fontFamily: fonts.headlineBangla,
            fontSize: 64,
            fontWeight: 800,
            color: '#FFFFFF',
            textAlign: 'center',
            lineHeight: 1.18,
          }}
        >
          {ctaHeading}
        </div>
      </div>

      {/* Real rembg transparent product cutout overlay */}
      <div
        style={{
          position: 'relative',
          width: 680,
          height: 620,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: cutoutSpring,
          transform: `scale(${0.82 + cutoutSpring * 0.18}) translateY(${interpolate(
            cutoutSpring,
            [0, 1],
            [40, 0]
          )}px)`,
        }}
      >
        <Img
          src={cutoutSrc}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 30px 45px rgba(0, 0, 0, 0.85))',
          }}
        />
      </div>

      {/* Conversion Card */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#141418',
          border: '1.5px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 32,
          padding: '38px 42px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 22,
          boxShadow: '0 30px 70px rgba(0, 0, 0, 0.75)',
          opacity: cardSpring,
          transform: `translateY(${interpolate(cardSpring, [0, 1], [48, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.captionsBangla,
            fontSize: 38,
            fontWeight: 700,
            color: '#F4F4F5',
            textAlign: 'center',
          }}
        >
          {productTitle}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 24,
          }}
        >
          <span
            style={{
              fontFamily: fonts.priceDisplay,
              fontSize: 74,
              fontWeight: 800,
              color: accentColor,
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
                fontSize: 38,
                fontWeight: 500,
                color: '#71717A',
                textDecoration: 'line-through',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {originalPrice}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 32,
            color: '#D4D4D8',
            fontFamily: fonts.captionsBangla,
            fontSize: 28,
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={28} color={accentColor} />
            {ctaSubtext}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={28} color={accentColor} />
            ১০০% অরিজিনাল
          </span>
        </div>

        {/* ORDER NOW CTA Button */}
        <div
          style={{
            width: '100%',
            backgroundColor: accentColor,
            color: '#09090B',
            borderRadius: 20,
            padding: '24px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            transform: `scale(${buttonPulse})`,
            boxShadow: `0 16px 40px ${accentColor}55`,
          }}
        >
          <ShoppingBag size={36} color="#09090B" strokeWidth={2.5} />
          <span
            style={{
              fontFamily: fonts.englishDisplay,
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: '0.06em',
            }}
          >
            {ctaButtonText}
          </span>
        </div>

        {orderPhone ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: fonts.englishDisplay,
              fontSize: 30,
              fontWeight: 600,
              color: '#A1A1AA',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <PhoneCall size={26} color={accentColor} />
            <span>{orderPhone}</span>
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
