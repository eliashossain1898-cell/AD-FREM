import React from 'react';
import { Check, Sparkles, Tag, Zap } from 'lucide-react';
import { CATEGORY_FONT_MAP } from '../lib/fonts';
import type { AdCategory, AdConfig } from '../types/ad';

interface CampaignsPanelProps {
  presets: AdConfig[];
  config: AdConfig;
  onSelectPreset: (preset: AdConfig) => void;
  onUpdateConfig: (patch: Partial<AdConfig>) => void;
}

const CATEGORY_LABELS: Record<AdCategory, string> = {
  luxury: 'Luxury / Watch',
  beauty: 'Beauty / Skincare',
  gadget: 'Tech / Gadget',
};

export const CampaignsPanel: React.FC<CampaignsPanelProps> = ({
  presets,
  config,
  onSelectPreset,
  onUpdateConfig,
}) => {
  const activeFonts = CATEGORY_FONT_MAP[config.category];

  return (
    <div className="flex flex-col gap-8">
      {/* Preset Selector */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              01. Commercial Templates
            </h3>
            <p className="text-sm text-zinc-400">
              Switch between category-calibrated Bangla typography, color grades, and cutouts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((preset) => {
            const isSelected = config.id === preset.id;
            const Icon =
              preset.category === 'luxury'
                ? Sparkles
                : preset.category === 'beauty'
                  ? Tag
                  : Zap;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`group flex flex-col text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                }`}
              >
                <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden bg-zinc-950 mb-3 border border-zinc-800">
                  <img
                    src={`/${preset.mediaSrc.replace(/^\/+/, '')}`}
                    alt={preset.campaignName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
                    <Icon size={13} className="text-amber-400" />
                    <span>{CATEGORY_LABELS[preset.category]}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                </div>

                <div className="text-sm font-semibold text-zinc-100 truncate">
                  {preset.campaignName}
                </div>
                <div className="text-xs text-zinc-400 font-bangla-ui truncate mt-0.5">
                  {preset.productTitle}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Brand & Offer Pricing Fields */}
      <section className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-100">
            02. Product & Cash-on-Delivery Offer
          </h3>
          <p className="text-sm text-zinc-400">
            Updates ProductBadge and CTAScreen in real time inside the Remotion composition.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Category Typography & Grade
            <select
              value={config.category}
              onChange={(e) => {
                const cat = e.target.value as AdCategory;
                onUpdateConfig({
                  category: cat,
                  colorGrade:
                    cat === 'luxury'
                      ? 'luxury-warm'
                      : cat === 'beauty'
                        ? 'beauty-glow'
                        : 'gadget-crisp',
                });
              }}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="luxury">Luxury / Watch (Li Ador Noirrit + Montserrat)</option>
              <option value="beauty">Beauty / Skincare (Baloo Da Two + Noto Sans Bengali)</option>
              <option value="gadget">Tech / Gadget (Anek Bangla + Bebas Neue)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Brand Name
            <input
              type="text"
              value={config.brandName}
              onChange={(e) => onUpdateConfig({ brandName: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300 sm:col-span-2">
            Product Title (Bangla)
            <input
              type="text"
              value={config.productTitle}
              onChange={(e) => onUpdateConfig({ productTitle: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-bangla-ui focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Offer Price
            <input
              type="text"
              value={config.offerPrice}
              onChange={(e) => onUpdateConfig({ offerPrice: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-mono-tabular focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Regular Price (Strikethrough)
            <input
              type="text"
              value={config.originalPrice}
              onChange={(e) => onUpdateConfig({ originalPrice: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-mono-tabular focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Discount Badge Label
            <input
              type="text"
              value={config.discountLabel}
              onChange={(e) => onUpdateConfig({ discountLabel: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-bangla-ui focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Order Hotline Phone
            <input
              type="text"
              value={config.orderPhone}
              onChange={(e) => onUpdateConfig({ orderPhone: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-mono-tabular focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            CTA Screen Heading
            <input
              type="text"
              value={config.ctaHeading}
              onChange={(e) => onUpdateConfig({ ctaHeading: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-bangla-ui focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Accent Color
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => onUpdateConfig({ accentColor: e.target.value })}
                className="h-10 w-12 rounded border border-zinc-800 bg-zinc-900 p-1 cursor-pointer"
              />
              <input
                type="text"
                value={config.accentColor}
                onChange={(e) => onUpdateConfig({ accentColor: e.target.value })}
                className="h-10 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-mono-tabular focus:outline-none focus:border-amber-500"
              />
            </div>
          </label>
        </div>
      </section>

      {/* Active Category Font Spec */}
      <section className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
        <h3 className="text-sm font-semibold text-zinc-200">
          Active Font Mapping ({CATEGORY_LABELS[config.category]})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/40 text-xs">
          <div>
            <div className="text-zinc-500 mb-1">Bangla Hook Display</div>
            <div className="text-zinc-100 font-medium">{activeFonts.headlineBangla}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">Synced Captions</div>
            <div className="text-zinc-100 font-medium">{activeFonts.captionsBangla}</div>
          </div>
          <div>
            <div className="text-zinc-500 mb-1">English & Price Numerals</div>
            <div className="text-zinc-100 font-medium">{activeFonts.priceDisplay}</div>
          </div>
        </div>
      </section>
    </div>
  );
};
