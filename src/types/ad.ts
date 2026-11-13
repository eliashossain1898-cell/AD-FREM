import type { Caption } from '@remotion/captions';

export type AdCategory = 'luxury' | 'beauty' | 'gadget';

export type ColorGradePreset =
  | 'luxury-warm'
  | 'beauty-glow'
  | 'gadget-crisp'
  | 'cinematic-contrast'
  | 'natural';

export type VoiceId = 'bn-BD-PradeepNeural' | 'bn-BD-NabanitaNeural';

export type HookSfxPreset = 'whoosh' | 'whip' | 'ding' | 'vineBoom';

export type AdConfig = {
  id: string;
  campaignName: string;
  category: AdCategory;
  brandName: string;
  productTitle: string;
  hookHeadline: string;
  hookSubline: string;
  voiceoverScript: string;
  voiceId: VoiceId;
  originalPrice: string;
  offerPrice: string;
  discountLabel: string;
  ctaHeading: string;
  ctaSubtext: string;
  ctaButtonText: string;
  orderPhone: string;
  mediaSrc: string;
  mediaType: 'image' | 'video';
  cutoutSrc: string;
  audioSrc: string;
  bgmSrc?: string;
  colorGrade: ColorGradePreset;
  hookSfx: HookSfxPreset;
  captions: Caption[];
  durationInFrames: number;
  fps: number;
  accentColor: string;
};

export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 30;
