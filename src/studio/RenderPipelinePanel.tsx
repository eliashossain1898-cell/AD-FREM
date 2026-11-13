import React, { useState } from 'react';
import { Check, Copy, Download, Film, Loader2 } from 'lucide-react';
import type { AdConfig } from '../types/ad';

export interface RenderOutput {
  downloadUrl: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

interface RenderPipelinePanelProps {
  config: AdConfig;
  renders: RenderOutput[];
  isRendering: boolean;
  renderError: string | null;
  onTriggerRender: () => void;
}

export const RenderPipelinePanel: React.FC<RenderPipelinePanelProps> = ({
  config,
  renders,
  isRendering,
  renderError,
  onTriggerRender,
}) => {
  const [copied, setCopied] = useState(false);

  const escapedScript = config.voiceoverScript.replace(/"/g, '\\"');
  const oneCommandCli = `python3 generate_voice.py --text "${escapedScript}" --voice ${config.voiceId} --out-audio public/${config.audioSrc} --out-json public/audio/captions.json && npx remotion render src/remotion/index.ts BanglaCommercialAd out/${config.id}.mp4`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(oneCommandCli);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked in some embedded contexts
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Server Render Action */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              01. Render Production 9:16 MP4
            </h3>
            <p className="text-sm text-zinc-400">
              Invokes Remotion headless renderer at 1080×1920, 30fps with H.264 video and synced Bangla AAC audio.
            </p>
          </div>

          <button
            type="button"
            onClick={onTriggerRender}
            disabled={isRendering}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRendering ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Film size={15} />
            )}
            <span>{isRendering ? 'Rendering MP4...' : 'Render 1080×1920 MP4'}</span>
          </button>
        </div>

        {renderError && (
          <div
            role="alert"
            className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          >
            {renderError}
          </div>
        )}

        {/* Export History */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800">
          {renders.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              No MP4 exports rendered in this session yet. Click &quot;Render 1080×1920 MP4&quot; to produce a deliverable Reel.
            </div>
          ) : (
            renders.map((item) => (
              <div
                key={item.filename}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-zinc-100 font-mono-tabular">
                    {item.filename}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono-tabular">
                    {(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB · 1080×1920 · {item.createdAt}
                  </div>
                </div>
                <a
                  href={item.downloadUrl}
                  download={item.filename}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 text-xs font-medium hover:border-amber-500 transition-colors whitespace-nowrap shrink-0"
                >
                  <Download size={14} />
                  <span>Download MP4</span>
                </a>
              </div>
            ))
          )}
        </div>
      </section>

      {/* One-Command CLI Pipeline */}
      <section className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              02. Autonomous One-Command CLI Pipeline
            </h3>
            <p className="text-sm text-zinc-400">
              Run directly from terminal to synthesize Bangla speech, extract timestamps, and render in one step.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-medium hover:border-zinc-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy Command'}</span>
          </button>
        </div>

        <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-xs font-mono-tabular text-zinc-300 leading-relaxed">
          {oneCommandCli}
        </pre>
      </section>
    </div>
  );
};
