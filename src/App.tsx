import React, { useRef, useState } from 'react';
import type { PlayerRef } from '@remotion/player';
import { DEFAULT_AD_PRESETS } from './data/presets';
import { loadAllAdFonts } from './lib/fonts';
import { CampaignsPanel } from './studio/CampaignsPanel';
import { MediaCutoutPanel } from './studio/MediaCutoutPanel';
import { PreviewMonitor } from './studio/PreviewMonitor';
import { RenderPipelinePanel, type RenderOutput } from './studio/RenderPipelinePanel';
import { ScriptVoicePanel } from './studio/ScriptVoicePanel';
import type { AdConfig } from './types/ad';

void loadAllAdFonts();

type StudioTab = 'campaigns' | 'script' | 'media' | 'render';

const NAV_TABS: { id: StudioTab; label: string }[] = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'script', label: 'Script & Voice' },
  { id: 'media', label: 'Media & Cutouts' },
  { id: 'render', label: 'Render Pipeline' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('campaigns');
  const [config, setConfig] = useState<AdConfig>(DEFAULT_AD_PRESETS[0]);
  const [renders, setRenders] = useState<RenderOutput[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const playerRef = useRef<PlayerRef | null>(null);

  const handleUpdateConfig = (patch: Partial<AdConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  };

  const handleSelectPreset = (preset: AdConfig) => {
    setConfig(preset);
    playerRef.current?.seekTo(0);
  };

  const handleSeekToMs = (ms: number) => {
    const targetFrame = Math.round((ms / 1000) * (config.fps || 30));
    playerRef.current?.seekTo(
      Math.max(0, Math.min(config.durationInFrames - 1, targetFrame))
    );
  };

  const handleTriggerRender = async () => {
    setActiveTab('render');
    setRenderError(null);
    setIsRendering(true);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'MP4 render failed.');
      }
      setRenders((prev) => [
        {
          downloadUrl: data.downloadUrl,
          filename: data.filename,
          sizeBytes: data.sizeBytes,
          createdAt: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    } catch (err) {
      setRenderError(err instanceof Error ? err.message : 'MP4 render failed.');
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
        <div className="max-w-[1440px] mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          <a
            href="/"
            className="text-base font-bold tracking-tight text-zinc-100 whitespace-nowrap shrink-0"
          >
            AdFrame Studio
          </a>

          <nav
            aria-label="Studio workspace sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'border-amber-500 text-zinc-100'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleTriggerRender}
              disabled={isRendering}
              className="px-4 py-2 text-xs font-semibold rounded-md bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isRendering ? 'Rendering MP4...' : 'Export 9:16 MP4'}
            </button>
          </div>
        </div>

        {/* Mobile Nav Row */}
        <div className="flex md:hidden items-center gap-4 overflow-x-auto px-6 pb-2.5 text-xs font-medium border-t border-zinc-900 pt-2">
          {NAV_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-amber-500 text-zinc-100'
                  : 'border-transparent text-zinc-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Studio Canvas */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-start">
          {/* Left Workspace Column */}
          <div className="flex flex-col gap-6 min-w-0">
            <div className="border-b border-zinc-800 pb-4 flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-100 text-balance">
                  {config.campaignName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1 font-mono-tabular">
                  <span>{config.brandName}</span>
                  <span aria-hidden="true">·</span>
                  <span>1080×1920</span>
                  <span aria-hidden="true">·</span>
                  <span>{config.fps}fps</span>
                  <span aria-hidden="true">·</span>
                  <span>{(config.durationInFrames / (config.fps || 30)).toFixed(1)}s</span>
                  <span aria-hidden="true">·</span>
                  <span>{config.voiceId}</span>
                </div>
              </div>
            </div>

            {activeTab === 'campaigns' && (
              <CampaignsPanel
                presets={DEFAULT_AD_PRESETS}
                config={config}
                onSelectPreset={handleSelectPreset}
                onUpdateConfig={handleUpdateConfig}
              />
            )}

            {activeTab === 'script' && (
              <ScriptVoicePanel
                config={config}
                onUpdateConfig={handleUpdateConfig}
                onSeekToMs={handleSeekToMs}
              />
            )}

            {activeTab === 'media' && (
              <MediaCutoutPanel
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            )}

            {activeTab === 'render' && (
              <RenderPipelinePanel
                config={config}
                renders={renders}
                isRendering={isRendering}
                renderError={renderError}
                onTriggerRender={handleTriggerRender}
              />
            )}
          </div>

          {/* Right Live Remotion Player Column */}
          <PreviewMonitor config={config} playerRef={playerRef} />
        </div>
      </main>
    </div>
  );
}
