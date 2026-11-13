import React, { useEffect, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { Eye, EyeOff, Pause, Play, RotateCcw } from 'lucide-react';
import { AdComposition } from '../remotion/AdComposition';
import { REEL_HEIGHT, REEL_WIDTH, type AdConfig } from '../types/ad';

interface PreviewMonitorProps {
  config: AdConfig;
  playerRef: React.RefObject<PlayerRef | null>;
}

export const PreviewMonitor: React.FC<PreviewMonitorProps> = ({
  config,
  playerRef,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(false);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    const onFrameUpdate = (e: { detail: { frame: number } }) => {
      setCurrentFrame(e.detail.frame);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    player.addEventListener('frameupdate', onFrameUpdate);
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);

    return () => {
      player.removeEventListener('frameupdate', onFrameUpdate);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
    };
  }, [playerRef, config.id, config.durationInFrames]);

  const fps = config.fps || 30;
  const totalSeconds = config.durationInFrames / fps;
  const currentSeconds = currentFrame / fps;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  };

  const seekTo = (frame: number) => {
    const clamped = Math.max(0, Math.min(config.durationInFrames - 1, frame));
    playerRef.current?.seekTo(clamped);
    setCurrentFrame(clamped);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const ctaStartFrame = Math.max(
    0,
    config.durationInFrames - Math.min(105, Math.max(75, Math.round(config.durationInFrames * 0.27))) + 15
  );

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">9:16 Reel Monitor</h2>
          <p className="text-xs text-zinc-400 font-mono-tabular">
            1080×1920 · {fps}fps · {totalSeconds.toFixed(1)}s
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSafeZones((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            showSafeZones
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
              : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          {showSafeZones ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>Safe Zones</span>
        </button>
      </div>

      {/* 9:16 Viewport Frame */}
      <div className="relative mx-auto w-full max-w-[330px] aspect-[9/16] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl">
        <Player
          ref={playerRef}
          component={AdComposition}
          inputProps={config}
          durationInFrames={config.durationInFrames}
          compositionWidth={REEL_WIDTH}
          compositionHeight={REEL_HEIGHT}
          fps={fps}
          controls={false}
          loop
          style={{
            width: '100%',
            height: '100%',
          }}
        />

        {showSafeZones && (
          <div className="pointer-events-none absolute inset-0 border-x-[18px] border-t-[42px] border-b-[68px] border-amber-500/20">
            <div className="w-full h-full border border-dashed border-amber-400/60 flex items-start justify-end p-2">
              <span className="text-[10px] font-mono-tabular text-amber-300 bg-zinc-950/80 px-1.5 py-0.5 rounded">
                Reels / TikTok Safe Frame
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Transport & Scene Scrubber */}
      <div className="flex flex-col gap-3 border border-zinc-800 bg-zinc-900/60 rounded-lg p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors cursor-pointer shrink-0"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>
            <button
              type="button"
              onClick={() => seekTo(0)}
              aria-label="Restart from frame 0"
              className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw size={15} />
            </button>
          </div>

          <div className="text-right font-mono-tabular text-xs">
            <div className="text-zinc-100 font-medium">
              {formatSec(currentSeconds)} / {formatSec(totalSeconds)}
            </div>
            <div className="text-zinc-500">
              Frame {currentFrame} / {config.durationInFrames}
            </div>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={Math.max(1, config.durationInFrames - 1)}
          value={currentFrame}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Timeline frame scrubber"
          className="w-full accent-amber-500 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
        />

        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => seekTo(12)}
            className="px-2 py-1.5 text-xs font-medium rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap truncate cursor-pointer"
          >
            Hook (0:00)
          </button>
          <button
            type="button"
            onClick={() => seekTo(90)}
            className="px-2 py-1.5 text-xs font-medium rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap truncate cursor-pointer"
          >
            Offer Badge
          </button>
          <button
            type="button"
            onClick={() => seekTo(ctaStartFrame)}
            className="px-2 py-1.5 text-xs font-medium rounded border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap truncate cursor-pointer"
          >
            CTA End Card
          </button>
        </div>
      </div>
    </aside>
  );
};
