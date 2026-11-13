import React, { useState } from 'react';
import { Loader2, Mic, Sparkles, Volume2 } from 'lucide-react';
import type { AdConfig, VoiceId } from '../types/ad';

interface ScriptVoicePanelProps {
  config: AdConfig;
  onUpdateConfig: (patch: Partial<AdConfig>) => void;
  onSeekToMs: (ms: number) => void;
}

export const ScriptVoicePanel: React.FC<ScriptVoicePanelProps> = ({
  config,
  onUpdateConfig,
  onSeekToMs,
}) => {
  const [aiBenefit, setAiBenefit] = useState('');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isSynthesizingVoice, setIsSynthesizingVoice] = useState(false);
  const [speechRate, setSpeechRate] = useState('+4%');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateCopy = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsGeneratingCopy(true);
    try {
      const res = await fetch('/api/ai/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: config.productTitle,
          category: config.category,
          offerPrice: config.offerPrice,
          originalPrice: config.originalPrice,
          keyBenefit: aiBenefit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Bangla ad copy.');
      }
      onUpdateConfig({
        hookHeadline: data.copy.hookHeadline,
        hookSubline: data.copy.hookSubline,
        voiceoverScript: data.copy.voiceoverScript,
        discountLabel: data.copy.discountLabel,
        ctaHeading: data.copy.ctaHeading,
        ctaSubtext: data.copy.ctaSubtext,
      });
      setStatusMsg('Generated fresh Bangla hook, voiceover script, and CTA copy.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Copy generation failed.');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleSynthesizeVoice = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setIsSynthesizingVoice(true);
    try {
      const res = await fetch('/api/voice/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: config.voiceoverScript,
          voice: config.voiceId,
          rate: speechRate,
          bgmSrc: config.bgmSrc,
          campaignId: config.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Voiceover synthesis failed.');
      }
      onUpdateConfig({
        audioSrc: data.audioSrc,
        captions: data.captions,
        durationInFrames: data.recommendedFrames,
      });
      setStatusMsg(
        `Synthesized ${(data.durationMs / 1000).toFixed(2)}s Bangla voiceover (${data.captions.length} synced caption tokens).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Voiceover synthesis failed.');
    } finally {
      setIsSynthesizingVoice(false);
    }
  };

  const updateCaptionText = (index: number, nextText: string) => {
    const updated = config.captions.map((c, idx) =>
      idx === index ? { ...c, text: idx === 0 ? nextText : ` ${nextText.trimStart()}` } : c
    );
    onUpdateConfig({ captions: updated });
  };

  return (
    <div className="flex flex-col gap-8">
      {errorMsg && (
        <div
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div
          role="status"
          className="rounded-md border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
        >
          {statusMsg}
        </div>
      )}

      {/* Hook & AI Copywriting */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              01. 3-Second Hook & Bangla Script
            </h3>
            <p className="text-sm text-zinc-400">
              Write directly or generate conversion-focused Bangla copy for your product.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateCopy}
            disabled={isGeneratingCopy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isGeneratingCopy ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            <span>{isGeneratingCopy ? 'Writing Copy...' : 'Generate Bangla Copy'}</span>
          </button>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
          Key Product Selling Point (Optional AI Prompt)
          <input
            type="text"
            value={aiBenefit}
            onChange={(e) => setAiBenefit(e.target.value)}
            placeholder="e.g. Waterproof stainless steel, 1-year warranty, free Dhaka delivery"
            className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            3s Hook Headline (Bangla)
            <input
              type="text"
              value={config.hookHeadline}
              onChange={(e) => onUpdateConfig({ hookHeadline: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 font-bangla-ui focus:outline-none focus:border-amber-500"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Hook Subline (English Eyebrow)
            <input
              type="text"
              value={config.hookSubline}
              onChange={(e) => onUpdateConfig({ hookSubline: e.target.value })}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </label>
        </div>
      </section>

      {/* Edge-TTS Bangla Voiceover Synthesis */}
      <section className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              02. Edge-TTS Bangla Voiceover & SubMaker Sync
            </h3>
            <p className="text-sm text-zinc-400">
              Runs <code className="text-zinc-200">generate_voice.py</code> to create neural MP3 speech and frame-accurate word timestamps.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Bangla Neural Voice
            <select
              value={config.voiceId}
              onChange={(e) =>
                onUpdateConfig({ voiceId: e.target.value as VoiceId })
              }
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="bn-BD-PradeepNeural">Pradeep Neural (Male · Commercial)</option>
              <option value="bn-BD-NabanitaNeural">Nabanita Neural (Female · Lifestyle)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Narration Pace
            <select
              value={speechRate}
              onChange={(e) => setSpeechRate(e.target.value)}
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="-5%">Calm (-5%)</option>
              <option value="+0%">Natural (+0%)</option>
              <option value="+4%">Reel Energy (+4%)</option>
              <option value="+10%">Fast Promo (+10%)</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
          Bangla Voiceover Script
          <textarea
            rows={4}
            value={config.voiceoverScript}
            onChange={(e) => onUpdateConfig({ voiceoverScript: e.target.value })}
            className="rounded-md border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 font-bangla-ui leading-relaxed focus:outline-none focus:border-amber-500"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Volume2 size={15} className="text-amber-400 shrink-0" />
            <span className="font-mono-tabular truncate max-w-[260px]">
              Audio: /{config.audioSrc}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSynthesizeVoice}
            disabled={isSynthesizingVoice}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSynthesizingVoice ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Mic size={14} />
            )}
            <span>
              {isSynthesizingVoice
                ? 'Synthesizing Voice...'
                : 'Synthesize Voice & Sync Captions'}
            </span>
          </button>
        </div>
      </section>

      {/* Frame-Accurate Caption Timeline Table */}
      <section className="flex flex-col gap-3 border-t border-zinc-800 pt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">
            03. Synced Caption Cues ({config.captions.length} tokens)
          </h3>
          <span className="text-xs text-zinc-400">
            Click any timestamp to jump playhead
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/80 bg-zinc-900/40">
          {config.captions.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              No caption cues yet. Click &quot;Synthesize Voice &amp; Sync Captions&quot; to generate SubMaker timestamps.
            </div>
          ) : (
            config.captions.map((cap, idx) => (
              <div
                key={`${cap.startMs}-${idx}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-900/80 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => onSeekToMs(cap.startMs)}
                  className="text-xs font-mono-tabular text-amber-400 hover:text-amber-300 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {(cap.startMs / 1000).toFixed(2)}s – {(cap.endMs / 1000).toFixed(2)}s
                </button>
                <input
                  type="text"
                  value={cap.text.trimStart()}
                  onChange={(e) => updateCaptionText(idx, e.target.value)}
                  className="flex-1 bg-transparent text-sm text-zinc-100 font-bangla-ui focus:outline-none border-b border-transparent focus:border-amber-500 py-0.5"
                />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
