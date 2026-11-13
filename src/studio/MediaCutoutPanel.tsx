import React, { useState } from 'react';
import { Loader2, Music, Scissors, Upload, Video } from 'lucide-react';
import type { AdConfig, ColorGradePreset, HookSfxPreset } from '../types/ad';

interface MediaCutoutPanelProps {
  config: AdConfig;
  onUpdateConfig: (patch: Partial<AdConfig>) => void;
}

export const MediaCutoutPanel: React.FC<MediaCutoutPanelProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isUploadingBgm, setIsUploadingBgm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Upload failed.');
    }
    return data as { path: string; mediaType: 'image' | 'video' | 'audio' };
  };

  const handleBackgroundUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setIsUploadingMedia(true);
    try {
      const uploaded = await uploadFile(file);
      onUpdateConfig({
        mediaSrc: uploaded.path,
        mediaType: uploaded.mediaType === 'video' ? 'video' : 'image',
      });
      setStatusMsg(`Loaded ${uploaded.mediaType} background: /${uploaded.path}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Media upload failed.');
    } finally {
      setIsUploadingMedia(false);
      e.target.value = '';
    }
  };

  const handleCutoutUploadAndStrip = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setIsRemovingBg(true);
    try {
      const uploaded = await uploadFile(file);
      const res = await fetch('/api/media/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: uploaded.path }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Background removal failed.');
      }
      onUpdateConfig({ cutoutSrc: data.cutoutSrc });
      setStatusMsg(
        `Removed background via rembg (${data.width}×${data.height} transparent PNG).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cutout generation failed.');
    } finally {
      setIsRemovingBg(false);
      e.target.value = '';
    }
  };

  const handleRunRembgOnCurrent = async () => {
    if (config.mediaType === 'video') {
      setErrorMsg('Upload a product photo (JPG/PNG) to generate a transparent PNG cutout.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg(null);
    setIsRemovingBg(true);
    try {
      const res = await fetch('/api/media/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePath: config.mediaSrc }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Background removal failed.');
      }
      onUpdateConfig({ cutoutSrc: data.cutoutSrc });
      setStatusMsg(
        `Cutout regenerated (${data.width}×${data.height} PNG) and applied to CTAScreen.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Cutout generation failed.');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleBgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setStatusMsg(null);
    setIsUploadingBgm(true);
    try {
      const uploaded = await uploadFile(file);
      onUpdateConfig({ bgmSrc: uploaded.path });
      setStatusMsg(
        `Background music attached (/${uploaded.path}). Re-run voice synthesis in Script & Voice to bake pydub auto-ducking into the mix.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'BGM upload failed.');
    } finally {
      setIsUploadingBgm(false);
      e.target.value = '';
    }
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

      {/* Raw Clip / Background & Color Grading */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              01. 9:16 Video Background & Color Grading
            </h3>
            <p className="text-sm text-zinc-400">
              Center-crops any vertical or landscape clip with <code className="text-zinc-200">objectFit: &apos;cover&apos;</code> and zero mirror distortion.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs font-semibold hover:border-zinc-500 transition-colors cursor-pointer whitespace-nowrap shrink-0">
            {isUploadingMedia ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Video size={14} />
            )}
            <span>{isUploadingMedia ? 'Uploading...' : 'Upload Clip or Photo'}</span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
              onChange={handleBackgroundUpload}
              className="sr-only"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            CSS Color Grade Filter
            <select
              value={config.colorGrade}
              onChange={(e) =>
                onUpdateConfig({ colorGrade: e.target.value as ColorGradePreset })
              }
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="luxury-warm">Luxury Warm (Rich Contrast + Amber)</option>
              <option value="beauty-glow">Beauty Glow (Soft Bright + Vibrant)</option>
              <option value="gadget-crisp">Gadget Crisp (Sharp High Contrast)</option>
              <option value="cinematic-contrast">Cinematic Dark</option>
              <option value="natural">Natural (No Filter)</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-300">
            Hook Banner SFX (@remotion/sfx)
            <select
              value={config.hookSfx}
              onChange={(e) =>
                onUpdateConfig({ hookSfx: e.target.value as HookSfxPreset })
              }
              className="h-10 rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              <option value="whoosh">Whoosh (Clean Commercial Swoosh)</option>
              <option value="whip">Whip (Fast Tech Snap)</option>
              <option value="ding">Ding (Bright Offer Chime)</option>
              <option value="vineBoom">Dramatic Impact Boom</option>
            </select>
          </label>
        </div>
      </section>

      {/* AI Background Removal Cutout */}
      <section className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">
              02. AI Product Cutout (rembg + Pillow)
            </h3>
            <p className="text-sm text-zinc-400">
              Automatically removes backgrounds from product photos for the final Cash-on-Delivery CTA screen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunRembgOnCurrent}
              disabled={isRemovingBg || config.mediaType === 'video'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:border-zinc-500 disabled:opacity-40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {isRemovingBg ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Scissors size={14} />
              )}
              <span>Strip Current Photo</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-amber-500 text-zinc-950 text-xs font-semibold hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap shrink-0">
              <Upload size={14} />
              <span>Upload &amp; Strip BG</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCutoutUploadAndStrip}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-400 mb-2">Source Visual</div>
            <div className="aspect-[4/3] rounded overflow-hidden bg-zinc-950 flex items-center justify-center border border-zinc-800">
              {config.mediaType === 'video' ? (
                <video
                  src={`/${config.mediaSrc.replace(/^\/+/, '')}`}
                  muted
                  loop
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={`/${config.mediaSrc.replace(/^\/+/, '')}`}
                  alt={config.productTitle}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div className="text-xs text-zinc-400 mb-2">
              Transparent PNG Cutout (CTAScreen Overlay)
            </div>
            <div className="aspect-[4/3] rounded overflow-hidden checkerboard-alpha flex items-center justify-center p-4 border border-zinc-800">
              <img
                src={`/${config.cutoutSrc.replace(/^\/+/, '')}`}
                alt={`${config.productTitle} cutout`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Background Music Auto-Ducking */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800 pt-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            03. Background Music &amp; Auto-Ducking
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {config.bgmSrc
              ? `Attached BGM: /${config.bgmSrc}`
              : 'Optional: attach an MP3/WAV track for automatic pydub volume ducking under Bangla narration.'}
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-zinc-200 text-xs font-semibold hover:border-zinc-500 transition-colors cursor-pointer whitespace-nowrap shrink-0">
          {isUploadingBgm ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Music size={14} />
          )}
          <span>{isUploadingBgm ? 'Uploading...' : 'Attach BGM Track'}</span>
          <input
            type="file"
            accept="audio/mpeg,audio/wav,audio/mp4"
            onChange={handleBgmUpload}
            className="sr-only"
          />
        </label>
      </section>
    </div>
  );
};
