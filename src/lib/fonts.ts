import { loadFont as loadLocalFont } from '@remotion/fonts';
import { loadFont as loadAnekBangla } from '@remotion/google-fonts/AnekBangla';
import { loadFont as loadBalooDa2 } from '@remotion/google-fonts/BalooDa2';
import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadHindSiliguri } from '@remotion/google-fonts/HindSiliguri';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadNotoSansBengali } from '@remotion/google-fonts/NotoSansBengali';
import { staticFile } from 'remotion';
import type { AdCategory } from '../types/ad';

const hindSiliguri = loadHindSiliguri('normal', {
  weights: ['400', '600', '700'],
  subsets: ['bengali', 'latin'],
});

const balooDa2 = loadBalooDa2('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['bengali', 'latin'],
});

const anekBangla = loadAnekBangla('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['bengali', 'latin'],
});

const notoSansBengali = loadNotoSansBengali('normal', {
  weights: ['400', '600', '700'],
  subsets: ['bengali', 'latin'],
});

const montserrat = loadMontserrat('normal', {
  weights: ['500', '700', '800'],
  subsets: ['latin'],
});

const bebasNeue = loadBebasNeue('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const LI_ADOR_NOIRRIT_FAMILY = 'Li Ador Noirrit';

let fontsLoadPromise: Promise<void> | null = null;

export const loadAllAdFonts = (): Promise<void> => {
  if (fontsLoadPromise) {
    return fontsLoadPromise;
  }

  const adorUrl =
    typeof window !== 'undefined' && !window.remotion_staticBase
      ? '/fonts/LiAdorNoirritUnicode.ttf'
      : staticFile('fonts/LiAdorNoirritUnicode.ttf');

  fontsLoadPromise = Promise.all([
    hindSiliguri.waitUntilDone(),
    balooDa2.waitUntilDone(),
    anekBangla.waitUntilDone(),
    notoSansBengali.waitUntilDone(),
    montserrat.waitUntilDone(),
    bebasNeue.waitUntilDone(),
    loadLocalFont({
      family: LI_ADOR_NOIRRIT_FAMILY,
      url: adorUrl,
      format: 'truetype',
      display: 'block',
    }).catch(() => undefined),
  ]).then(() => undefined);

  return fontsLoadPromise;
};

// Trigger initial load immediately at module evaluation for Remotion & Player
void loadAllAdFonts();

export const AD_FONTS = {
  liAdorNoirrit: LI_ADOR_NOIRRIT_FAMILY,
  hindSiliguri: hindSiliguri.fontFamily,
  balooDa2: balooDa2.fontFamily,
  anekBangla: anekBangla.fontFamily,
  notoSansBengali: notoSansBengali.fontFamily,
  montserrat: montserrat.fontFamily,
  bebasNeue: bebasNeue.fontFamily,
} as const;

export interface CategoryFontSpec {
  headlineBangla: string;
  captionsBangla: string;
  englishDisplay: string;
  priceDisplay: string;
  rationale: string;
}

export const CATEGORY_FONT_MAP: Record<AdCategory, CategoryFontSpec> = {
  luxury: {
    headlineBangla: AD_FONTS.liAdorNoirrit,
    captionsBangla: AD_FONTS.hindSiliguri,
    englishDisplay: AD_FONTS.montserrat,
    priceDisplay: AD_FONTS.montserrat,
    rationale: 'Li Ador Noirrit editorial Bangla serif-inspired strokes + Montserrat luxury caps',
  },
  beauty: {
    headlineBangla: AD_FONTS.balooDa2,
    captionsBangla: AD_FONTS.notoSansBengali,
    englishDisplay: AD_FONTS.montserrat,
    priceDisplay: AD_FONTS.montserrat,
    rationale: 'Baloo Da Two rounded organic warmth + Noto Sans Bengali crisp legibility',
  },
  gadget: {
    headlineBangla: AD_FONTS.anekBangla,
    captionsBangla: AD_FONTS.hindSiliguri,
    englishDisplay: AD_FONTS.bebasNeue,
    priceDisplay: AD_FONTS.bebasNeue,
    rationale: 'Anek Bangla bold geometric punch + Bebas Neue condensed tech numerals',
  },
};
