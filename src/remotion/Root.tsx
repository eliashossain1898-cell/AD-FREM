import React from 'react';
import { Composition, type CalculateMetadataFunction } from 'remotion';
import { DEFAULT_AD_PRESETS } from '../data/presets';
import { REEL_FPS, REEL_HEIGHT, REEL_WIDTH, type AdConfig } from '../types/ad';
import { AdComposition } from './AdComposition';

const calculateAdMetadata: CalculateMetadataFunction<AdConfig> = async ({
  props,
}) => {
  return {
    durationInFrames: Math.max(150, props.durationInFrames || 360),
    fps: props.fps || REEL_FPS,
    width: REEL_WIDTH,
    height: REEL_HEIGHT,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="BanglaCommercialAd"
      component={AdComposition}
      durationInFrames={DEFAULT_AD_PRESETS[0].durationInFrames}
      fps={REEL_FPS}
      width={REEL_WIDTH}
      height={REEL_HEIGHT}
      defaultProps={DEFAULT_AD_PRESETS[0]}
      calculateMetadata={calculateAdMetadata}
    />
  );
};
