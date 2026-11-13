import React from 'react';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useVideoConfig,
} from 'remotion';
import { CTAScreen } from '../components/CTAScreen';
import { HookBanner } from '../components/HookBanner';
import { ProductBadge } from '../components/ProductBadge';
import { SyncedCaptions } from '../components/SyncedCaptions';
import { VideoBackground } from '../components/VideoBackground';
import { loadAllAdFonts } from '../lib/fonts';
import { resolveMediaSrc } from '../lib/media';
import type { AdConfig } from '../types/ad';

void loadAllAdFonts();

export const AdComposition: React.FC<AdConfig> = ({
  category,
  brandName,
  productTitle,
  hookHeadline,
  hookSubline,
  originalPrice,
  offerPrice,
  discountLabel,
  ctaHeading,
  ctaSubtext,
  ctaButtonText,
  orderPhone,
  mediaSrc,
  mediaType,
  cutoutSrc,
  audioSrc,
  bgmSrc,
  colorGrade,
  hookSfx,
  captions,
  accentColor,
}) => {
  const { durationInFrames, fps } = useVideoConfig();

  const transitionFrames = 15;
  const ctaDuration = Math.min(105, Math.max(75, Math.round(durationInFrames * 0.27)));
  const mainDuration = Math.max(120, durationInFrames - ctaDuration + transitionFrames);
  const hookDuration = Math.min(3 * fps, mainDuration);
  const badgeFrom = Math.min(72, Math.max(30, mainDuration - 90));

  const resolvedMedia = resolveMediaSrc(mediaSrc);
  const resolvedCutout = resolveMediaSrc(cutoutSrc || mediaSrc);
  const resolvedAudio = resolveMediaSrc(audioSrc);
  const resolvedBgm = bgmSrc ? resolveMediaSrc(bgmSrc) : '';

  return (
    <AbsoluteFill style={{ backgroundColor: '#09090B' }}>
      {resolvedAudio ? <Audio src={resolvedAudio} volume={1.0} /> : null}
      {resolvedBgm ? <Audio src={resolvedBgm} volume={0.18} loop /> : null}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={mainDuration}>
          <AbsoluteFill>
            <VideoBackground
              src={resolvedMedia}
              mediaType={mediaType}
              colorGrade={colorGrade}
              zoomFrom={1.0}
              zoomTo={1.11}
              panYFrom={0}
              panYTo={-28}
            />

            <Sequence durationInFrames={hookDuration} layout="none">
              <HookBanner
                headline={hookHeadline}
                subline={hookSubline}
                category={category}
                accentColor={accentColor}
                sfxPreset={hookSfx}
                playSfx={true}
              />
            </Sequence>

            <Sequence from={badgeFrom} layout="none">
              <ProductBadge
                productTitle={productTitle}
                originalPrice={originalPrice}
                offerPrice={offerPrice}
                discountLabel={discountLabel}
                category={category}
                accentColor={accentColor}
              />
            </Sequence>

            <SyncedCaptions
              captions={captions}
              category={category}
              accentColor={accentColor}
            />
          </AbsoluteFill>
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={
            category === 'luxury'
              ? fade()
              : slide({ direction: 'from-bottom' })
          }
          timing={linearTiming({ durationInFrames: transitionFrames })}
        />

        <TransitionSeries.Sequence durationInFrames={ctaDuration}>
          <CTAScreen
            brandName={brandName}
            productTitle={productTitle}
            offerPrice={offerPrice}
            originalPrice={originalPrice}
            ctaHeading={ctaHeading}
            ctaSubtext={ctaSubtext}
            ctaButtonText={ctaButtonText}
            orderPhone={orderPhone}
            cutoutSrc={resolvedCutout}
            category={category}
            accentColor={accentColor}
            playSfx={true}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
