#!/usr/bin/env python3
"""
AI Bangla Voiceover, Frame-Accurate Caption & Audio-Ducking Pipeline.

Uses Microsoft Edge Neural TTS (bn-BD-PradeepNeural / bn-BD-NabanitaNeural)
with edge-tts SubMaker for exact sentence/word boundary timestamps, plus
pydub + ffmpeg-python for duration detection and background music auto-ducking.
"""

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

import edge_tts
from pydub import AudioSegment


DEFAULT_SCRIPT = (
    "আপনার স্টাইলকে দিন রাজকীয় ছোঁয়া। প্রিমিয়াম ক্রোনোগ্রাফ ঘড়ি এখন ৫০ শতাংশ ছাড়ে! "
    "স্টক শেষ হওয়ার আগেই আজই অর্ডার করুন, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি।"
)

BANGLA_VOICES = {
    "pradeep": "bn-BD-PradeepNeural",
    "nabanita": "bn-BD-NabanitaNeural",
    "bn-BD-PradeepNeural": "bn-BD-PradeepNeural",
    "bn-BD-NabanitaNeural": "bn-BD-NabanitaNeural",
}


def format_vtt_time(ms: float) -> str:
    total_ms = max(0, int(round(ms)))
    hours = total_ms // 3_600_000
    minutes = (total_ms % 3_600_000) // 60_000
    seconds = (total_ms % 60_000) // 1_000
    millis = total_ms % 1_000
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def split_sentence_to_word_captions(
    sentence_text: str,
    start_ms: int,
    end_ms: int,
) -> List[Dict[str, Any]]:
    """
    Subdivide a SentenceBoundary cue into Remotion @remotion/captions Caption tokens
    proportional to character weight, preserving leading spaces as required by
    createTikTokStyleCaptions().
    """
    cleaned = re.sub(r"\s+", " ", sentence_text.strip())
    if not cleaned:
        return []

    words = cleaned.split(" ")
    total_duration = max(120, end_ms - start_ms)
    weights = [max(2, len(w)) for w in words]
    total_weight = sum(weights)

    captions: List[Dict[str, Any]] = []
    cursor = float(start_ms)

    for idx, word in enumerate(words):
        share = (weights[idx] / total_weight) * total_duration
        w_start = int(round(cursor))
        w_end = end_ms if idx == len(words) - 1 else int(round(cursor + share))
        if w_end <= w_start:
            w_end = w_start + 60
        text_token = word if idx == 0 else f" {word}"
        captions.append(
            {
                "text": text_token,
                "startMs": w_start,
                "endMs": w_end,
                "timestampMs": int((w_start + w_end) / 2),
                "confidence": 1.0,
            }
        )
        cursor += share

    return captions


async def synthesize_voice(
    text: str,
    voice: str,
    out_audio: Path,
    rate: str = "+0%",
    pitch: str = "+0Hz",
) -> Dict[str, Any]:
    resolved_voice = BANGLA_VOICES.get(voice, voice)
    out_audio.parent.mkdir(parents=True, exist_ok=True)

    communicate = edge_tts.Communicate(
        text=text.strip(),
        voice=resolved_voice,
        rate=rate,
        pitch=pitch,
    )
    submaker = edge_tts.SubMaker()

    raw_cues: List[Dict[str, Any]] = []

    with open(out_audio, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] in ("WordBoundary", "SentenceBoundary"):
                submaker.feed(chunk)
                start_ms = int(round(chunk["offset"] / 10_000))
                duration_ms = int(round(chunk["duration"] / 10_000))
                end_ms = start_ms + max(80, duration_ms)
                raw_cues.append(
                    {
                        "type": chunk["type"],
                        "text": chunk["text"],
                        "startMs": start_ms,
                        "endMs": end_ms,
                    }
                )

    return {
        "voice": resolved_voice,
        "submaker": submaker,
        "raw_cues": raw_cues,
    }


def apply_bgm_ducking(
    voice_path: Path,
    bgm_path: Path,
    mixed_out_path: Path,
    cues: List[Dict[str, Any]],
    bgm_base_db: float = -12.0,
    duck_db: float = -10.0,
) -> int:
    """
    Auto-duck background music wherever Bangla voiceover cues are active,
    looping or trimming BGM to match total duration + 1.5s tail.
    """
    voice_seg = AudioSegment.from_file(voice_path)
    bgm_seg = AudioSegment.from_file(bgm_path) + bgm_base_db

    target_ms = len(voice_seg) + 1500
    if len(bgm_seg) < target_ms:
        repeats = (target_ms // len(bgm_seg)) + 1
        bgm_seg = bgm_seg * repeats
    bgm_seg = bgm_seg[:target_ms]

    # Build ducked BGM by lowering active voice windows smoothly
    ducked_bgm = bgm_seg
    for cue in cues:
        s = max(0, int(cue["startMs"]) - 80)
        e = min(len(ducked_bgm), int(cue["endMs"]) + 120)
        if e > s:
            before = ducked_bgm[:s]
            middle = ducked_bgm[s:e] + duck_db
            after = ducked_bgm[e:]
            ducked_bgm = before.append(middle, crossfade=min(40, len(middle) // 2 or 1))
            if len(after) > 0:
                ducked_bgm = ducked_bgm.append(after, crossfade=min(40, len(after) // 2 or 1))

    ducked_bgm = ducked_bgm[:target_ms].fade_out(900)
    combined = ducked_bgm.overlay(voice_seg, position=0)
    mixed_out_path.parent.mkdir(parents=True, exist_ok=True)
    combined.export(mixed_out_path, format="mp3", bitrate="192k")
    return len(combined)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate Bangla Edge-TTS voiceover + frame-accurate Remotion captions."
    )
    parser.add_argument("--text", type=str, default=None, help="Bangla voiceover script text.")
    parser.add_argument("--script-file", type=str, default=None, help="Path to UTF-8 script text file.")
    parser.add_argument(
        "--voice",
        type=str,
        default="bn-BD-PradeepNeural",
        help="Voice ID: bn-BD-PradeepNeural (male) or bn-BD-NabanitaNeural (female).",
    )
    parser.add_argument("--rate", type=str, default="+4%", help="Speaking rate adjustment, e.g. +4%% or -5%%.")
    parser.add_argument("--pitch", type=str, default="+0Hz", help="Pitch adjustment, e.g. +0Hz.")
    parser.add_argument("--out-audio", type=str, default="public/audio/voiceover.mp3", help="Output MP3 path.")
    parser.add_argument("--out-json", type=str, default="public/audio/captions.json", help="Output Remotion Caption JSON path.")
    parser.add_argument("--out-vtt", type=str, default="public/audio/captions.vtt", help="Output WebVTT path.")
    parser.add_argument("--bgm", type=str, default=None, help="Optional background music file for auto-ducking.")
    parser.add_argument("--out-mixed", type=str, default="public/audio/mixed.mp3", help="Output auto-ducked mixed MP3 path.")
    parser.add_argument("--fps", type=int, default=30, help="Target video FPS for frame calculations.")

    args = parser.parse_args()

    script_text = args.text
    if args.script_file:
        script_text = Path(args.script_file).read_text(encoding="utf-8").strip()
    if not script_text:
        script_text = DEFAULT_SCRIPT

    out_audio = Path(args.out_audio)
    out_json = Path(args.out_json)
    out_vtt = Path(args.out_vtt)

    result = asyncio.run(
        synthesize_voice(
            text=script_text,
            voice=args.voice,
            out_audio=out_audio,
            rate=args.rate,
            pitch=args.pitch,
        )
    )

    audio_seg = AudioSegment.from_file(out_audio)
    duration_ms = len(audio_seg)

    raw_cues = result["raw_cues"]
    word_captions: List[Dict[str, Any]] = []

    if raw_cues:
        for cue in raw_cues:
            if cue["type"] == "WordBoundary":
                prefix = "" if not word_captions else " "
                word_captions.append(
                    {
                        "text": f"{prefix}{cue['text']}",
                        "startMs": cue["startMs"],
                        "endMs": cue["endMs"],
                        "timestampMs": int((cue["startMs"] + cue["endMs"]) / 2),
                        "confidence": 1.0,
                    }
                )
            else:
                tokens = split_sentence_to_word_captions(
                    cue["text"], cue["startMs"], cue["endMs"]
                )
                if word_captions and tokens:
                    tokens[0]["text"] = " " + tokens[0]["text"].lstrip()
                word_captions.extend(tokens)
    else:
        # Fallback proportional alignment if Edge TTS returns no boundary chunks
        word_captions = split_sentence_to_word_captions(script_text, 0, duration_ms)

    # Write Remotion @remotion/captions JSON
    out_json.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "voice": result["voice"],
        "durationMs": duration_ms,
        "durationInFrames": max(90, int((duration_ms / 1000.0) * args.fps) + args.fps * 2),
        "fps": args.fps,
        "sentences": raw_cues,
        "captions": word_captions,
    }
    out_json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    # Write WebVTT using SubMaker cues (or raw_cues)
    out_vtt.parent.mkdir(parents=True, exist_ok=True)
    vtt_lines = ["WEBVTT", ""]
    cues_for_vtt = raw_cues if raw_cues else word_captions
    for idx, cue in enumerate(cues_for_vtt, start=1):
        vtt_lines.append(str(idx))
        vtt_lines.append(f"{format_vtt_time(cue['startMs'])} --> {format_vtt_time(cue['endMs'])}")
        vtt_lines.append(cue["text"].strip())
        vtt_lines.append("")
    out_vtt.write_text("\n".join(vtt_lines), encoding="utf-8")

    mixed_duration_ms: Optional[int] = None
    if args.bgm and Path(args.bgm).exists():
        mixed_duration_ms = apply_bgm_ducking(
            voice_path=out_audio,
            bgm_path=Path(args.bgm),
            mixed_out_path=Path(args.out_mixed),
            cues=raw_cues or word_captions,
        )

    summary = {
        "ok": True,
        "voice": result["voice"],
        "audioPath": str(out_audio),
        "jsonPath": str(out_json),
        "vttPath": str(out_vtt),
        "durationMs": duration_ms,
        "recommendedFrames": payload["durationInFrames"],
        "captionCount": len(word_captions),
        "mixedAudioPath": str(args.out_mixed) if mixed_duration_ms else None,
    }
    print(json.dumps(summary, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
